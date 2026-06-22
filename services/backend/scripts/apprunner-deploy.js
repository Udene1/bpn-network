const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");
const { ECRClient, CreateRepositoryCommand, DescribeRepositoriesCommand } = require("@aws-sdk/client-ecr");
const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, GetRoleCommand } = require("@aws-sdk/client-iam");
const { AppRunnerClient, CreateServiceCommand } = require("@aws-sdk/client-apprunner");
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), 'docs/.env') });

const region = process.env.AWS_REGION || "eu-west-1";
const config = {
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const sts = new STSClient(config);
const ecr = new ECRClient(config);
const iam = new IAMClient(config);
const apprunner = new AppRunnerClient(config);

const REPO_NAME = "bpn-backend-service";
const ROLE_NAME = "AppRunnerECRAccessRole";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getOrCreateEcrRepo() {
  try {
    const res = await ecr.send(new DescribeRepositoriesCommand({ repositoryNames: [REPO_NAME] }));
    return res.repositories[0].repositoryUri;
  } catch (err) {
    if (err.name === "RepositoryNotFoundException") {
      console.log(`Creating ECR repo ${REPO_NAME}...`);
      const res = await ecr.send(new CreateRepositoryCommand({ repositoryName: REPO_NAME }));
      return res.repository.repositoryUri;
    }
    throw err;
  }
}

async function getOrCreateIamRole() {
  try {
    const res = await iam.send(new GetRoleCommand({ RoleName: ROLE_NAME }));
    return res.Role.Arn;
  } catch (err) {
    if (err.name === "NoSuchEntityException") {
      console.log(`Creating IAM role ${ROLE_NAME}...`);
      const assumeRolePolicyDocument = JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { Service: "build.apprunner.amazonaws.com" },
          Action: "sts:AssumeRole"
        }]
      });

      const roleRes = await iam.send(new CreateRoleCommand({
        RoleName: ROLE_NAME,
        AssumeRolePolicyDocument: assumeRolePolicyDocument
      }));

      await iam.send(new AttachRolePolicyCommand({
        RoleName: ROLE_NAME,
        PolicyArn: "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
      }));

      console.log("Waiting 10 seconds for IAM role to propagate...");
      await sleep(10000);
      return roleRes.Role.Arn;
    }
    throw err;
  }
}

async function deploy() {
  console.log("--- BPN App Runner Deployment (SDK) ---");

  try {
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    const accountId = identity.Account;
    console.log(`AWS Account ID: ${accountId}`);

    const repoUri = await getOrCreateEcrRepo();
    console.log(`ECR Repository URI: ${repoUri}`);

    // Docker build and push
    console.log("\nBuilding and pushing Docker image...");
    execSync(`aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${accountId}.dkr.ecr.${region}.amazonaws.com`, { stdio: 'inherit' });
    execSync(`docker build -t ${REPO_NAME} ./services/backend`, { stdio: 'inherit' });
    execSync(`docker tag ${REPO_NAME}:latest ${repoUri}:latest`, { stdio: 'inherit' });
    execSync(`docker push ${repoUri}:latest`, { stdio: 'inherit' });

    // IAM Role
    const roleArn = await getOrCreateIamRole();
    console.log(`App Runner Access Role ARN: ${roleArn}`);

    // Create App Runner Service
    console.log("\nDeploying to App Runner...");
    const serviceRes = await apprunner.send(new CreateServiceCommand({
      ServiceName: "bpn-backend-prod",
      SourceConfiguration: {
        AuthenticationConfiguration: {
          AccessRoleArn: roleArn
        },
        ImageRepository: {
          ImageIdentifier: `${repoUri}:latest`,
          ImageRepositoryType: "ECR",
          ImageConfiguration: {
            Port: "3000",
            RuntimeEnvironmentVariables: {
              "NODE_ENV": "production",
              "DATABASE_URL": process.env.DATABASE_URL || "postgres://bpnadmin:SecurePassword123!@bpn-prod-db.xxxx.eu-west-1.rds.amazonaws.com:5432/bpndb",
              "REDIS_URL": process.env.REDIS_URL || "redis://localhost:6379",
              "FRONTEND_URL": process.env.FRONTEND_URL || "https://dashboard.verimut.icu",
              "ANCHOR_API_KEY": process.env.ANCHOR_API_KEY || "YOUR_ANCHOR_API_KEY_HERE"
            }
          }
        },
        AutoDeploymentsEnabled: true
      },
      InstanceConfiguration: {
        Cpu: "1 vCPU",
        Memory: "2 GB"
      }
    }));

    console.log("\n--- DEPLOYMENT SUCCESSFUL ---");
    console.log(`App Runner Service ARN: ${serviceRes.Service.ServiceArn}`);
    console.log(`App Runner Default URL: https://${serviceRes.Service.ServiceUrl}`);
    console.log("Note: It may take 5-10 minutes for App Runner to finish deploying.");

  } catch (err) {
    console.error("Deployment Error:", err);
  }
}

deploy();
