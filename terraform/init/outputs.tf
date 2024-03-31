output "e2b_api_key_secret_name" {
  value = google_secret_manager_secret.e2b_api_key.secret_id
}

output "openai_api_key_secret_name" {
  value = google_secret_manager_secret.openai_api_key.secret_id
}

output "posthog_api_key_secret_name" {
  value = google_secret_manager_secret.posthog_api_key.secret_id
}

output "posthog_host_secret_name" {
  value = google_secret_manager_secret.posthog_host.secret_id
}

output "supabase_secret_key_secret_name" {
  value = google_secret_manager_secret.supabase_secret_key.secret_id
}

output "supabase_anon_key_secret_name" {
  value = google_secret_manager_secret.supabase_anon_key.secret_id
}

output "supabase_url_secret_name" {
  value = google_secret_manager_secret.supabase_url.secret_id
}

output "vercel_api_token_secret_name" {
  value = google_secret_manager_secret.vercel_api_token.secret_id
}

output "resend_api_token_secret_name" {
  value = google_secret_manager_secret.resend_api_token.secret_id
}

output "artifact_registry_repository_name" {
  value = google_artifact_registry_repository.agentboard.name
}

output "service_account_email" {
  value = google_service_account.agentboard_service_account.email
}
