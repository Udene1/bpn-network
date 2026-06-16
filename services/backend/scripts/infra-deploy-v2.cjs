const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const path = require('path');

// Load credentials from docs/.env
dotenv.config({ path: path.join(__dirname, '../../docs/.env') });

AWS.config.update({
  region: process.env.AWS_REGION || "eu-west-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const route53 = new AWS.Route53();
const acm = new AWS.ACM();

async function deploy() {
  console.log("--- BPN Infrastructure Provisioning (SDK v2/npx) ---");

  try {
    // 1. Get Default VPC
    const vpcs = await ec2.describeVpcs({ Filters: [{ Name: "isDefault", Values: ["true"] }] }).promise();
    const vpcId = vpcs.Vpcs[0].VpcId;
    console.log(`VPC Found: ${vpcId}`);

    // 2. Create Security Group
    let sgId;
    try {
        const sg = await ec2.createSecurityGroup({
            GroupName: "bpn-prod-sg",
            Description: "BPN Backend Security Group",
            VpcId: vpcId
        }).promise();
        sgId = sg.GroupId;
        console.log(`Security Group Created: ${sgId}`);
    } catch (e) {
        if (e.code === 'InvalidGroup.Duplicate') {
            console.log("Security Group bpn-prod-sg already exists.");
            const sgs = await ec2.describeSecurityGroups({ GroupNames: ["bpn-prod-sg"] }).promise();
            sgId = sgs.SecurityGroups[0].GroupId;
        } else throw e;
    }

    // 3. Allow DB Access
    try {
        await ec2.authorizeSecurityGroupIngress({
            GroupId: sgId,
            IpPermissions: [{ IpProtocol: "tcp", FromPort: 5432, ToPort: 5432, IpRanges: [{ CidrIp: "0.0.0.0/0" }] }]
        }).promise();
        console.log("Ingress rules configured.");
    } catch (e) {
        if (e.code !== 'InvalidPermission.Duplicate') console.warn("SG Ingress warning:", e.message);
    }

    // 4. Create RDS Instance
    console.log("Creating RDS Instance (bpn-prod-db)...");
    try {
        await rds.createDBInstance({
            DBInstanceIdentifier: "bpn-prod-db",
            Engine: "postgres",
            DBInstanceClass: "db.t4g.micro",
            AllocatedStorage: 20,
            MasterUsername: "bpnadmin",
            MasterUserPassword: "SecurePassword123!",
            DBName: "bpndb",
            VpcSecurityGroupIds: [sgId],
            PubliclyAccessible: true
        }).promise();
        console.log("RDS provisioning initiated.");
    } catch (e) {
        if (e.code === 'DBInstanceAlreadyExists') {
            console.log("RDS instance already exists.");
        } else throw e;
    }

    // 5. Route 53
    console.log("Creating Route 53 Hosted Zone for verimut.icu...");
    try {
        const zone = await route53.createHostedZone({
            Name: "verimut.icu",
            CallerReference: `bpn-${Date.now()}`
        }).promise();
        console.log(`Hosted Zone Created. NS records: ${zone.DelegationSet.NameServers.join(", ")}`);
    } catch (e) {
        if (e.code === 'HostedZoneAlreadyExists') {
            console.log("Hosted Zone already exists.");
        } else throw e;
    }

    // 6. ACM
    console.log("Requesting SSL Certificate for api.verimut.icu...");
    const cert = await acm.requestCertificate({
      DomainName: "api.verimut.icu",
      ValidationMethod: "DNS"
    }).promise();
    console.log(`Certificate requested: ${cert.CertificateArn}`);

    console.log("\n--- INFRASTRUCTURE INITIALIZED ---");
    console.log("1. Update your Domain Registrar NS records to the ones listed above.");
    console.log("2. Wait 5 mins for RDS, then create App Runner service via Console linking to GitHub.");

  } catch (err) {
    console.error("Deployment Error:", err.message);
  }
}

deploy();
