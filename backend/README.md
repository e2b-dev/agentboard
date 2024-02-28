
# Connect to VM via SSH
```
gcloud compute ssh --zone "us-central1-a" "instance-1" --project "agentboard-prod"
```

# Test load balancer test endpoint
```
curl https://api.agentboard.dev/helloworld
```

Three testing modes:
1. Local client, local backend
2. Local client, hosted backend
3. Preview client, hosted backend

# Local Client, Local Backend
1. Start the client. `nextjsapp/`, run
```
pnpm dev
```
2. Build the docker container locally. In `backend/`, run 
```
docker build -t us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server:prod .
```
3. Run the docker container locally. In `backend/`, run 
```
docker rm -f ois-container && docker run -d --name ois-container -p 8080:80 -e OPENAI_API_KEY=$OPENAI_API_KEY -e E2B_API_KEY=$E2B_API_KEY -e SUPABASE_URL=$AGB_DEV_SUPABASE_URL -e SUPABASE_KEY=$AGB_DEV_SUPABASE_SECRET_KEY us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server:prod
```

# Local Client, Remote Backend
1. Start the client. In `nextjsapp/`, run
```
pnpm dev
```
2. Build the docker container locally. In `backend/`, run 
```
docker build -t us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server:prod .
```
3. Push the docker container to the artifact repo. In `backend/`, run 
```
docker push us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server:prod
```
4. Trigger a rolling restart of the VMs so that they pick up the new docker container. In `backend/` run
```
gcloud compute instance-groups managed rolling-action restart instance-group-1 --zone=us-east1-b --max-unavailable=1
```

# Debugging VM via SSH
gcloud compute ssh --zone "us-central1-a" "instance-1" --project "agentboard-prod"
docker ps
docker container logs -f container-id
