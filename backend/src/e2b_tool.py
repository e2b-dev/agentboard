import queue
import threading
import time
from threading import Event
from typing import Callable

from e2b_code_interpreter import CodeInterpreter

from src.settings import TIMEOUT


def e2b_factory(sandbox_id):
    class PythonE2BSpecificSandbox:
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
        You have access to python and internet, you can do whatever you want
        """

        @staticmethod
        def run_in_background(
            code, on_message: Callable[[str], None], on_exit: Callable[[], None]
        ):
            with CodeInterpreter.reconnect(sandbox_id) as sandbox:
                execution = sandbox.notebook.exec_cell(
                    code,
                    on_stdout=lambda m: on_message(f"[stdout] {m.line}"),
                    on_stderr=lambda m: on_message(f"[stderr] {m.line}"),
                )

            if execution.error:
                message = f"There was an error during execution: {execution.error.name}: {execution.error.value}.\n{execution.error.traceback}"
            elif execution.results:
                message = "These are results of the execution:\n"
                for i, result in enumerate(execution.results):
                    message += f"Result {i + 1}:\n"
                    if result.is_main_result:
                        message += f"[Main result]: {result.text}\n"
                    else:
                        message += f"[Display data]: {result.text}\n"
                    if result.formats():
                        message += f"It has also following formats: {result.formats()}\n"
            elif execution.logs.stdout or execution.logs.stderr:
                message = "Execution finished without any additional results"
            else:
                message = "There was no output of the execution."

            on_message(message)
            on_exit()

        def run(self, code):
            """Generator that yields a dictionary in LMC Format."""
            yield {
                "type": "console",
                "format": "output",
                "content": "Running code in E2B...\n",
            }

            exit_event = Event()
            out_queue = queue.Queue[str]()

            threading.Thread(
                target=self.run_in_background,
                args=(
                    code,
                    lambda message: out_queue.put(message),
                    lambda: exit_event.set(),
                ),
            ).start()
            start_time = time.time()
            while not exit_event.is_set() or not out_queue.qsize() == 0:
                if time.time() - start_time > TIMEOUT:
                    yield {
                        "type": "console",
                        "format": "output",
                        "content": "Code execution timed out.\n",
                    }
                    break
                try:
                    yield {
                        "type": "console",
                        "format": "output",
                        "content": out_queue.get_nowait() + "\n",
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
