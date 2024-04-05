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
