const { ElasticLoadBalancingV2Client, DescribeTargetHealthCommand, DescribeLoadBalancersCommand } = require("@aws-sdk/client-elastic-load-balancing-v2");
const { ECSClient, DescribeServicesCommand } = require("@aws-sdk/client-ecs");
const { EC2Client, DescribeSecurityGroupsCommand } = require("@aws-sdk/client-ec2");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../docs/.env') });

const config = {
  region: "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const elb = new ElasticLoadBalancingV2Client(config);
const ecs = new ECSClient(config);
const ec2 = new EC2Client(config);

const TG_ARN = "arn:aws:elasticloadbalancing:eu-west-1:716563790683:targetgroup/bpn-backend-tg/069ac2b56b659ba3";
const SERVICE_NAME = "bpn-backend-service";
const CLUSTER_NAME = "bpn-cluster";

async function debug() {
  console.log("--- BPN Connectivity Debug ---");
  
  try {
    // 1. Target Health
    const health = await elb.send(new DescribeTargetHealthCommand({ TargetGroupArn: TG_ARN }));
    console.log("\nTarget Health:");
    console.log(JSON.stringify(health.TargetHealthDescriptions, null, 2));

    // 2. ECS Service Network Config
    const svc = await ecs.send(new DescribeServicesCommand({ cluster: CLUSTER_NAME, services: [SERVICE_NAME] }));
    const netConfig = svc.services[0].networkConfiguration.awsvpcConfiguration;
    console.log("\nECS Network Config:");
    console.log(JSON.stringify(netConfig, null, 2));

    // 3. Check Security Groups
    const sgs = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: netConfig.securityGroups }));
    console.log("\nECS Security Group Rules:");
    sgs.SecurityGroups.forEach(sg => {
        console.log(`SG: ${sg.GroupId} (${sg.GroupName})`);
        sg.IpPermissions.forEach(p => {
            console.log(`  Allow ${p.IpProtocol} ${p.FromPort}-${p.ToPort} from ${JSON.stringify(p.IpRanges)}`);
        });
    });

    // 4. ALB DNS Verification
    const alb = await elb.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: ["arn:aws:elasticloadbalancing:eu-west-1:716563790683:loadbalancer/app/bpn-backend-alb/adf68af51b65d423"] }));
    console.log("\nALB Details:");
    console.log("  DNS Name:", alb.LoadBalancers[0].DNSName);
    console.log("  Canonical Hosted Zone ID:", alb.LoadBalancers[0].CanonicalHostedZoneId);

  } catch (err) {
    console.error("Debug Error:", err.message);
  }
}

debug();
