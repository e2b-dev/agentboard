FROM python:3.11-buster as builder


ENV \
    # Poetry
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_CACHE_DIR=/tmp/poetry_cache \
    POETRY_VERSION=1.8.1 \
    POETRY_HOME="/opt/poetry" \
    # Python envs
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    # Pip
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    # Venv
    VIRTUAL_ENV="/venv"

ENV PATH="$POETRY_HOME/bin:$VIRTUAL_ENV/bin:$PATH"
ENV PYTHONPATH="/app:$PYTHONPATH"


RUN curl -sSL https://install.python-poetry.org | python \
    # configure poetry & make a virtualenv ahead of time since we only need one
    && python -m venv $VIRTUAL_ENV

WORKDIR /code
COPY poetry.lock pyproject.toml ./

RUN poetry install --no-root --only main && rm -rf $POETRY_CACHE_DIR

COPY ./src src
COPY ./server.py server.py

ENTRYPOINT [ "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
