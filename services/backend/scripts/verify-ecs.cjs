const { ECSClient, DescribeServicesCommand, ListTasksCommand, DescribeTasksCommand } = require("@aws-sdk/client-ecs");
const { EC2Client, DescribeNetworkInterfacesCommand } = require("@aws-sdk/client-ec2");
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

const CLUSTER_NAME = "bpn-cluster";
const SERVICE_NAME = "bpn-backend-service";

async function verify() {
  console.log("--- BPN ECS Service Verification ---");
  
  try {
    // 1. Check Service Status
    const serviceRes = await ecs.send(new DescribeServicesCommand({ cluster: CLUSTER_NAME, services: [SERVICE_NAME] }));
    const service = serviceRes.services[0];
    console.log(`Service Status: ${service.status}`);
    console.log(`Desired: ${service.desiredCount}, Running: ${service.runningCount}, Pending: ${service.pendingCount}`);

    console.log("\nService Events:");
    service.events.slice(0, 5).forEach(e => console.log(`- ${e.createdAt}: ${e.message}`));

    if (service.runningCount === 0) {
      console.log("No tasks running yet. Waiting for provisioning...");
      return;
    }

    // 2. Get the latest Task ARN
    const tasksRes = await ecs.send(new ListTasksCommand({ cluster: CLUSTER_NAME, serviceName: SERVICE_NAME }));
    const taskDetails = await ecs.send(new DescribeTasksCommand({ cluster: CLUSTER_NAME, tasks: tasksRes.taskArns }));
    
    // Sort by startedAt descending
    const task = taskDetails.tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    console.log(`Latest Task Status: ${task.lastStatus} (${task.taskArn})`);
    
    const eniAtt = task.attachments.find(a => a.type === "ElasticNetworkInterface");
    const eniId = eniAtt.details.find(d => d.name === "networkInterfaceId").value;
    console.log(`Network Interface ID: ${eniId}`);

    // 4. Get Public IP
    const eniDetails = await ec2.send(new DescribeNetworkInterfacesCommand({ NetworkInterfaceIds: [eniId] }));
    const publicIp = eniDetails.NetworkInterfaces[0].Association.PublicIp;
    
    console.log("\n--- DEPLOYMENT VERIFIED ---");
    console.log(`Public API Endpoint: http://${publicIp}:3000`);
    console.log(`Health Check: http://${publicIp}:3000/health`);
    console.log("\nNote: Ensure Security Group allows inbound on port 3000.");

  } catch (err) {
    console.error("Verification Error:", err.message);
  }
}

verify();
