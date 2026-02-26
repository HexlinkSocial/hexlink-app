output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "cloudfront_url" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}

output "api_url" {
  value = aws_apigatewayv2_api.api.api_endpoint
}

output "lambda_function_names" {
  value = {
    for k, v in aws_lambda_function.api :
    k => v.function_name
  }
}

output "github_role_arn" {
  value = aws_iam_role.github_deploy.arn
}