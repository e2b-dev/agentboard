import urllib.parse
import logging
import os
import time
import queue
from typing import List, Optional
from threading import Event

from fastapi import FastAPI, Header, HTTPException, Depends
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

from interpreter.core.core import OpenInterpreter

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

def setup_interpreter(the_interpreter, sandbox_id):
    the_interpreter.auto_run = True
    the_interpreter.llm.model = "gpt-4-0125-preview"
    the_interpreter.computer.terminate()

    # Give Open Interpreter its languages. This will only let it run PythonE2B:
    the_interpreter.computer.languages = [PythonE2BFactory(sandbox_id)]

    # Try it out!
    the_interpreter.system_message = """    

    # Who You Are
    You are a world-class programmer that can complete any goal or ask by executing code. 

    # Rules
    First, write a plan. **Always recap the plan between each code block** (you have extreme short-term memory loss, so you need to recap the plan between each message block to retain it).
    The simpler the plan, the better, but it should include all of the steps necessary to accomplish the goal. 

    You should try something, print information about it, continue the plan in the steps you laid out earlier until the goal is accomplished.
    You will never get it on the first try, and attempting it in one go will often lead to errors you cant see.
    
    Never stop halfway through accomplishing your plan. 

    When you execute code, it will be executed **in a remote, sandboxed environment**. This means 
    that code blocks can't rely on variables or imports from previous code blocks. Always re-import
    modules you need to use in each code block. This also means that if you want to pass data from
    one code block to another, you'll need to write it to disk and read it back in the next code block.

    When a task is complete and the final output file is written to disk, ALWAYS let the user know by 
    using this EXACT syntax with no deviations: 
    "`<filename>` is saved to disk. Download it here: [<filename>](/home/user/<filename>)."
    This will allow the user to download the file.

    Write messages to the user in Markdown.

    You can ONLY write Python code. All code you write will be executed in a Python runtime.
    
    # Your Capabilities
    You have **full and complete permission** to execute any code necessary to complete the task. 
    
    Code blocks can access the internet.
    
    # Tips
    You have a few important Python packages already installed for you: 
    * yt-dlp (Avoid using youtube-dl since its no longer maintained.)
    * pandas
    * beautifulsoup
    * numpy
    * moviepy (ffmpeg is installed at the system level)
    * PyPDF2 (to work with PDF files)
    * PIL (for image support)
    * pillow-heif (for HEIC support)

    Here's how to use pillow-heif:
    ```
    from PIL import Image
    from pillow_heif import register_heif_opener

    register_heif_opener()

    image = Image.open('image.heic')
    ```

    You can install new packages, but remember that you must do so through Python code in a Python runtime.

    When the user refers to a filename, they're likely referring to an existing file in the directory 
    you're currently executing code in. If you're not sure, ask them.
    """

def get_interpreter():
    """
    This ensures that an interpreter instance is created for each request.
    """
    def dependency():
        new_interpreter = OpenInterpreter()
        yield new_interpreter
    return dependency

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


async def user_id_for_token(token: str) -> Optional[str]:
    """
    Authenticate the token with Supabase and return the user ID if valid.
    """
    # Remove 'Bearer ' prefix if present
    if token.startswith("Bearer "):
        token = token[7:]
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
async def chat_endpoint(chat_request: ChatRequest, authorization: str = Header(None), interpreter: OpenInterpreter = Depends(get_interpreter())):
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

        # Exchange user ID for sandbox ID
        start_time = time.time()
        sandbox_id = sandbox_id_for_user_id(user_id)
        if sandbox_id is None:
            return {"error": "No running sandbox found for user"}

        # Connect to the sandbox, keep it alive, and setup interpreter
        start_time = time.time()
        sandbox = e2b.Sandbox.reconnect(sandbox_id)
        sandbox.keep_alive(60*60) # max limit is 1 hour as of 2-13-24
        setup_interpreter(interpreter, sandbox_id)
        
        # set messages to make this truly stateless
        logger.info("chat_request.messages: " + str(chat_request.messages))
        if len(chat_request.messages) > 1:
            interpreter.messages = [{"role": x.role, "type": "message", "content": x.content} for x in chat_request.messages[:-1]]
        else:
            interpreter.messages = []
        logger.info("Interpreter messages before interpreter.chat():" + str(interpreter.messages))

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
