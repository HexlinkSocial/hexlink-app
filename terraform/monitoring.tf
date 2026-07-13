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
  threshold           = "1"
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
  monitored_functions = [
    "${var.project_name}-getCommunitiesByCellId",
    "${var.project_name}-getCommunityCounts",
    "${var.project_name}-createCommunity",
    "${var.project_name}-approveOrDenyCommunity",
    "${var.project_name}-getPendingCommunities",
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
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
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
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Throttling encountered for ${each.value}"
  treat_missing_data  = "notBreaching"

  alarm_actions = [
    aws_sns_topic.ops_alerts.arn
  ]

  dimensions = {
    FunctionName = each.value
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = toset(local.monitored_functions)

  alarm_name          = "${each.value}-p95-duration"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  extended_statistic  = "p95"
  threshold           = "5000"
  alarm_description   = "P95 latency breach for ${each.value}"
  treat_missing_data  = "notBreaching"

  alarm_actions = [
    aws_sns_topic.ops_alerts.arn
  ]

  dimensions = {
    FunctionName = each.value
  }
}