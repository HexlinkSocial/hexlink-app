set -e

if [ ! -f .env ]; then
    echo ".env file not found!"
    exit 1
fi
export $(grep -v '^#' .env | xargs)

echo "Logging into AWS..."
aws login || { echo "AWS login failed"; exit 1; }

unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN

ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${TERRAFORM_ROLE}"
SESSION_NAME="terraform-session"

echo "Assuming Terraform role..."
CREDENTIALS_JSON=$(aws sts assume-role \
    --role-arn "$ROLE_ARN" \
    --role-session-name "$SESSION_NAME" \
    --no-cli-pager)

export AWS_ACCESS_KEY_ID=$(echo $CREDENTIALS_JSON | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $CREDENTIALS_JSON | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $CREDENTIALS_JSON | jq -r '.Credentials.SessionToken')

echo "AWS credentials set."

echo "Running terraform apply..."
terraform apply -var="supabase_database_url=${SUPABASE_DATABASE_URL}" -var="prisma_layer_arn=${PRISMA_LAYER_ARN}"