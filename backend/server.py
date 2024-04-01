import urllib.parse
import logging
from typing import List, Annotated

from fastapi import FastAPI, Depends, Security
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


from interpreter.core.core import OpenInterpreter

from src.auth import get_current_user
from src.open_interpreter import get_interpreter
from src.settings import posthog, models


class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return record.args and len(record.args) >= 3 and record.args[2] != "/health"


logging.basicConfig(
    level=logging.INFO, format="%(levelname)s - %(asctime)s - %(message)s"
)
logger = logging.getLogger(__name__)
# Add filter to the logger
logging.getLogger("uvicorn.access").addFilter(EndpointFilter())


app = FastAPI()
origins = [
    "http://localhost:3000",
    "https://agentboard.dev",
    "https://www.agentboard.dev",
    "https://agentboard-git-staging-e2b.vercel.app",
    "https://agentboard-git-dev-e2b.vercel.app",
    "https://agentboard-git-gce-refactor-e2b.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """
    Health check endpoint.
    """
    return {"status": "ok"}


class UserMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[UserMessage]
    agent: str
    model: str


@app.post("/chat")
async def chat_endpoint(
    chat_request: ChatRequest,

    user_id: Annotated[str, Security(get_current_user)],
    interpreter: OpenInterpreter = Depends(get_interpreter()),
):
    model = chat_request.model
    if model not in models:
        raise Exception(f"Model {model} not found")
    interpreter.llm.model = models[model]

    agent = chat_request.agent
    if agent != "OPEN_INTERPRETER":
        raise Exception(f"Agent {agent} not found")

    # set messages to make this truly stateless
    logger.debug("chat_request.messages: " + str(chat_request.messages))
    if len(chat_request.messages) > 1:
        interpreter.messages = [
            {"role": x.role, "type": "message", "content": x.content}
            for x in chat_request.messages[:-1]
        ]
    else:
        interpreter.messages = []

    logger.debug(
        "Interpreter messages before interpreter.chat():"
        + str(interpreter.messages)
    )

    # record PostHog analytics
    posthog.capture(
        user_id,
        "chat_message_sent",
        {"messages": chat_request.messages[-1].content},
    )

    def event_stream():
        for result in interpreter.chat(
            chat_request.messages[-1].content, stream=True, display=False
        ):
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
                    if "start" in result and result["start"]:
                        yieldval = f"\n```shell output-bash\n"
                    elif "end" in result and result["end"]:
                        yieldval = "\n```\n"
                    elif "format" in result and result["format"] == "output":
                        yieldval = result["content"]
                elif result["type"] == "confirmation":
                    pass
                else:
                    raise Exception(f"Unknown result type: {result['type']}")
                yield f"{urllib.parse.quote(str(yieldval))}"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
