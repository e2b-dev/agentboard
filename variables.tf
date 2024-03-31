variable "gcp_project_id" {
  description = "The project to deploy the cluster in"
  type        = string
}

variable "gcp_region" {
  type = string
}

variable "gcp_zone" {
  description = "All GCP resources will be launched in this Zone."
  type        = string
}

variable "github_organization" {
  type    = string
  default = "e2b-dev"
}

variable "github_repository" {
  type    = string
  default = "agentboard"
}

variable "vercel_team" {
  type    = string
  default = "e2b"
}

variable "prefix" {
  type        = string
  description = "The prefix to use for all resources in this module"
  default     = "e2b-"
}

variable "labels" {
  description = "The labels to attach to resources created by this module"
  type        = map(string)
  default = {
    "app"       = "e2b"
    "terraform" = "true"
  }
}

variable "terraform_state_bucket" {
  description = "The name of the bucket to store terraform state in"
  type        = string
}
