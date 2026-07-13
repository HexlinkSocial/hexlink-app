#################################
# MONITORING TOPICS
#################################

resource "aws_sns_topic" "ops_alerts" {
  name = "${var.project_name}-ops-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.ops_alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_notification_email
}

#################################
# API GATEWAY MONITORING
#################################

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${var.project_name}-api-5xx-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Gateway 5XX Errors encountered for ${var.project_name}-api"
  treat_missing_data  = "notBreaching"

  alarm_actions = [
    aws_sns_topic.ops_alerts.arn
  ]

  dimensions = {
    ApiId = var.http_api_id
  }
}

#################################
# LAMBDA FUNCTIONS MONITORING
#################################

locals {
  route_monitoring = {
    getCommunitiesByCellId = {
      route_key = "GET /CommunitiesByCellId"
    }
    createCommunity = {
      route_key = "POST /CreateCommunity"
    }
    getUserCommunities = {
      route_key = "GET /GetUserCommunities"
    }
    editCommunity = {
      route_key = "POST /EditCommunity"
    }
    deleteCommunity = {
      route_key = "POST /DeleteCommunity"
    }
  }

  monitored_functions = [
    "${var.project_name}-getCommunitiesByCellId",
    "${var.project_name}-createCommunity",
    "${var.project_name}-getUserCommunities",
    "${var.project_name}-editCommunity",
    "${var.project_name}-deleteCommunity"
  ]
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset(local.monitored_functions)

  alarm_name          = "${each.value}-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Function errors encountered for ${each.value}"
  treat_missing_data  = "notBreaching"

  alarm_actions = [
    aws_sns_topic.ops_alerts.arn
  ]

  dimensions = {
    FunctionName = each.value
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = toset(local.monitored_functions)

  alarm_name          = "${each.value}-throttles"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Throttling encountered for ${each.value}"
  treat_missing_data  = "notBreaching"

  alarm_actions = [
    aws_sns_topic.ops_alerts.arn
  ]

  dimensions = {
    FunctionName = each.value
  }
}

#################################
# GRANULAR API ROUTE STATUS ALARMS
#################################

resource "aws_cloudwatch_log_metric_filter" "route_status_filters" {
  for_each = local.route_monitoring

  name           = "${var.project_name}-${each.key}-error-filter"
  pattern        = "{ ($.status = \"4*\" || $.status = \"5*\") && $.routeKey = \"${each.value.route_key}\" }"
  log_group_name = "/aws/vendedlogs/apigateway/${var.project_name}-backend-stack-access-logs"

  metric_transformation {
    name      = "${each.key}-Error-Count"
    namespace = "${var.project_name}/ApiRoutes"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "route_status_alarms" {
  for_each = local.route_monitoring

  alarm_name          = "${var.project_name}-${each.key}-route-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "${each.key}-Error-Count"
  namespace           = "${var.project_name}/ApiRoutes"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "HTTP 4xx/5xx errors detected on ${each.value.route_key} endpoint"
  treat_missing_data  = "notBreaching"

  alarm_actions = [
    aws_sns_topic.ops_alerts.arn
  ]
}