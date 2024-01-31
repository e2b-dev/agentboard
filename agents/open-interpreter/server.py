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
    the_interpreter.llm.api_base = "https://proxy-rotps5n5ja-uc.a.run.app/v1"
    the_interpreter.auto_run = True
    the_interpreter.llm.model = "gpt-4-0125-preview"
    # Alternative first sentence: You are a world-class programmer that can complete any goal or task by executing code.
    # Potentially delete? In general, try to **make plans** with as few steps as possible. 
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

setup_interpreter(interpreter)

import logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.get("/helloworld")
def read_root():
    print(interpreter.system_message)
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