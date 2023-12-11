FROM python:3.11

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

COPY ./open_interpreter /code/open_interpreter

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./server.py /code/server.py

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "80"]
