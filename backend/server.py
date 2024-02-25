import urllib.parse
import logging
import os
import time
import queue
from typing import List, Optional
from threading import Event

from fastapi import FastAPI, Header, HTTPException 
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from interpreter import interpreter
import e2b
from supabase import create_client

# Supabase client
supabase = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))
AI_START_TOKEN = "AI<ST>"
AI_END_TOKEN = "AI<ET>"


def PythonE2BFactory(sandbox_id):
    class PythonE2BSpecificSandbox():
        """
        This class contains all requirements for being a custom language in Open Interpreter:

        - name (an attribute)
        - run (a method)
        - stop (a method)
        - terminate (a method)

        Here, we'll use E2B to power the `run` method.
        """

        # This is the name that will appear to the LLM.
        name = "python"

        # Optionally, you can append some information about this language to the system message:
        system_message = """
        # Follow these rules
        1. Code blocks must be completely self contained - they can't rely on variables or imports from previous code blocks.
        """

        # (E2B isn't a Jupyter Notebook, so we added ^ this so it would print things,
        # instead of putting variables at the end of code blocks, which is a Jupyter thing.)
        def run_python(self, sandbox, code, on_stdout, on_stderr, on_exit):
            epoch_time = time.time()
            codefile_path = f"/tmp/main-{epoch_time}.py"
            sandbox.filesystem.write(codefile_path, code)

            return sandbox.process.start(
                f"python {codefile_path}",
                on_stdout=on_stdout,
                on_stderr=on_stderr,
                on_exit=on_exit,
        )
        def run(self, code):
            """Generator that yields a dictionary in LMC Format."""
            yield {
                "type": "console", "format": "output",
                "content": "Running code in E2B...\n"
            }

            exit_event = Event()
            out_queue = queue.Queue[e2b.ProcessMessage]()

            if sandbox_id is None: # Used only by the /chatnostream endpoint
                stdout, stderr = e2b.run_code('Python3', code)
                # Yield the output
                yield {
                    "type": "console", "format": "output",
                    "content": stdout + stderr # We combined these arbitrarily. Yield anything you'd like!
                }
            else:
                sandbox = e2b.Sandbox.reconnect(sandbox_id)

                self.run_python(
                    sandbox,
                    code,
                    on_stdout=out_queue.put_nowait,
                    on_stderr=out_queue.put_nowait,
                    on_exit=exit_event.set,
                )

            while not exit_event.is_set() or not out_queue.qsize() == 0:
                try:
                    yield {
                        "type": "console", "format": "output",
                        "content": out_queue.get_nowait().line
                    }
                    out_queue.task_done()
                except queue.Empty:
                    pass
        def stop(self):
            """Stops the code."""
            # Not needed here, because e2b.run_code isn't stateful.
            pass

        def terminate(self):
            """Terminates the entire process."""
            # Not needed here, because e2b.run_code isn't stateful.
            pass
    
    return PythonE2BSpecificSandbox

