FROM ghcr.io/berriai/litellm:main

COPY ./litellm-config.yaml /app/proxy_server_config.yaml

RUN apt-get update && apt-get install -y curl

RUN pip install fastapi rq anyio exceptiongroup idna annotated-types pydantic-core async-timeout orjson
