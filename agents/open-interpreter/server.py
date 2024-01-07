from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import urllib.parse
import sys
# Why are we pausing for two seconds? Because E2B containers take a while to open up their internet connections,
# and 'import interpreter' will fail since it require internet access.
import time
time.sleep(2)

from interpreter import interpreter

def setup_interpreter(the_interpreter):
    the_interpreter.llm.model = "gpt-3.5-turbo"
    the_interpreter.llm.api_base = "https://proxy-rotps5n5ja-uc.a.run.app/v1"
    the_interpreter.auto_run = True
    the_interpreter.system_message += """
    Whenever a file is written to disk, ALWAYS let the user know by using this EXACT syntax with no deviations:
    "`<filename>` is saved to disk. Download it here: [<filename>](sandbox://path/to/file.txt)." If the user asks
    to download a file, respond with a similar syntax: "Download it here: [<filename>](sandbox://path/to/file.txt)." 
    """

setup_interpreter(interpreter)

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

class ChatMessage(BaseModel):
    message: str
@app.post("/chat")
def chat_endpoint(chat_message: ChatMessage):
    try:

        def event_stream():
            for result in interpreter.chat(chat_message.message, stream=True):
                
                if result:
                    # get the first key and value in separate variables
                    yieldval = ""

                    if result["type"] == "code":
                        if "start" in result and result["start"]:
                            yieldval = f"\n```{result['format']}\n"
                        elif "end" in result and result["end"]:
                            yieldval = "\n```\n"
                        else:
                            yieldval = result["content"]
                    elif result["type"] == "message":
                        if "content" in result and result["content"]:
                            yieldval = result["content"]
                    elif result["type"] == "console":
                        if 'format' in result and result["format"] == 'output':
                            yieldval = "\nOutput: `" + result["content"] + "`\n"
                    else:
                        yieldval = "\n\n\n"
                        
                    yield f"data: {urllib.parse.quote(str(yieldval))}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        logger.error(e)
        raise

@app.get("/killchat")
def kill_chat():
    interpreter.reset()
    setup_interpreter(interpreter)
    return {"status": "Chat process terminated"}