from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import interpreter

from pydantic import BaseModel

import urllib.parse



class ChatMessage(BaseModel):
    message: str


interpreter.auto_run = True

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.get("/helloworld")
def read_root():
    try:
        return {"Hello": "World"}
    except Exception as e:
        logger.error(e)
        raise

@app.post("/chat")
def chat_endpoint(chat_message: ChatMessage):
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
