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
  route_monitoring = {
    getCommunitiesByCellId = {
      route_key    = "GET /CommunitiesByCellId"
      status_codes = ["400", "404", "500"]
    }
    getCommunityCounts = {
      route_key    = "GET /CommunityCounts"
      status_codes = ["500"]
    }
    createCommunity = {
      route_key    = "POST /CreateCommunity"
      status_codes = ["400", "401", "403", "500"]
    }
    approveOrDenyCommunity = {
      route_key    = "POST /ApproveOrDenyCommunity"
      status_codes = ["400", "403", "404", "500"]
    }
    getPendingCommunities = {
      route_key    = "POST /GetPendingCommunities"
      status_codes = ["403", "500"]
    }
    getUserCommunities = {
      route_key    = "GET /GetUserCommunities"
      status_codes = ["401", "500"]
    }
    editCommunity = {
      route_key    = "POST /EditCommunity"
      status_codes = ["400", "401", "404", "500"]
    }
    deleteCommunity = {
      route_key    = "POST /DeleteCommunity"
      status_codes = ["400", "401", "404", "500"]
    }
  }

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

  flat_status_monitoring = merge([
    for func_key, config in local.route_monitoring : {
      for code in config.status_codes : "${func_key}-${code}" => {
        function_name = "${var.project_name}-${func_key}"
        route_key     = config.route_key
        status_code   = code
        metric_name   = "${func_key}-${code}-Count"
      }
    }
  ]...)
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

#################################
# GRANULAR API ROUTE STATUS ALARMS
#################################

resource "aws_cloudwatch_log_metric_filter" "route_status_filters" {
  for_each = local.flat_status_monitoring

  name           = "${each.value.function_name}-${each.value.status_code}-filter"
  pattern        = "{ $.status = ${each.value.status_code} && $.routeKey = \"${each.value.route_key}\" }"
  log_group_name = "/aws/vendedlogs/apigateway/${var.project_name}-backend-stack-access-logs"

  metric_transformation {
    name      = each.value.metric_name
    namespace = "${var.project_name}/ApiRoutes"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "route_status_alarms" {
  for_each = local.flat_status_monitoring

  alarm_name          = "${each.value.function_name}-status-${each.value.status_code}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = each.value.metric_name
  namespace           = "${var.project_name}/ApiRoutes"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "HTTP Status ${each.value.status_code} anomaly detected on ${each.value.route_key} endpoint"
  treat_missing_data  = "notBreaching"

  alarm_actions = [
    aws_sns_topic.ops_alerts.arn
  ]
}