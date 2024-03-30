import queue
import time
from threading import Event

from e2b import Sandbox, ProcessMessage

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
                "type": "console",
                "format": "output",
                "content": "Running code in E2B...\n",
            }

            exit_event = Event()
            out_queue = queue.Queue[ProcessMessage]()

            with Sandbox.reconnect(sandbox_id) as sandbox:
                self.run_python(
                    sandbox,
                    code,
                    on_stdout=out_queue.put_nowait,
                    on_stderr=out_queue.put_nowait,
                    on_exit=exit_event.set,
                )

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
                            "content": out_queue.get_nowait().line + '\n',
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
