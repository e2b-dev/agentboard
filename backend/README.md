# Build Instructions
1. Build locally (for prod):
docker build -t us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server:prod .

2. Push to remote (for prod)
docker push us-central1-docker.pkg.dev/agentboard-prod/agentboard-fastapi-server/server:prod

3. Go to console for Cloud Run, select agentboard proxy, manually select the artifact you just pushed in "Edit & Redeploy"?

# Debugging VM via SSH
gcloud compute ssh --zone "us-central1-a" "instance-1" --project "agentboard-prod"

# Testing instructions
1. Test if the server is running:
```
curl http://34.170.246.119/helloworld
```
