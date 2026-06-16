#!/bin/bash
# BPN AWS Provisioning Helper Script
# Usage: Run these commands in your AWS CloudShell or local terminal with AWS CLI configured.

# 1. Variables
PROJECT_PREFIX="bpn-prod"
REGION="us-east-1"
DB_NAME="bpndb"
DB_USER="bpnadmin"
DB_PASS="SecurePassword123!" # CHANGE THIS!

echo "--- 1. Creating VPC Security Group ---"
VPC_ID=$(aws ec2 describe-vpcs --filter "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)
SG_ID=$(aws ec2 create-security-group --group-name ${PROJECT_PREFIX}-sg --description "BPN Security Group" --vpc-id $VPC_ID --query 'GroupId' --output text)

# Allow Postgres access (from within VPC)
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 5432 --cidr 0.0.0.0/0 # Restricted to VPC in real production

echo "--- 2. Creating RDS PostgreSQL Instance ---"
aws rds create-db-instance \
    --db-instance-identifier ${PROJECT_PREFIX}-db \
    --db-instance-class db.t4g.micro \
    --engine postgres \
    --allocated-storage 20 \
    --db-name $DB_NAME \
    --master-username $DB_USER \
    --master-user-password $DB_PASS \
    --vpc-security-group-ids $SG_ID \
    --publicly-accessible \
    --region $REGION

echo "--- 3. Provisioning Route 53 Hosted Zone ---"
aws route53 create-hosted-zone --name verimut.icu --caller-reference $(date +%s)

echo "--- 4. Requesting SSL Certificate ---"
CERT_ARN=$(aws acm request-certificate --domain-name api.verimut.icu --validation-method DNS --region $REGION --query 'CertificateArn' --output text)

echo "IMPORTANT NEXT STEPS:"
echo "1. Log into AWS Console -> Route 53 -> Hosted Zones -> verimut.icu"
echo "2. Copy the Name Servers (NS) and update them at your Domain Registrar."
echo "3. Go to ACM -> Certificate -> api.verimut.icu and click 'Create records in Route 53' to validate."
echo "4. Go to App Runner -> Create Service -> Connect to GitHub -> services/backend"
echo "5. Add Environment Variable: DATABASE_URL=postgresql://$DB_USER:$DB_PASS@HOSTNAME:5432/$DB_NAME"
