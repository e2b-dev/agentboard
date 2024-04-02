# Agentboard Backend

Uses [Open Interpreter](https://github.com/OpenInterpreter/open-interpreter) running the code in [e2b](https://github.com/e2b-dev/E2B) sandboxes.

##  Running backend locally

1. Make sure you have the correct `.env` file.
2. Install the dependencies with `poetry install` (if you don't have poetry, here's an [installation guide](https://python-poetry.org/docs/#installation).
3. Run the backend with `uvicorn main:app --reload --port 8080`.
