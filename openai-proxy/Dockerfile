FROM python:3.11

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./litellm-config.yaml /code/litellm-config.yaml

CMD ["litellm", "--config", "litellm-config.yaml", "--debug"]
