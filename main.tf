terraform {
  required_version = ">= 1.5.0, < 1.6.0"
  backend "gcs" {
    prefix = "terraform/analytics-collector/state"
  }
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "3.0.2"
    }
    google = {
      source  = "hashicorp/google"
      version = "5.6.0"
    }
    github = {
      source  = "integrations/github"
      version = "5.42.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.5.1"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "1.4.0"
    }
  }
}

data "google_client_config" "default" {}

provider "docker" {
  registry_auth {
    address  = "${var.gcp_region}-docker.pkg.dev"
    username = "oauth2accesstoken"
    password = data.google_client_config.default.access_token
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
  zone    = var.gcp_zone
}

module "github" {
  source = "./terraform/github-action"

  github_repository   = var.github_repository
  github_organization = var.github_organization

  artifact_registry_repository_name = module.init.artifact_registry_repository_name
  gcp_project_id                    = var.gcp_project_id
  gcp_region                        = var.gcp_region
  gcp_zone                          = var.gcp_zone
  terraform_state_bucket            = var.terraform_state_bucket

  prefix = var.prefix
}

module "init" {
  source = "./terraform/init"

  prefix = var.prefix
  labels = var.labels
}

data "google_secret_manager_secret_version" "vercel_api_token" {
  secret = module.init.vercel_api_token_secret_name
}

data "google_secret_manager_secret_version" "e2b_api_key" {
  secret = module.init.e2b_api_key_secret_name
}

data "google_secret_manager_secret_version" "openai_api_key" {
  secret = module.init.openai_api_key_secret_name
}

data "google_secret_manager_secret_version" "supabase_secret_key" {
  secret = module.init.supabase_secret_key_secret_name
}

data "google_secret_manager_secret_version" "supabase_anon_key" {
  secret = module.init.supabase_anon_key_secret_name
}

data "google_secret_manager_secret_version" "supabase_url" {
  secret = module.init.supabase_url_secret_name
}

data "google_secret_manager_secret_version" "posthog_api_key" {
  secret = module.init.posthog_api_key_secret_name
}

data "google_secret_manager_secret_version" "posthog_host" {
  secret = module.init.posthog_host_secret_name
}

data "google_secret_manager_secret_version" "resend_api_key" {
  secret = module.init.resend_api_token_secret_name
}


data "docker_registry_image" "backend_image" {
  name = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${module.init.artifact_registry_repository_name}/backend"
}

resource "docker_image" "backend_image" {
  name          = data.docker_registry_image.backend_image.name
  pull_triggers = [data.docker_registry_image.backend_image.sha256_digest]
}

# Backend Server
resource "google_cloud_run_v2_service" "backend_server" {
  name     = "${var.prefix}agentboard-backend-server"
  location = var.gcp_region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = module.init.service_account_email

    containers {
      image = docker_image.backend_image.repo_digest

      ports {
        container_port = 8080
        name           = "http1"
      }

      env {
        name  = "SUPABASE_URL"
        value = data.google_secret_manager_secret_version.supabase_url.secret_data
      }

      env {
        name  = "SUPABASE_KEY"
        value = data.google_secret_manager_secret_version.supabase_secret_key.secret_data
      }

      env {
        name  = "OPENAI_API_KEY"
        value = data.google_secret_manager_secret_version.openai_api_key.secret_data
      }

      env {
        name  = "E2B_API_KEY"
        value = data.google_secret_manager_secret_version.e2b_api_key.secret_data
      }

      env {
        name  = "POSTHOG_API_KEY"
        value = data.google_secret_manager_secret_version.posthog_api_key.secret_data
      }

      env {
        name  = "POSTHOG_HOST"
        value = data.google_secret_manager_secret_version.posthog_host.secret_data
      }

      resources {
        cpu_idle = true

        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }
}

resource "google_cloud_run_service_iam_binding" "admin_server" {
  service = google_cloud_run_v2_service.backend_server.name
  role    = "roles/run.invoker"
  members = [
    "allUsers"
  ]
}

# Vercel

provider "vercel" {
  # Or omit this for the api_token to be read
  # from the VERCEL_API_TOKEN environment variable
  api_token = data.google_secret_manager_secret_version.vercel_api_token.secret_data

  # Optional default team for all resources
  team = var.vercel_team
}

resource "vercel_project" "agentboard" {
  name           = "${var.prefix}${var.vercel_project}"
  root_directory = "frontend"
  framework      = "nextjs"

  git_repository = {
    type = "github"
    repo = "${var.github_organization}/${var.github_repository}"
  }
}

resource "vercel_project_environment_variable" "supabase_url" {
  key        = "NEXT_PUBLIC_SUPABASE_URL"
  value      = data.google_secret_manager_secret_version.supabase_url.secret_data
  project_id = vercel_project.agentboard.id
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "supabase_anon_key" {
  key        = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  value      = data.google_secret_manager_secret_version.supabase_anon_key.secret_data
  project_id = vercel_project.agentboard.id
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "e2b_api_key" {
  key        = "E2B_API_KEY"
  value      = data.google_secret_manager_secret_version.e2b_api_key.secret_data
  project_id = vercel_project.agentboard.id
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "posthog_api_key" {
  key        = "NEXT_PUBLIC_POSTHOG_KEY"
  value      = data.google_secret_manager_secret_version.posthog_api_key.secret_data
  project_id = vercel_project.agentboard.id
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "posthog_host" {
  key        = "NEXT_PUBLIC_POSTHOG_HOST"
  value      = data.google_secret_manager_secret_version.posthog_host.secret_data
  project_id = vercel_project.agentboard.id
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "resend_api_key" {
  key        = "RESEND_API_KEY"
  value      = data.google_secret_manager_secret_version.supabase_url.secret_data
  project_id = vercel_project.agentboard.id
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "agentboard_api_url" {
  key        = "NEXT_PUBLIC_AGENTBOARD_API_URL"
  value      = google_cloud_run_v2_service.backend_server.uri
  project_id = vercel_project.agentboard.id
  target     = ["production", "preview", "development"]
}
