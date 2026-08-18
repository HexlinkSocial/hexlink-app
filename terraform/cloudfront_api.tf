#################################
# ORIGIN VERIFY SECRET
#################################
resource "random_password" "origin_secret" {
  length  = 40
  special = false
}

resource "aws_ssm_parameter" "origin_verify_secret" {
  name  = "/${var.project_name}/origin-verify-secret"
  type  = "SecureString"
  value = random_password.origin_secret.result
}

#################################
# RESPONSE HEADERS POLICY (API)
#################################
resource "aws_cloudfront_response_headers_policy" "api_security_headers" {
  name = "${var.project_name}-api-security-headers"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    content_security_policy {
      content_security_policy = "default-src 'none'; frame-ancestors 'none'"
      override                = true
    }
  }
}

#################################
# CLOUDFRONT IN FRONT OF API GATEWAY
#################################
resource "aws_cloudfront_distribution" "api" {
  enabled     = true
  comment     = "${var.project_name} API edge"
  aliases     = ["api.hexlink.org"]

  origin {
    # data.aws_lambda_function doesn't give you the API URL — pull it from
    # the SAM stack's CloudFormation output instead.
    domain_name = replace(
      replace(data.aws_cloudformation_stack.backend.outputs["ApiUrl"], "https://", ""),
      "/",
      ""
    )
    origin_id = "api-gateway-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    # Shared secret so API Gateway can be locked to only accept traffic
    # that came through this CloudFront distribution.
    custom_header {
      name  = "x-origin-verify"
      value = random_password.origin_secret.result
    }
  }

  default_cache_behavior {
    target_origin_id       = "api-gateway-origin"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]

    cache_policy_id             = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # AWS managed: CachingDisabled
    origin_request_policy_id    = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AWS managed: AllViewerExceptHostHeader
    response_headers_policy_id  = aws_cloudfront_response_headers_policy.api_security_headers.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = "arn:aws:acm:us-east-1:662271354855:certificate/6a92e2c6-3080-48b1-9c00-2c6a514c5da2"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

data "aws_cloudformation_stack" "backend" {
  name = "${var.project_name}-backend-stack"
}