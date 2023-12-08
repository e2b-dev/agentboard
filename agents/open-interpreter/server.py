from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import interpreter

from pydantic import BaseModel
class ChatMessage(BaseModel):
    message: str


interpreter.auto_run = True

import logging
logging.basicConfig(level=logging.DEBUG)
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
                    
                    logger.debug(f"result: {result}")
                    if "code" in result:
                        yield f"data: {result['code']}\n\n"
                    elif "message" in result:
                        yield f"data: {result['message']}\n\n"
                    elif "language" in result:
                        yield f"data: {result['language']}\n\n\n"
                    elif "output" in result:
                        yield f"data: Output is {result['output']}\n\n\n"
                    elif "executing" in result:
                        yield f"data: Running...\n\n\n"
                    elif "start_of_code" in result:
                        yield f"data: ```\n\n"
                    elif "end_of_code" in result:
                        yield f"data: ```\n\n\n"
                    else:
                        yield f"data: \n\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        logger.error(e)
        raise
