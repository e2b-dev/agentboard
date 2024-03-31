-include .env

PHONY:build
build:
	@docker build --platform linux/amd64 --tag "${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPOSITORY_NAME}/backend:latest" .

.PHONY:push
push:
	@docker push "${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPOSITORY_NAME}/backend:latest"

.PHONY:build-push
build-push: build push
