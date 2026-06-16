const { RDSClient, CreateDBInstanceCommand } = require("@aws-sdk/client-rds");
const { EC2Client, CreateSecurityGroupCommand, AuthorizeSecurityGroupIngressCommand, DescribeVpcsCommand } = require("@aws-sdk/client-ec2");
const { Route53Client, CreateHostedZoneCommand } = require("@aws-sdk/client-route-53");
const { ACMClient, RequestCertificateCommand } = require("@aws-sdk/client-acm");
const dotenv = require('dotenv');
const path = require('path');

// Load credentials from docs/.env
dotenv.config({ path: path.join(__dirname, '../../docs/.env') });

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
  console.log("--- BPN Infrastructure Provisioning (SDK/npx) ---");

  try {
    // 1. Get Default VPC
    const vpcs = await ec2.send(new DescribeVpcsCommand({ Filters: [{ Name: "isDefault", Values: ["true"] }] }));
    const vpcId = vpcs.Vpcs[0].VpcId;
    console.log(`VPC Found: ${vpcId}`);

    // 2. Create Security Group
    let sgId;
    try {
        const sg = await ec2.send(new CreateSecurityGroupCommand({
            GroupName: "bpn-prod-sg",
            Description: "BPN Backend Security Group",
            VpcId: vpcId
        }));
        sgId = sg.GroupId;
        console.log(`Security Group Created: ${sgId}`);
    } catch (e) {
        if (e.name === 'InvalidGroup.Duplicate') {
            console.log("Security Group bpn-prod-sg already exists, skipping creation...");
            // Ideally lookup the ID here, but for now we assume it's created
        } else throw e;
    }

    // 3. Create RDS Instance
    console.log("Creating RDS Instance (this will take ~5-10 minutes)...");
    try {
        await rds.send(new CreateDBInstanceCommand({
            DBInstanceIdentifier: "bpn-prod-db",
            Engine: "postgres",
            DBInstanceClass: "db.t4g.micro",
            AllocatedStorage: 20,
            MasterUsername: "bpnadmin",
            MasterUserPassword: "SecurePassword123!",
            DBName: "bpndb",
            PubliclyAccessible: true
        }));
        console.log("RDS provisioning initiated.");
    } catch (e) {
        if (e.name === 'DBInstanceAlreadyExists') {
            console.log("RDS instance bpn-prod-db already exists.");
        } else throw e;
    }

    // 4. Route 53
    console.log("Creating Route 53 Hosted Zone for verimut.icu...");
    try {
        const zone = await route53.send(new CreateHostedZoneCommand({
            Name: "verimut.icu",
            CallerReference: `bpn-${Date.now()}`
        }));
        console.log(`Hosted Zone Created. NS records: ${zone.DelegationSet.NameServers.join(", ")}`);
    } catch (e) {
        if (e.name === 'HostedZoneAlreadyExists') {
            console.log("Hosted Zone verimut.icu already exists.");
        } else throw e;
    }

    // 5. ACM
    console.log("Requesting SSL Certificate for api.verimut.icu...");
    const cert = await acm.send(new RequestCertificateCommand({
      DomainName: "api.verimut.icu",
      ValidationMethod: "DNS"
    }));
    console.log(`Certificate requested: ${cert.CertificateArn}`);

    console.log("\n--- INFRASTRUCTURE INITIALIZED ---");
    console.log("Please wait for RDS to become available and update your NS records.");

  } catch (err) {
    console.error("Deployment Error:", err.message);
  }
}

deploy();
