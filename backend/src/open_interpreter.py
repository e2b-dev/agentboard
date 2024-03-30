from typing import Annotated

from e2b import Sandbox
from fastapi import Security
from interpreter import OpenInterpreter

from src.auth import get_current_user
from src.e2b_tool import e2b_factory


def setup_interpreter(the_interpreter: OpenInterpreter, sandbox_id):
    the_interpreter.auto_run = True
    the_interpreter.llm.model = "gpt-3.5-turbo-0125"
    the_interpreter.llm.max_tokens = 4096
    the_interpreter.llm.context_window = 16385
    the_interpreter.computer.terminate()

    # Give Open Interpreter its languages. This will only let it run PythonE2B:
    the_interpreter.computer.languages = [e2b_factory(sandbox_id)]

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

    When the user refers to a filename, they're almost always referring to an existing file in the /home/user directory.
    """


def sandbox_id_for_user_id(user_id: str):
    """
    Search running sandboxes for the user's sandbox
    """
    running_sandboxes = Sandbox.list()
    for running_sandbox in running_sandboxes:
        if (
            running_sandbox.metadata
            and running_sandbox.metadata.get("userID", "") == user_id
        ):
            return running_sandbox.sandbox_id
    return None


def get_interpreter():
    """
    This ensures that an interpreter instance is created for each request.
    """
    def dependency(user_id: Annotated[str, Security(get_current_user)]):
        # Exchange user ID for sandbox ID
        sandbox_id = sandbox_id_for_user_id(user_id)
        if sandbox_id is None:
            return {"error": "No running sandbox found for user"}

        # Connect to the sandbox, keep it alive, and setup interpreter
        with Sandbox.reconnect(sandbox_id) as sandbox:
            sandbox.keep_alive(60 * 60)  # max limit is 1 hour as of 2-13-24

        new_interpreter = OpenInterpreter()
        setup_interpreter(new_interpreter, sandbox_id)
        yield new_interpreter

    return dependency
