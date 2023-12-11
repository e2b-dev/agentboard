# E2B Workflow

e2b Docker Build Command

```
e2b build --name "e2b-ois-image" 

```

Set OpenAI key when calling the sandbox, for example:

```
import { Sandbox } from '@e2b/sdk'

const sandbox = await Sandbox.create({
  template: 'base',
  envVars: {FOO: 'Hello'}, 
})

await sandbox.close()
```

# Local Workflow

Local Docker Build & Run command

```
docker build -t ois-image . && \
docker rm -f ois-container && \
docker run -d --name ois-container -p 8080:80 -e OPENAI_API_KEY=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 ois-image
```

Local Docker Exec command

```
docker exec -it $(docker ps -qf "name=ois-container") /bin/bash
```

Local Docker Logs command
```
docker logs $(docker ps -qf "name=ois-container")
```

# Todos:
1. Implement a web socket interactive interface so the user can check code runs instead of auto_run
2. Implement frontend that's web optimized for open interpreter - code blocks, active blocks, etc 
3. Include the open interpreter package locally in this directory vs pulling from remote every time I build the docker image which could break the app later.