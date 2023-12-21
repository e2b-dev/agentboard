===================================================================
# Local Docker Workflow

Local Docker Build & Run command

```
docker build -t ois-image . && \
docker rm -f ois-container && \
docker run -d --name ois-container -p 8080:80 ois-image
```

===================================================================
# Local Docker Debugging Workflow
Local Docker Exec command

```
docker exec -it $(docker ps -qf "name=ois-container") /bin/bash
```

Local Docker Logs command
```
docker logs $(docker ps -qf "name=ois-container")
```
======================================================================
# Local E2B Workflow

e2b Docker Build Command

```
cp local.e2b.toml e2b.toml && e2b build

```

======================================================================
# E2B Shell Workflow

Open a shell with the docker image to verify it's started
```
e2b shell
```

Get in there and start the uvicorn process
```
cd /code
OPENAI_API_KEY=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 uvicorn server:app --host 0.0.0.0 --port 8080 &
```

Commands to check if anything went wrong
```
pgrep uvicorn
journalctl -u start_cmd.service
```

Test /chatnostream endpoint:
```
curl -G http://localhost:8080/chatnostream --data-urlencode "message=your_message"
```

Test /killchat endpoint:
```
curl http://localhost:8080/killchat
```

Test /chat endpoint:
```
curl -X POST -H "Content-Type: application/json" -d '{"message":"How are you doing today?"}' http://localhost:8080/chat
```
========================================================================
# Production E2B Workflow

e2b Docker Build Command

```
cp prod.e2b.toml e2b.toml && e2b build

```