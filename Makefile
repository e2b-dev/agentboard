-include .env

tf_vars := TF_VAR_gcp_project_id=$(GCP_PROJECT_ID) \
	TF_VAR_gcp_region=$(GCP_REGION) \
	TF_VAR_gcp_zone=$(GCP_ZONE) \
	TF_VAR_prefix=$(PREFIX) \
	TF_VAR_terraform_state_bucket=$(TERRAFORM_STATE_BUCKET)

.PHONY: init
init:
	@ printf "Initializing Terraform\n\n"
	@ terraform init -reconfigure -input=false -backend-config="bucket=${TERRAFORM_STATE_BUCKET}"
	@ $(tf_vars) terraform apply -target=module.init -auto-approve -input=false -compact-warnings

.PHONY: plan
plan:
	@ printf "Planning Terraform\n\n"
	@ terraform fmt -recursive
	@ $(tf_vars) terraform plan -compact-warnings -detailed-exitcode

.PHONY: apply
apply:
	@ printf "Applying Terraform\n\n"
	@ $(tf_vars) \
	terraform apply \
	-auto-approve \
	-input=false \
	-compact-warnings
