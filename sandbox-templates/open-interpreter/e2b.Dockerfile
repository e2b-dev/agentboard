FROM python:3.11

COPY ./requirements.txt /code/requirements.txt

COPY ./agentboard-example.jpg /home/user/agentboard-example.jpg

COPY ./Cities.csv /home/user/Cities.csv

RUN apt-get update && apt-get install -y ffmpeg

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt