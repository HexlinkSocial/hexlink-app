variable "aws_region" {
  default = "eu-west-2"
}

variable "project_name" {
  default = "hexlink"
}

variable "frontend_domain" {
  description = "Optional custom domain"
  default     = ""
}

variable "supabase_database_url" {
  description = "Supabase Postgres connection string"
  sensitive   = true
}

variable "prisma_layer_arn" {
  description = "ARN of the Prisma Lambda layer"
  type        = string
}