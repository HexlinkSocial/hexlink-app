#################################
# S3 FRONTEND
#################################

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend"
}

resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "frontend" {

  depends_on = [
    aws_s3_bucket_ownership_controls.frontend
  ]

  bucket = aws_s3_bucket.frontend.id
  acl    = "private"
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "AllowCloudFrontRead"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"

        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })
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

  custom_error_response {
    error_code         = 403
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

    Statement = [

      {

        Action = "sts:AssumeRole"
        Effect = "Allow"

        Principal = {
          Service = "lambda.amazonaws.com"
        }

      }

    ]

  })

}

resource "aws_iam_role_policy_attachment" "lambda_logs" {

  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

}

locals {

  lambda_files = fileset("${path.module}/../backend/lambda", "*.ts")

  lambdas = {

    for file in local.lambda_files :

    trimsuffix(file, ".ts") => {

      name = trimsuffix(file, ".ts")

      method = (
        startswith(file, "get")    ? "GET" :
        startswith(file, "post")   ? "POST" :
        startswith(file, "put")    ? "PUT" :
        startswith(file, "delete") ? "DELETE" :
        "GET"
      )

      route = substr(
        trimsuffix(file, ".ts"),
        length(
          startswith(file,"get")    ? "get" :
          startswith(file,"post")   ? "post" :
          startswith(file,"put")    ? "put" :
          startswith(file,"delete") ? "delete" :
          ""
        ),
        100
      )

    }

  }

}

resource "aws_lambda_function" "api" {
  for_each = local.lambdas

  function_name = "${var.project_name}-${each.value.name}"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = "nodejs20.x"
  handler       = "lambda/${each.value.name}.handler"
  timeout       = 30

  s3_bucket = aws_s3_bucket.lambda_deployments.bucket
  s3_key    = "lambda-code.zip"

  lifecycle {
    ignore_changes = [
      s3_key,
      s3_object_version,
      source_code_hash,
    ]
  }

  environment {
    variables = {
      DATABASE_URL = var.supabase_database_url
      NODE_ENV     = "production"
    }
  }
}

#################################
# LAMBDA S3 BUCKET
#################################

resource "aws_s3_bucket" "lambda_deployments" {
  bucket = "${var.project_name}-lambda-deployments"
}

resource "aws_s3_bucket_ownership_controls" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id
  acl    = "private"

  depends_on = [
    aws_s3_bucket_ownership_controls.lambda_deployments
  ]
}

resource "aws_s3_bucket_public_access_block" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  block_public_acls       = true
  block_public_policy     = true
  restrict_public_buckets = true
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

    allow_methods = [
      "GET", "POST"
    ]

    allow_headers = [
      "content-type",
      "authorization"
    ]

    max_age = 86400
  }
}

resource "aws_apigatewayv2_integration" "lambda" {

  for_each = aws_lambda_function.api

  api_id = aws_apigatewayv2_api.api.id

  integration_type = "AWS_PROXY"

  integration_uri = each.value.invoke_arn

}

resource "aws_apigatewayv2_route" "routes" {

  for_each = local.lambdas

  api_id = aws_apigatewayv2_api.api.id

  route_key = "${each.value.method} /${each.value.route}"

  target = "integrations/${aws_apigatewayv2_integration.lambda[each.key].id}"

}

resource "aws_apigatewayv2_stage" "default" {

  api_id = aws_apigatewayv2_api.api.id

  name = "$default"

  auto_deploy = true

}

resource "aws_lambda_permission" "api" {

  for_each = aws_lambda_function.api

  statement_id = "AllowAPIGateway-${each.key}"

  action = "lambda:InvokeFunction"

  function_name = each.value.function_name

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

resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project_name}-client"
  user_pool_id = aws_cognito_user_pool.users.id
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
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]

        Resource = [
          aws_s3_bucket.frontend.arn,
          "${aws_s3_bucket.frontend.arn}/*",
          aws_s3_bucket.lambda_deployments.arn,
          "${aws_s3_bucket.lambda_deployments.arn}/*"
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
          "lambda:CreateFunction",
          "lambda:GetFunction",
          "lambda:ListFunctions",
          "lambda:PublishLayerVersion",
          "lambda:UpdateFunctionConfiguration",
          "lambda:GetLayerVersion",
          "lambda:GetFunctionConfiguration"
        ]

        Resource = "*"
      },

      {
        Effect = "Allow"
        Action = "iam:PassRole"
        Resource = aws_iam_role.lambda_exec.arn
      }

    ]

  })

}