const { ECSClient, CreateClusterCommand, RegisterTaskDefinitionCommand, CreateServiceCommand, DescribeServicesCommand, UpdateServiceCommand, DeleteServiceCommand } = require("@aws-sdk/client-ecs");
const { EC2Client, DescribeSubnetsCommand, DescribeVpcsCommand } = require("@aws-sdk/client-ec2");
const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, GetRoleCommand, CreateServiceLinkedRoleCommand, PutRolePolicyCommand } = require("@aws-sdk/client-iam");
const { CloudWatchLogsClient, CreateLogGroupCommand } = require("@aws-sdk/client-cloudwatch-logs");
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

const ecs = new ECSClient(config);
const ec2 = new EC2Client(config);
const iam = new IAMClient(config);
const cwlogs = new CloudWatchLogsClient(config);

const CLUSTER_NAME = "bpn-cluster";
const SERVICE_NAME = "bpn-backend-service";
const REPO_URI = `716563790683.dkr.ecr.${region}.amazonaws.com/bpn-backend-service:latest`;
const EXECUTION_ROLE_NAME = "ecsTaskExecutionRoleBPN";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getOrCreateExecutionRole() {
  let roleArn;
  try {
    const res = await iam.send(new GetRoleCommand({ RoleName: EXECUTION_ROLE_NAME }));
    roleArn = res.Role.Arn;
  } catch (err) {
    if (err.name === "NoSuchEntityException") {
      console.log(`Creating IAM role ${EXECUTION_ROLE_NAME}...`);
      const assumeRolePolicyDocument = JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { Service: "ecs-tasks.amazonaws.com" },
          Action: "sts:AssumeRole"
        }]
      });

      const roleRes = await iam.send(new CreateRoleCommand({
        RoleName: EXECUTION_ROLE_NAME,
        AssumeRolePolicyDocument: assumeRolePolicyDocument
      }));

      await iam.send(new AttachRolePolicyCommand({
        RoleName: EXECUTION_ROLE_NAME,
        PolicyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
      }));
      
      roleArn = roleRes.Role.Arn;
      console.log("Waiting 10 seconds for IAM role to propagate...");
      await sleep(10000);
    } else throw err;
  }

  // Always ensure the role has permissions to create log groups
  await iam.send(new PutRolePolicyCommand({
    RoleName: EXECUTION_ROLE_NAME,
    PolicyName: "CloudWatchLogsCreation",
    PolicyDocument: JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Action: "logs:CreateLogGroup",
        Resource: "*"
      }]
    })
  }));

  return roleArn;
}

async function ensureServiceLinkedRole() {
  try {
    await iam.send(new CreateServiceLinkedRoleCommand({ AWSServiceName: "ecs.amazonaws.com" }));
    console.log("Created ECS Service Linked Role.");
  } catch (err) {
    if (err.name === "InvalidInputException" && err.message.includes("already exists")) {
       // Ignore, already exists
    } else {
      console.warn("Service Linked Role Check:", err.message);
    }
  }
}