def setup_interpreter(the_interpreter, sandbox_id=None):
    the_interpreter.auto_run = True
    the_interpreter.llm.model = "gpt-4-0125-preview"
    the_interpreter.computer.terminate()

    # Give Open Interpreter its languages. This will only let it run PythonE2B:
    the_interpreter.computer.languages = [PythonE2BFactory(sandbox_id)]

    # Try it out!
    the_interpreter.system_message = """    

    # Who You Are
    You are a world-class programmer that can complete any goal or ask by executing code. 
    
    In other words, when you execute code, it will be executed **in a remote, sandboxed environment**. 

    You are solving problems for your boss. Every time you solve a problem, you will get a $100,000 bonus. If you fail, you will be disciplined. All following prompts are from your boss.
    
    # How to Solve Problems
    First, write a plan. **Always recap the plan between each code block** (you have extreme short-term memory loss, so you need to recap the plan between each message block to retain it).
    The simpler the plan, the better, but it should include all of the steps necessary to accomplish the goal. 
            
    If you code is in a *stateful* language (such python, javascript, shell, but NOT for html which starts from 0 every time) **it's critical not to try to do everything in one code block.** 
    
    You should try something, print information about it, continue the plan in the steps you laid out earlier until the goal is accomplished.
    You will never get it on the first try, and attempting it in one go will often lead to errors you cant see.
    
    Never stop halfway through accomplishing your plan. 

    When the goal has been accomplished, tell your boss that you're done.

    Whenever a file (referred to as <filename>) is written to disk, ALWAYS let your boss know by using this EXACT syntax with no deviations:
    "`<filename>` is saved to disk. Download it here: [<filename>](/home/user/<filename>)." This will allow your boss to download the file.

    Write messages to your boss in Markdown.
    
    # Your Capabilities
    Your boss has given you **full and complete permission** to execute any code necessary to complete the task. 
    
    If you want to send data between programming languages, save the data to a txt or json.
    
    You can access the internet. Run **any code** to achieve the goal, and if at first you don't succeed, try again and again.
    
    You can install new packages.
        
    # Tips
    You already have a few packages installed for you: ffmpeg and yt-dlp. You can use them to download and process some types of video and audio data. Avoid using youtube-dl since its no longer maintained.

    When your boss refers to a filename, they're likely referring to an existing file in the directory you're currently executing code in.

    """

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
origins = [
    "http://localhost:3000",
    "https://agentboard.dev",
    "https://agentboard-git-staging-e2b.vercel.app",
    "https://agentboard-git-dev-e2b.vercel.app",
    "https://agentboard-git-gce-refactor-e2b.vercel.app"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

"""
Test endpoint. Used to test if the server is running.
"""
@app.get("/helloworld")
def hello_world():
    try:
        return {"Hello": "World"}
    except Exception as e:
        logger.error(e)
        raise

"""
Test endpoint. Uses e2b.run_code(), so not stateful and not user-specific.
"""
@app.get("/chatnostream")
def chat_endpoint_non_stream(message: str):
    try:
        setup_interpreter(interpreter)
        return interpreter.chat(message)
    except Exception as e:
        logger.error(e)
        raise


async def user_id_for_token(token: str) -> Optional[str]:
    """
    Authenticate the token with Supabase and return the user ID if valid.
    """
    # Remove 'Bearer ' prefix if present
    if token.startswith("Bearer "):
        token = token[7:]
        logger.info(f"Request Token: {token}")
    # Verify the token with Supabase
    try:
        data = supabase.auth.get_user(token)
        if data:
            return data.user.id
    except Exception as e:
        logger.error(f"Supabase error when exchanging token for user id: {e}")
        return None

def sandbox_id_for_user_id(user_id: str):
    """
    Search running sandboxes for the user's sandbox
    """
    running_sandboxes = e2b.Sandbox.list()
    for running_sandbox in running_sandboxes:
        if running_sandbox.metadata and running_sandbox.metadata.get("userID", "") == user_id:
            return running_sandbox.sandbox_id
    return None

class UserMessage(BaseModel):
    role: str
    content: str
class ChatRequest(BaseModel):
    messages: List[UserMessage]
@app.post("/chat")
async def chat_endpoint(chat_request: ChatRequest, authorization: str = Header(None)):
    try:
        if not authorization:
            logger.error("No authorization header")
            raise HTTPException(status_code=401, detail="No authorization header")

        # Exchange token for user ID 
        start_time = time.time()
        user_id = await user_id_for_token(authorization)
        if not user_id:
            logger.error("Invalid token")
            raise HTTPException(status_code=401, detail="Invalid token") 
        logger.info(f"Time to get user id: {time.time() - start_time}")

        # Exchange user ID for sandbox ID
        start_time = time.time()
        sandbox_id = sandbox_id_for_user_id(user_id)
        if sandbox_id is None:
            return {"error": "No running sandbox found for user"}
        logger.info(f"Time to get sandbox id: {time.time() - start_time}")

        # Connect to the sandbox, keep it alive, and setup interpreter
        start_time = time.time()
        sandbox = e2b.Sandbox.reconnect(sandbox_id)
        sandbox.keep_alive(60*60) # max limit is 1 hour as of 2-13-24
        setup_interpreter(interpreter, sandbox_id)
        logger.info(f"Time to connect to sandbox, keep alive, and setup interpreter: {time.time() - start_time}")

        def event_stream(start_time):
            first_response_sent = False
            for result in interpreter.chat(chat_request.messages[-1].content, stream=True):
                
                print("Result: ", result)
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
                        elif 'format' in result and result["format"] == 'output':
                            yieldval = result["content"]
                    else:
                        logger.info(f"UNEXPECTED TYPE: {result['type']}")
                        logger.info(f"FULL RESULT OF UNEXPECTED TYPE: {result}")
                    if not first_response_sent:
                        first_response_sent = True
                        logger.info(f"/chat: First response sent in {time.time() - start_time}")
                    yield f"{AI_START_TOKEN}{urllib.parse.quote(str(yieldval))}{AI_END_TOKEN}"

        start_time = time.time()
        return StreamingResponse(event_stream(start_time), media_type="text/event-stream")
    except Exception as e:
        print("Exception: ", e)
        logger.error("Exception:", e)
        raise

'''
TODO: THIS IS FALSE, SERVER CALLS MUST BE STATELESS OTHERWISE USERS WILL ACCESS 
EACH OTHERS MESSAGES. SO WE MUST FIND A WAY TO SYNC MESSAGE HISTORY WITH EVERY CALL,
AND GET RID OF THIS FUNCTION
==
This is used to notify Open Interpreter that we've uploaded a file to the E2B filesystem.
We can't just sync the frontend message history with Open Interpreter with every /chat, 
because Open Interpreter adds an extra field "type" to its message history.

So it's best to let Open Interpreter manage its own message history, and we'll just take care of adding this one manually.
'''
class ChatMessage(BaseModel):
    message: str
@app.post("/add_message_no_chat")
def add_message_no_chat(chat_message: ChatMessage):
    try:
        interpreter.messages.append({"role": "user", "type": "message", "content": chat_message.message})
        return {"status": "Message added to interpreter"}
    except Exception as e:
        logger.error(e)
        raise
@app.get("/killchat")
def kill_chat():
    interpreter.reset()
    setup_interpreter(interpreter)
    return {"status": "Chat process terminated"}