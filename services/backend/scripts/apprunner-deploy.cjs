const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");
const { ECRClient, CreateRepositoryCommand, DescribeRepositoriesCommand, GetAuthorizationTokenCommand } = require("@aws-sdk/client-ecr");
const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, GetRoleCommand } = require("@aws-sdk/client-iam");
const { AppRunnerClient, CreateServiceCommand } = require("@aws-sdk/client-apprunner");
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../docs/.env') });

const region = process.env.AWS_REGION || "us-east-1";
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
    const authRes = await ecr.send(new GetAuthorizationTokenCommand({}));
    const token = Buffer.from(authRes.authorizationData[0].authorizationToken, 'base64').toString('ascii');
    const password = token.split(':')[1];
    execSync(`docker login --username AWS --password-stdin ${authRes.authorizationData[0].proxyEndpoint}`, { input: password, stdio: ['pipe', 'inherit', 'inherit'] });
    execSync(`docker build -t ${REPO_NAME} ./services/backend`, { stdio: 'inherit' });
    execSync(`docker tag ${REPO_NAME}:latest ${repoUri}:latest`, { stdio: 'inherit' });
    // Retry push up to 5 times to handle intermittent network drops
    let pushSuccess = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        console.log(`\nPush attempt ${attempt}/5...`);
        execSync(`docker push ${repoUri}:latest`, { stdio: 'inherit' });
        pushSuccess = true;
        break;
      } catch (pushErr) {
        console.error(`Push attempt ${attempt} failed: ${pushErr.message}`);
        if (attempt < 5) {
          console.log("Waiting 10 seconds before retrying...");
          await sleep(10000);
          // Re-authenticate in case token expired
          const reAuthRes = await ecr.send(new GetAuthorizationTokenCommand({}));
          const reToken = Buffer.from(reAuthRes.authorizationData[0].authorizationToken, 'base64').toString('ascii');
          const rePassword = reToken.split(':')[1];
          execSync(`docker login --username AWS --password-stdin ${reAuthRes.authorizationData[0].proxyEndpoint}`, { input: rePassword, stdio: ['pipe', 'inherit', 'inherit'] });
        }
      }
    }
    if (!pushSuccess) throw new Error("Docker push failed after 5 attempts. Check your internet connection.");

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
