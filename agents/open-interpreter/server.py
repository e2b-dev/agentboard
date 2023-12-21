from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import urllib.parse
import sys
# Why are we pausing for two seconds? Because E2B containers take a while to open up their internet connections,
# and 'import interpreter' will fail since it require internet access.
import time
time.sleep(2)

import interpreter

def setup_interpreter(the_interpreter, apiKey=None):
    the_interpreter.api_key = apiKey
    the_interpreter.auto_run = True
    the_interpreter.model = "gpt-3.5-turbo"
    the_interpreter.system_message += """
    Whenever a file is written to disk, ALWAYS let the user know by using this EXACT syntax with no deviations:
    "`<filename>` is saved to disk. Download it here: [<filename>](sandbox://path/to/file.txt)." If the user asks
    to download a file, respond with a similar syntax: "Download it here: [<filename>](sandbox://path/to/file.txt)." 
    """

setup_interpreter(interpreter)

class ChatMessage(BaseModel):
    message: str

class SandboxAPIKey(BaseModel):
    apiKey: str

import logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.get("/helloworld")
def read_root():
    try:
        return {"Hello": "World"}
    except Exception as e:
        logger.error(e)
        raise

@app.get("/chatnostream")
def chat_endpoint_non_stream(message: str):
    try:
        return interpreter.chat(message)
    except Exception as e:
        logger.error(e)
        raise

@app.post("/chat")
def chat_endpoint(chat_message: ChatMessage, openai_api_key: SandboxAPIKey):
    if(interpreter.api_key == None):
        interpreter.api_key = openai_api_key.apiKey
    try:
        message = chat_message.message

        def event_stream():
            for result in interpreter.chat(message, stream=True):
                
                if result:
                    # get the first key and value in separate variables
                    key = next(iter(result))
                    value = result[key]
                    yieldval = ""

                    if key == "code":
                        yieldval = value
                    elif key == "message":
                        yieldval = value
                    elif key == "language":
                        yieldval = value + "\n"
                    elif key == "output":
                        yieldval = "\nOutput: `" + value + "`\n"
                    elif key == "executing":
                        yieldval = "\nRunning...\n"
                    elif key == "start_of_code":
                        yieldval = "\n```"
                    elif key == "end_of_code":
                        yieldval = "\n```\n"
                    else:
                        yieldval = "\n\n\n"
                        
                    yield f"data: {urllib.parse.quote(str(yieldval))}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        logger.error(e)
        raise

@app.post("/killchat")
def kill_chat(openai_api_key: SandboxAPIKey):
    interpreter.reset()
    setup_interpreter(interpreter, openai_api_key.apiKey)
    return {"status": "Chat process terminated"}