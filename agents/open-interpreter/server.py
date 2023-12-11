from fastapi import FastAPI
from fastapi.responses import StreamingResponse

# import open interpreter locally
stopped = True
interpreter = None

from pydantic import BaseModel

import urllib.parse


class ChatMessage(BaseModel):
    message: str

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
    global stopped
    global interpreter
    if stopped:
        from open_interpreter.interpreter import create_interpreter
        new_interpreter = create_interpreter()
        new_interpreter.auto_run = True
        interpreter = new_interpreter
    try:
        return interpreter.chat(message)
    except Exception as e:
        logger.error(e)
        raise

@app.post("/chat")
def chat_endpoint(chat_message: ChatMessage):
    global stopped
    global interpreter
    if stopped:
        from open_interpreter.interpreter import create_interpreter
        new_interpreter = create_interpreter()
        new_interpreter.auto_run = True
        interpreter = new_interpreter
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

@app.get("/killchat")
def kill_chat():
    global stopped
    global interpreter
    logger.info("Killing chat process")
    interpreter.reset()
    stopped = True
    return {"status": "Chat process terminated"}