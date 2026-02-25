#################################
# S3 FRONTEND
#################################

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend"
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  restrict_public_buckets = true
}

#################################
# CLOUDFRONT
#################################

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.project_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {

  enabled             = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {

    target_origin_id       = "s3-origin"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  custom_error_response {

    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"

  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

}

#################################
# LAMBDA
#################################

resource "aws_iam_role" "lambda_exec" {

  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({

    Version = "2012-10-17"

    Statement = [{

      Action = "sts:AssumeRole"
      Effect = "Allow"

      Principal = {
        Service = "lambda.amazonaws.com"
      }

    }]

  })

}

resource "aws_iam_role_policy_attachment" "lambda_logs" {

  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

}

resource "aws_lambda_function" "api" {

  function_name = "${var.project_name}-api"

  role    = aws_iam_role.lambda_exec.arn
  handler = "index.handler"
  runtime = "nodejs20.x"

  filename         = "lambda.zip"
  source_code_hash = filebase64sha256("lambda.zip")

  environment {

    variables = {
      DATABASE_URL = var.supabase_database_url
    }

  }

}

#################################
# API GATEWAY
#################################

resource "aws_apigatewayv2_api" "api" {

  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  cors_configuration {

    allow_origins = [
      "https://${aws_cloudfront_distribution.frontend.domain_name}"
    ]

    allow_methods = ["GET","POST","OPTIONS"]
    allow_headers = ["*"]

  }

}

resource "aws_apigatewayv2_integration" "lambda" {

  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"

  integration_uri = aws_lambda_function.api.invoke_arn

}

resource "aws_apigatewayv2_route" "default" {

  api_id = aws_apigatewayv2_api.api.id

  route_key = "ANY /{proxy+}"

  target = "integrations/${aws_apigatewayv2_integration.lambda.id}"

}

resource "aws_lambda_permission" "api" {

  statement_id  = "AllowAPIGateway"

  action = "lambda:InvokeFunction"

  function_name = aws_lambda_function.api.function_name

  principal = "apigateway.amazonaws.com"

}

#################################
# COGNITO
#################################

resource "aws_cognito_user_pool" "users" {

  name = "${var.project_name}-users"

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length = 8
  }

}

#################################
# GITHUB OIDC ROLE
#################################

resource "aws_iam_openid_connect_provider" "github" {

  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]

}

resource "aws_iam_role" "github_deploy" {

  name = "${var.project_name}-github-role"

  assume_role_policy = jsonencode({

    Version = "2012-10-17"

    Statement = [

      {

        Effect = "Allow"

        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }

        Action = "sts:AssumeRoleWithWebIdentity"

        Condition = {

          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }

          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:*:*"
          }

        }

      }

    ]

  })

}

#################################
# GITHUB PERMISSIONS
#################################

resource "aws_iam_role_policy" "github_policy" {

  role = aws_iam_role.github_deploy.id

  policy = jsonencode({

    Version = "2012-10-17"

    Statement = [

      {
        Effect = "Allow"

        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]

        Resource = [
          aws_s3_bucket.frontend.arn,
          "${aws_s3_bucket.frontend.arn}/*"
        ]
      },

      {
        Effect = "Allow"

        Action = [
          "cloudfront:CreateInvalidation"
        ]

        Resource = "*"
      },

      {
        Effect = "Allow"

        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction"
        ]

        Resource = "*"
      }

    ]

  })

}