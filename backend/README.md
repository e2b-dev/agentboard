# Build Instructions
1. Build locally (for prod):
docker build -t us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server:prod .

# Run locally
docker rm -f ois-container && \
docker run -d --name ois-container -p 8080:80 -e OPENAI_API_KEY=$OPENAI_API_KEY -e E2B_API_KEY=$E2B_API_KEY us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server:prod

# Push to remote (for prod)
docker push us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server

# Debugging VM via SSH
gcloud compute ssh --zone "us-central1-a" "instance-1" --project "agentboard-prod"

# Testing instructions
1. Test if the server is running:
```
curl http://35.222.184.99/helloworld
```

2. Test /chatnostream endpoint
```
curl "http://35.222.184.99/chatnostream?message=What's%20the%20date%20today"
```

# Connect to VM via SSH
```
gcloud compute ssh --zone "us-central1-a" "instance-1" --project "agentboard-prod"
```