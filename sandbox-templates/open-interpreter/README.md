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
cp dev.e2b.toml e2b.toml && e2b template build

```

======================================================================
# E2B Shell Workflow

Open a shell with the docker image to verify it's started
```
e2b sandbox spawn
```

Commands to check if anything went wrong
```
pgrep uvicorn
journalctl -u start_cmd.service
```

========================================================================
# Production E2B Workflow

e2b Docker Build Command

```
cp prod.e2b.toml e2b.toml && e2b template build

```