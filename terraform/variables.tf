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

variable "alarm_notification_email" {
  type        = string
  description = "The operational email address where system alerts and critical failures are routed"
}

variable "http_api_id" {
  type        = string
  description = "The ID of the HTTP API Gateway deployed by your serverless stack"
}