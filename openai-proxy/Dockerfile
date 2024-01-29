FROM ghcr.io/berriai/litellm:main

COPY ./requirements.txt /app/requirements.txt

RUN apt-get update && apt-get install -y curl && pip install -r /app/requirements.txt

COPY ./litellm-config.yaml /app/proxy_server_config.yaml

