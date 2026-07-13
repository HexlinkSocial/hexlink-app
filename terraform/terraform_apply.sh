set -e

load_environment() {
    if [ ! -f .env ]; then
        echo ".env file not found!"
        exit 1
    fi
    export $(grep -v '^#' .env | xargs)
}

authenticate_aws() {
    echo "Logging into AWS..."
    aws login || { echo "AWS login failed"; exit 1; }
}

clear_existing_credentials() {
    unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
}

assume_terraform_role() {
    local role_arn="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${TERRAFORM_ROLE}"
    local session_name="terraform-session"

    echo "Assuming Terraform role..."
    local credentials_json
    credentials_json=$(aws sts assume-role \
        --role-arn "$role_arn" \
        --role-session-name "$session_name" \
        --no-cli-pager)

    export AWS_ACCESS_KEY_ID=$(echo "$credentials_json" | jq -r '.Credentials.AccessKeyId')
    export AWS_SECRET_ACCESS_KEY=$(echo "$credentials_json" | jq -r '.Credentials.SecretAccessKey')
    export AWS_SESSION_TOKEN=$(echo "$credentials_json" | jq -r '.Credentials.SessionToken')

    echo "AWS credentials set."
}

map_terraform_variables() {
    export TF_VAR_alarm_notification_email="${ALARM_NOTIFICATION_EMAIL}"
    export TF_VAR_http_api_id="${HTTP_API_ID}"
}

run_terraform() {
    echo "Running terraform apply..."
    terraform apply
}

main() {
    load_environment
    authenticate_aws
    clear_existing_credentials
    assume_terraform_role
    map_terraform_variables
    run_terraform
}

main