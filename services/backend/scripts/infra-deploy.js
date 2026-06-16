import { RDSClient, CreateDBInstanceCommand } from "@aws-sdk/client-rds";
import { EC2Client, CreateSecurityGroupCommand, AuthorizeSecurityGroupIngressCommand, DescribeVpcsCommand } from "@aws-sdk/client-ec2";
import { Route53Client, CreateHostedZoneCommand } from "@aws-sdk/client-route53";
import { ACMClient, RequestCertificateCommand } from "@aws-sdk/client-acm";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../../docs/.env' });

const config = {
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const ec2 = new EC2Client(config);
const rds = new RDSClient(config);
const route53 = new Route53Client(config);
const acm = new ACMClient(config);

async function deploy() {
  console.log("--- BPN Infrastructure Provisioning (SDK) ---");

  try {
    // 1. Get Default VPC
    const vpcs = await ec2.send(new DescribeVpcsCommand({ Filters: [{ Name: "isDefault", Values: ["true"] }] }));
    const vpcId = vpcs.Vpcs[0].VpcId;
    console.log(`VPC Found: ${vpcId}`);

    // 2. Create Security Group
    const sg = await ec2.send(new CreateSecurityGroupCommand({
      GroupName: "bpn-prod-sg",
      Description: "BPN Backend Security Group",
      VpcId: vpcId
    }));
    const sgId = sg.GroupId;
    console.log(`Security Group Created: ${sgId}`);

    // 3. Allow DB and App Access
    await ec2.send(new AuthorizeSecurityGroupIngressCommand({
      GroupId: sgId,
      IpPermissions: [
        { IpProtocol: "tcp", FromPort: 5432, ToPort: 5432, IpRanges: [{ CidrIp: "0.0.0.0/0" }] }, // DB
        { IpProtocol: "tcp", FromPort: 3000, ToPort: 3000, IpRanges: [{ CidrIp: "0.0.0.0/0" }] }  // Backend
      ]
    }));
    console.log("Ingress rules configured.");

    // 4. Create RDS Instance
    console.log("Creating RDS Instance (this will take ~5-10 minutes)...");
    await rds.send(new CreateDBInstanceCommand({
      DBInstanceIdentifier: "bpn-prod-db",
      Engine: "postgres",
      DBInstanceClass: "db.t4g.micro",
      AllocatedStorage: 20,
      MasterUsername: "bpnadmin",
      MasterUserPassword: "SecurePassword123!", // User should change this later
      DBName: "bpndb",
      VpcSecurityGroupIds: [sgId],
      PubliclyAccessible: true
    }));
    console.log("RDS provisioning initiated.");

    // 5. Route 53
    console.log("Creating Route 53 Hosted Zone...");
    const zone = await route53.send(new CreateHostedZoneCommand({
      Name: "verimut.icu",
      CallerReference: `bpn-${Date.now()}`
    }));
    console.log(`Hosted Zone Created. NS records: ${zone.DelegationSet.NameServers.join(", ")}`);

    // 6. ACM
    console.log("Requesting SSL Certificate for api.verimut.icu...");
    const cert = await acm.send(new RequestCertificateCommand({
      DomainName: "api.verimut.icu",
      ValidationMethod: "DNS"
    }));
    console.log(`Certificate requested: ${cert.CertificateArn}`);

    console.log("\n--- INFRASTRUCTURE INITIATED SUCCESSFULLY ---");
    console.log("IMPORTANT: Please update your domain Name Servers to the records listed above.");

  } catch (err) {
    console.error("Deployment Error:", err.message);
  }
}

deploy();
