from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import interpreter

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

@app.get("/chat")
def chat_endpoint(message: str):
    try:
        def event_stream():
            for result in interpreter.chat(message, stream=True):
                if result:
                    logger.debug(f"result: {result}")
                    yield f"data: {result}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        logger.error(e)
        raise
