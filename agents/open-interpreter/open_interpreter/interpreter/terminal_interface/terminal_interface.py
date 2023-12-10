"""
The terminal interface is just a view. Just handles the very top layer.
If you were to build a frontend this would be a way to do it
"""

try:
    import readline
except ImportError:
    pass

import base64
import random
import re
import logging

from ..core.utils.scan_code import scan_code
from ..core.utils.system_debug_info import system_info
from ..core.utils.truncate_output import truncate_output
from .components.code_block import CodeBlock
from .components.message_block import MessageBlock
from .magic_commands import handle_magic_command
from .utils.check_for_package import check_for_package
from .utils.display_markdown_message import display_markdown_message
from .utils.display_output import display_output
from .utils.find_image_path import find_image_path

# Add examples to the readline history
examples = [
    "How many files are on my desktop?",
    "What time is it in Seattle?",
    "Make me a simple Pomodoro app.",
    "Open Chrome and go to YouTube.",
]
# random.shuffle(examples)
for example in examples:
    readline.add_history(example)


def terminal_interface(interpreter, message):
    # Auto run and local don't display messages.
    # Probably worth abstracting this to something like "verbose_cli" at some point.
    if not interpreter.auto_run and not interpreter.local:
        interpreter_intro_message = [
            "**Open Interpreter** will require approval before running code."
        ]

        if interpreter.safe_mode == "ask" or interpreter.safe_mode == "auto":
            if not check_for_package("semgrep"):
                interpreter_intro_message.append(
                    f"**Safe Mode**: {interpreter.safe_mode}\n\n>Note: **Safe Mode** requires `semgrep` (`pip install semgrep`)"
                )
        else:
            interpreter_intro_message.append("Use `interpreter -y` to bypass this.")

        interpreter_intro_message.append("Press `CTRL-C` to exit.")

        display_markdown_message("\n\n".join(interpreter_intro_message) + "\n")

    active_block = None

    if message:
        interactive = False
    else:
        interactive = True

    while True:
        print("new loop")
        try:
            if interactive:
                message = input("> ").strip()

                try:
                    # This lets users hit the up arrow key for past messages
                    readline.add_history(message)
                except:
                    # If the user doesn't have readline (may be the case on windows), that's fine
                    pass

        except KeyboardInterrupt:
            # Exit gracefully
            break

        if message.startswith("%") and interactive:
            handle_magic_command(interpreter, message)
            continue

        # Many users do this
        if message.strip() == "interpreter --local":
            print("Please press CTRL-C then run `interpreter --local`.")
            continue

        if interpreter.vision:
            # Is the input a path to an image? Like they just dragged it into the terminal?
            image_path = find_image_path(message)

            ## If we found an image, add it to the message
            if image_path:
                if interpreter.debug_mode:
                    print("Found image:", image_path)
                # Turn it into base64
                with open(image_path, "rb") as image_file:
                    encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
                file_extension = image_path.split(".")[-1]
                message = {
                    "role": "user",
                    "message": message,
                    "image": f"data:image/{file_extension};base64,{encoded_string}",
                }

        # Track if we've ran a code block.
        # We'll use this to determine if we should render a new code block,
        # In the event we get code -> output -> code again
        ran_code_block = False
        render_cursor = True

        try:
            for chunk in interpreter.chat(message, display=False, stream=True):
                if interpreter.debug_mode:
                    print("Chunk in `terminal_interface`:", chunk)

                # Message
                if "message" in chunk:
                    if active_block is None:
                        active_block = MessageBlock()
                    if active_block.type != "message":
                        active_block.end()
                        active_block = MessageBlock()
                    active_block.message += chunk["message"]
                    render_cursor = True

                # Code
                if "code" in chunk or "language" in chunk:
                    if active_block is None:
                        active_block = CodeBlock()
                    if active_block.type != "code" or ran_code_block:
                        # If the last block wasn't a code block,
                        # or it was, but we already ran it:
                        active_block.end()
                        active_block = CodeBlock()
                    ran_code_block = False
                    render_cursor = True

                if "language" in chunk:
                    active_block.language = chunk["language"]
                if "code" in chunk:
                    active_block.code += chunk["code"]
                if "active_line" in chunk:
                    active_block.active_line = chunk["active_line"]

                # Execution notice
                if "executing" in chunk:
                    if not interpreter.auto_run:
                        # OI is about to execute code. The user wants to approve this

                        # End the active block so you can run input() below it
                        active_block.end()

                        should_scan_code = False

                        if not interpreter.safe_mode == "off":
                            if interpreter.safe_mode == "auto":
                                should_scan_code = True
                            elif interpreter.safe_mode == "ask":
                                response = input(
                                    "  Would you like to scan this code? (y/n)\n\n  "
                                )
                                print("")  # <- Aesthetic choice

                                if response.strip().lower() == "y":
                                    should_scan_code = True

                        if should_scan_code:
                            # Get code language and actual code from the chunk
                            # We need to give these to semgrep when we start our scan
                            language = chunk["executing"]["language"]
                            code = chunk["executing"]["code"]

                            scan_code(code, language, interpreter)

                        response = input(
                            "  Would you like to run this code? (y/n)\n\n  "
                        )
                        print("")  # <- Aesthetic choice

                        if response.strip().lower() == "y":
                            # Create a new, identical block where the code will actually be run
                            # Conveniently, the chunk includes everything we need to do this:
                            active_block = CodeBlock()
                            active_block.margin_top = False  # <- Aesthetic choice
                            active_block.language = chunk["executing"]["language"]
                            active_block.code = chunk["executing"]["code"]
                        else:
                            # User declined to run code.
                            interpreter.messages.append(
                                {
                                    "role": "user",
                                    "message": "I have declined to run this code.",
                                }
                            )
                            break

                if "image" in chunk or "html" in chunk or "javascript" in chunk:
                    # Good to keep the LLM informed <3
                    message_for_llm = display_output(chunk)
                    if message_for_llm:
                        if "output" in interpreter.messages[-1]:
                            interpreter.messages[-1]["output"] += "\n" + message_for_llm
                        else:
                            interpreter.messages[-1]["output"] = message_for_llm

                        # I know this is insane, but the easiest way to now display this
                        # is to set the chunk to an output chunk, which will trigger the next conditional!

                        chunk = {"output": message_for_llm}

                # Output
                if "output" in chunk:
                    ran_code_block = True
                    render_cursor = False
                    active_block.output += "\n" + chunk["output"]
                    active_block.output = (
                        active_block.output.strip()
                    )  # <- Aesthetic choice

                    # Truncate output
                    active_block.output = truncate_output(
                        active_block.output, interpreter.max_output
                    )

                if active_block:
                    active_block.refresh(cursor=render_cursor)

                yield chunk

            # (Sometimes -- like if they CTRL-C quickly -- active_block is still None here)
            if active_block:
                active_block.end()
                active_block = None

            if not interactive:
                # Don't loop
                break

        except KeyboardInterrupt:
            # Exit gracefully
            if active_block:
                active_block.end()
                active_block = None

            if interactive:
                # (this cancels LLM, returns to the interactive "> " input)
                continue
            else:
                break
        except:
            system_info(interpreter)
            raise
