const { EC2Client, DescribeSecurityGroupsCommand, AuthorizeSecurityGroupIngressCommand } = require("@aws-sdk/client-ec2");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../docs/.env') });

const region = "eu-west-1"; // The RDS region
const config = {
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const ec2 = new EC2Client(config);
const SG_NAME = "bpn-prod-sg";

async function updateRdsSg() {
  console.log(`--- Updating RDS Security Group in ${region} ---`);
  
  try {
    // 1. Find the SG
    const sgs = await ec2.send(new DescribeSecurityGroupsCommand({
      Filters: [{ Name: "group-name", Values: [SG_NAME] }]
    }));
    
    if (sgs.SecurityGroups.length === 0) {
      console.log(`Security Group ${SG_NAME} not found.`);
      return;
    }

    const sgId = sgs.SecurityGroups[0].GroupId;
    console.log(`Found SG: ${sgId}`);

    // 2. Allow port 5432 from anywhere (for test stability)
    console.log("Adding ingress rule for port 5432 (Postgres)...");
    try {
      await ec2.send(new AuthorizeSecurityGroupIngressCommand({
        GroupId: sgId,
        IpPermissions: [{
          IpProtocol: "tcp",
          FromPort: 5432,
          ToPort: 5432,
          IpRanges: [{ CidrIp: "0.0.0.0/0", Description: "Allow BPN ECS Cross-Region" }]
        }]
      }));
      console.log("Port 5432 opened.");
    } catch (e) {
      if (e.name === "InvalidPermission.Duplicate") {
        console.log("Port 5432 is already open.");
      } else {
        throw e;
      }
    }

  } catch (err) {
    console.error("RDS SG Update Error:", err.message);
  }
}

updateRdsSg();
