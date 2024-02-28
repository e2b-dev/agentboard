

# Build the docker container locally. 
In `backend/`, run 
```
docker build -t us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server:prod .
```

# Run the docker container locally
In `backend/`, run 
```
docker rm -f ois-container && docker run -d --name ois-container -p 8080:80 -e OPENAI_API_KEY=$OPENAI_API_KEY -e E2B_API_KEY=$E2B_API_KEY -e SUPABASE_URL=$AGB_DEV_SUPABASE_URL -e SUPABASE_KEY=$AGB_DEV_SUPABASE_SECRET_KEY us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server:prod
```

# Push the docker container to the artifact repo
In `backend/`, run 
```
docker push us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server:prod
```

# Update Instance Group
Trigger a rolling restart of the VMs so that they pick up the new docker container. In `backend/` run
```
gcloud compute instance-groups managed rolling-action restart instance-group-1 --zone=us-east1-b --max-unavailable=1
```

# Connect to VM via SSH
```
gcloud compute ssh --zone "us-central1-a" "instance-1" --project "agentboard-prod"
# once you're inside, get the container id
docker ps
docker container logs -f CONTAINER-ID
```

# Test load balancer test endpoint
```
curl https://api.agentboard.dev/helloworld
```

Future note: Instead of restarting the VMs which has a lot of downtime, consider using the gcloud instance update feature:

https://stackoverflow.com/questions/60674936/auto-update-pull-docker-image-on-gcp-instance-groups-with-container-optimized-os
Specifically this one:
```
for i in $(gcloud compute instances list --filter NAME~"app-backend-instance-group" --format="value(NAME)");do gcloud beta compute instances update-container $i --zone europe-west3-c --container-image=gcr.io/deployments-337523/app-backend:latest;done
```
It's no longer in beta:
https://cloud.google.com/sdk/gcloud/reference/compute/instances/update