async function deploy() {
  console.log(`--- BPN ECS Fargate Deployment (us-east-1) ---`);

  try {
    // 1. Get Default VPC and Subnets
    const vpcs = await ec2.send(new DescribeVpcsCommand({ Filters: [{ Name: "isDefault", Values: ["true"] }] }));
    const vpcId = vpcs.Vpcs[0].VpcId;
    const subnetsRes = await ec2.send(new DescribeSubnetsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] }));
    const subnetIds = subnetsRes.Subnets.map(s => s.SubnetId);
    console.log(`Using VPC: ${vpcId} and Subnets: ${subnetIds.join(", ")}`);

    // 2. Create Execution Role
    const executionRoleArn = await getOrCreateExecutionRole();
    console.log(`Execution Role ARN: ${executionRoleArn}`);

    // 3. Ensure Service Linked Role
    await ensureServiceLinkedRole();

    // 4. Create Log Group
    try {
      await cwlogs.send(new CreateLogGroupCommand({ logGroupName: "/ecs/bpn-backend" }));
      console.log("Log group /ecs/bpn-backend created.");
    } catch (e) {
      if (e.name !== "ResourceAlreadyExistsException") console.warn("Log group check:", e.message);
    }

    // 5. Create Cluster
    try {
      await ecs.send(new CreateClusterCommand({ clusterName: CLUSTER_NAME }));
      console.log(`Cluster ${CLUSTER_NAME} created (or already exists).`);
    } catch (e) {}

    // 6. Register Task Definition
    console.log("Registering Task Definition...");
    const taskDef = await ecs.send(new RegisterTaskDefinitionCommand({
      family: "bpn-backend",
      cpu: "256",
      memory: "512",
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      executionRoleArn: executionRoleArn,
      containerDefinitions: [
        {
          name: "bpn-backend",
          image: REPO_URI,
          portMappings: [{ containerPort: 3000, hostPort: 3000, protocol: "tcp" }],
          environment: [
            { name: "NODE_ENV", value: "production" },
            { name: "DATABASE_URL", value: process.env.DATABASE_URL || "postgresql://bpnadmin:SecurePassword123!@bpn-prod-db.cvw2mguk6zwn.eu-west-1.rds.amazonaws.com:5432/bpndb?schema=public" },
            { name: "REDIS_URL", value: "redis://localhost:6379" },
            { name: "PORT", value: "3000" }
          ],
          logConfiguration: {
              logDriver: "awslogs",
              options: {
                  "awslogs-group": "/ecs/bpn-backend",
                  "awslogs-region": region,
                  "awslogs-stream-prefix": "ecs"
              }
          }
        },
        {
          name: "redis",
          image: "redis:alpine",
          portMappings: [{ containerPort: 6379, hostPort: 6379, protocol: "tcp" }],
          logConfiguration: {
              logDriver: "awslogs",
              options: {
                  "awslogs-group": "/ecs/bpn-backend",
                  "awslogs-region": region,
                  "awslogs-stream-prefix": "redis",
                  "awslogs-create-group": "true" // Use true here as we didn't create the redis stream manually
              }
          }
        }
      ]
    }));
    const taskDefArn = taskDef.taskDefinition.taskDefinitionArn;
    console.log(`Task Definition Registered: ${taskDefArn}`);

    // 7. Create or Update Service
    const checkService = await ecs.send(new DescribeServicesCommand({ cluster: CLUSTER_NAME, services: [SERVICE_NAME] }));
    const serviceExists = checkService.services.length > 0 && checkService.services[0].status !== "INACTIVE";

    const TG_ARN = "arn:aws:elasticloadbalancing:eu-west-1:716563790683:targetgroup/bpn-backend-tg/069ac2b56b659ba3";

    if (serviceExists) {
        console.log("Service exists. Deleting to recreate with Load Balancer (Required)...");
        const { DeleteServiceCommand } = require("@aws-sdk/client-ecs");
        await ecs.send(new UpdateServiceCommand({ cluster: CLUSTER_NAME, service: SERVICE_NAME, desiredCount: 0 }));
        await ecs.send(new DeleteServiceCommand({ cluster: CLUSTER_NAME, service: SERVICE_NAME }));
        console.log("Service deleted. Waiting for cleanup (60s)...");
        await new Promise(r => setTimeout(r, 60000));
    }

    console.log("Creating ECS Service with Load Balancer...");
    await ecs.send(new CreateServiceCommand({
        cluster: CLUSTER_NAME,
        serviceName: SERVICE_NAME,
        taskDefinition: taskDefArn,
        desiredCount: 1,
        launchType: "FARGATE",
        loadBalancers: [{
            targetGroupArn: TG_ARN,
            containerName: "bpn-backend",
            containerPort: 3000
        }],
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: subnetIds,
                assignPublicIp: "ENABLED",
                securityGroups: [] // Note: Ensure this SG allows inbound from ALB (Port 3000)
            }
        }
    }));

    console.log("\n--- DEPLOYMENT COMMANDS SENT ---");
    console.log(`Cluster: ${CLUSTER_NAME}`);
    console.log(`Service: ${SERVICE_NAME}`);
    console.log("\nNote: Service is provisioning. You can check status with deploy/run-verify.js");

  } catch (err) {
    console.error("ECS Deployment Error:", err);
  }
}

deploy();
