# Directions for pushing to production

1. Build locally:
docker build -t us-central1-docker.pkg.dev/e2b-prod/openai-proxy-agentboard/proxy .

2. Push to remote
docker push us-central1-docker.pkg.dev/e2b-prod/openai-proxy-agentboard/proxy                   

3. Go to console for Cloud Run, select agentboard proxy, manually select the artifact you just pushed in "Edit & Redeploy"