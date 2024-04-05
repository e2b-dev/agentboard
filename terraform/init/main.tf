resource "google_secret_manager_secret" "e2b_api_key" {
  secret_id = "${var.prefix}e2b-api-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "openai_api_key" {
  secret_id = "${var.prefix}openai-api-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "supabase_secret_key" {
  secret_id = "${var.prefix}supabase-secret-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "supabase_anon_key" {
  secret_id = "${var.prefix}supabase-anon-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "supabase_url" {
  secret_id = "${var.prefix}supabase-url"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "posthog_api_key" {
  secret_id = "${var.prefix}posthog-api-key"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "posthog_host" {
  secret_id = "${var.prefix}posthog-host"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "vercel_api_token" {
  secret_id = "${var.prefix}vercel-api-token"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "resend_api_token" {
  secret_id = "${var.prefix}resend-api-token"

  replication {
    auto {}
  }
}

resource "google_artifact_registry_repository" "agentboard" {
  format        = "DOCKER"
  repository_id = "e2b-agentboard"
  labels        = var.labels
}

resource "google_service_account" "agentboard_service_account" {
  account_id = "${var.prefix}agentboard"
}
