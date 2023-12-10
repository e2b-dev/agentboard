import traceback

from .rag.get_relevant_procedures_string import get_relevant_procedures_string
from .utils.get_user_info_string import get_user_info_string


def generate_system_message(interpreter):
    """
    Dynamically generate a system message.

    Takes an interpreter instance,
    returns a string.

    This is easy to replace!
    Just swap out `interpreter.generate_system_message` with another function.
    """

    #### Start with the static system message

    system_message = interpreter.system_message

    #### Add dynamic components, like the user's OS, username, relevant procedures, etc

    system_message += "\n" + get_user_info_string()

    if not interpreter.local and not interpreter.disable_procedures:
        try:
            system_message += "\n" + get_relevant_procedures_string(
                interpreter.messages
            )
        except:
            if interpreter.debug_mode:
                print(traceback.format_exc())
            # It's okay if they can't. This just fixes some common mistakes it makes.

    return system_message
