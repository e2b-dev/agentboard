from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import urllib.parse
from interpreter import interpreter
import e2b
import logging
from threading import Event
import time
import queue


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
        system_message = "# Follow this rule: Every Python code block MUST contain at least one print statement."

        # (E2B isn't a Jupyter Notebook, so we added ^ this so it would print things,
        # instead of putting variables at the end of code blocks, which is a Jupyter thing.)
        def run_python(self, sandbox, code, on_stdout, on_stderr, on_exit):
            epoch_time = time.time()
            codefile_path = f"/tmp/main-{epoch_time}.py"
            self.filesystem.write(codefile_path, code)

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
                        "content": out_queue.get_nowait()
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
    "`<filename>` is saved to disk. Download it here: [<filename>](/home/user/<filename>).". This will allow your boss to download the file.

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

logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

app = FastAPI()

"""
Test endpoint. Used to test if the server is running.
"""
@app.get("/helloworld")
def read_root():
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

class ChatMessage(BaseModel):
    message: str
@app.post("/chat")
def chat_endpoint(chat_message: ChatMessage, user_id):
    try:
        # connect to running sandbox - else return an error
        sandbox_id = None
        running_sandboxes = e2b.Sandbox.list()
        for running_sandbox in running_sandboxes:
            if running_sandbox.metadata.get("userID", "") == user_id:
                sandbox_id = running_sandbox.sandbox_id
                break
        if sandbox_id is None:
            return {"error": "No running sandbox found for user"}

        # keep alive the sandbox
        sandbox = e2b.Sandbox.reconnect(sandbox_id)
        sandbox.keep_alive(60*60) # max limit is 1 hour as of 2-13-24

        setup_interpreter(interpreter, sandbox_id)

        def event_stream():
            for result in interpreter.chat(chat_message.message, stream=True):
                
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
                        yieldval = "\n\n\n"
                        
                    yield f"data: {urllib.parse.quote(str(yieldval))}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except Exception as e:
        print("Exception: ", e)
        logger.error("Exception:", e)
        raise

# used when we want to let open interpreter know we uploaded a file
@app.post("/add_message_no_chat")
def add_message_no_chat(chat_message: ChatMessage):
    try:
        interpreter.messages.append({"role": "user", "type": "message", "content": chat_message.message})
        return {"status": "Message added"}
    except Exception as e:
        logger.error(e)
        raise

@app.get("/killchat")
def kill_chat():
    interpreter.reset()
    setup_interpreter(interpreter)
    return {"status": "Chat process terminated"}