const { EC2Client, DescribeSecurityGroupsCommand, AuthorizeSecurityGroupIngressCommand } = require("@aws-sdk/client-ec2");
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

const ec2 = new EC2Client(config);

async function setup() {
  console.log("--- BPN ECS Security Group Setup ---");
  
  try {
    // 1. Find the default security group for the VPC
    const sgs = await ec2.send(new DescribeSecurityGroupsCommand({
      Filters: [{ Name: "group-name", Values: ["default"] }]
    }));
    
    const defaultSg = sgs.SecurityGroups[0];
    console.log(`Default Security Group: ${defaultSg.GroupId}`);

    // 2. Allow port 3000
    console.log("Adding ingress rule for port 3000...");
    try {
      await ec2.send(new AuthorizeSecurityGroupIngressCommand({
        GroupId: defaultSg.GroupId,
        IpPermissions: [{
          IpProtocol: "tcp",
          FromPort: 3000,
          ToPort: 3000,
          IpRanges: [{ CidrIp: "0.0.0.0/0", Description: "BPN Backend API" }]
        }]
      }));
      console.log("Port 3000 opened successfully.");
    } catch (e) {
      if (e.name === "InvalidPermission.Duplicate") {
        console.log("Port 3000 is already open.");
      } else {
        throw e;
      }
    }

  } catch (err) {
    console.error("Security Group Setup Error:", err.message);
  }
}

setup();
