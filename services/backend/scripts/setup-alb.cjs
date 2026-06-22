const { ElasticLoadBalancingV2Client, CreateLoadBalancerCommand, CreateTargetGroupCommand, CreateListenerCommand } = require("@aws-sdk/client-elastic-load-balancing-v2");
const { EC2Client, DescribeSubnetsCommand, DescribeVpcsCommand, CreateSecurityGroupCommand, AuthorizeSecurityGroupIngressCommand } = require("@aws-sdk/client-ec2");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../docs/.env') });

const region = "eu-west-1";
const config = {
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const elb = new ElasticLoadBalancingV2Client(config);
const ec2 = new EC2Client(config);

async function setup() {
  console.log("--- BPN ALB Provisioning ---");
  
  try {
    // 1. Get VPC and Subnets
    const vpcs = await ec2.send(new DescribeVpcsCommand({ Filters: [{ Name: "isDefault", Values: ["true"] }] }));
    const vpcId = vpcs.Vpcs[0].VpcId;
    const subnets = await ec2.send(new DescribeSubnetsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] }));
    const subnetIds = subnets.Subnets.map(s => s.SubnetId);

    // 2. Create Security Group for ALB
    console.log("Creating Security Group for ALB...");
    let sgId;
    try {
        const sgRes = await ec2.send(new CreateSecurityGroupCommand({
            GroupName: "bpn-alb-sg",
            Description: "Allows 80 and 443 for BPN ALB",
            VpcId: vpcId
        }));
        sgId = sgRes.GroupId;
        await ec2.send(new AuthorizeSecurityGroupIngressCommand({
            GroupId: sgId,
            IpPermissions: [
                { IpProtocol: "tcp", FromPort: 80, ToPort: 80, IpRanges: [{ CidrIp: "0.0.0.0/0" }] },
                { IpProtocol: "tcp", FromPort: 443, ToPort: 443, IpRanges: [{ CidrIp: "0.0.0.0/0" }] }
            ]
        }));
    } catch (e) {
        if (e.name === "InvalidGroup.Duplicate") {
            const { DescribeSecurityGroupsCommand } = require("@aws-sdk/client-ec2");
            const sgs = await ec2.send(new DescribeSecurityGroupsCommand({ GroupNames: ["bpn-alb-sg"] }));
            sgId = sgs.SecurityGroups[0].GroupId;
        } else throw e;
    }
    console.log(`ALB Security Group: ${sgId}`);

    // 3. Create Target Group
    console.log("Creating Target Group...");
    const tgRes = await elb.send(new CreateTargetGroupCommand({
      Name: "bpn-backend-tg",
      Protocol: "HTTP",
      Port: 3000,
      VpcId: vpcId,
      TargetType: "ip",
      HealthCheckPath: "/health",
      HealthCheckIntervalSeconds: 30,
      HealthyThresholdCount: 2,
      UnhealthyThresholdCount: 3
    }));
    const tgArn = tgRes.TargetGroups[0].TargetGroupArn;
    console.log(`Target Group Created: ${tgArn}`);

    // 4. Create ALB
    console.log("Creating Load Balancer...");
    const albRes = await elb.send(new CreateLoadBalancerCommand({
      Name: "bpn-backend-alb",
      Subnets: subnetIds,
      SecurityGroups: [sgId],
      Scheme: "internet-facing",
      Type: "application"
    }));
    const albArn = albRes.LoadBalancers[0].LoadBalancerArn;
    const albDns = albRes.LoadBalancers[0].DNSName;
    console.log(`ALB Created: ${albArn}`);
    console.log(`DNS Name: ${albDns}`);

    // 5. Create HTTP Listener (Redirect 80 -> 443)
    console.log("Creating HTTP Listener (port 80)...");
    await elb.send(new CreateListenerCommand({
        LoadBalancerArn: albArn,
        Port: 80,
        Protocol: "HTTP",
        DefaultActions: [{
            Type: "redirect",
            RedirectConfig: {
                Protocol: "HTTPS",
                Port: "443",
                StatusCode: "HTTP_301"
            }
        }]
    }));
    console.log("HTTP (80) Listener with HTTPS redirect created.");

    console.log("\n--- ALB BASE PROVISIONING COMPLETE ---");
    console.log("Next: Wait for ACM cert and create HTTPS listener.");

  } catch (err) {
    console.error("ALB Setup Error:", err.message);
  }
}

setup();
