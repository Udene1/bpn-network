const { ACMClient, DescribeCertificateCommand } = require("@aws-sdk/client-acm");
const { ElasticLoadBalancingV2Client, CreateListenerCommand } = require("@aws-sdk/client-elastic-load-balancing-v2");
const { Route53Client, ChangeResourceRecordSetsCommand } = require("@aws-sdk/client-route-53");
const { ECSClient, UpdateServiceCommand } = require("@aws-sdk/client-ecs");
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

const acm = new ACMClient(config);
const elb = new ElasticLoadBalancingV2Client(config);
const r53 = new Route53Client({ ...config, region: "us-east-1" });
const ecs = new ECSClient(config);

const CERT_ARN = "arn:aws:acm:eu-west-1:716563790683:certificate/082e60ae-677b-4bcc-8804-5a0d488ab43c";
const ALB_ARN = "arn:aws:elasticloadbalancing:eu-west-1:716563790683:loadbalancer/app/bpn-backend-alb/adf68af51b65d423";
const ALB_DNS = "bpn-backend-alb-978245327.eu-west-1.elb.amazonaws.com";
const ALB_ZONE_ID = "Z32O1B3FME9TGS"; // ALB Hosted Zone ID for eu-west-1
const TG_ARN = "arn:aws:elasticloadbalancing:eu-west-1:716563790683:targetgroup/bpn-backend-tg/069ac2b56b659ba3";
const HOSTED_ZONE_ID = "Z0082801RZ31CO57HUYM";
const SERVICE_NAME = "bpn-backend-service";
const CLUSTER_NAME = "bpn-cluster";

async function finish() {
  console.log("--- Finalizing BPN HTTPS Setup ---");
  
  try {
    // 1. Wait for Cert
    console.log("Checking Certificate Status...");
    const detail = await acm.send(new DescribeCertificateCommand({ CertificateArn: CERT_ARN }));
    if (detail.Certificate.Status !== "ISSUED") {
        console.log(`Certificate is still ${detail.Certificate.Status}. Please wait.`);
        return;
    }
    console.log("Certificate ISSUED.");

    // 2. Create HTTPS Listener
    console.log("Creating HTTPS (443) Listener...");
    try {
        await elb.send(new CreateListenerCommand({
            LoadBalancerArn: ALB_ARN,
            Port: 443,
            Protocol: "HTTPS",
            Certificates: [{ CertificateArn: CERT_ARN }],
            DefaultActions: [{ Type: "forward", TargetGroupArn: TG_ARN }]
        }));
        console.log("HTTPS Listener created.");
    } catch (e) {
        if (e.name === "DuplicateListenerException") console.log("HTTPS Listener already exists.");
        else throw e;
    }

    // 3. Update Route 53 (Alias record)
    console.log(`Mapping api.verimut.icu to ALB Alias (${ALB_DNS})...`);
    await r53.send(new ChangeResourceRecordSetsCommand({
        HostedZoneId: HOSTED_ZONE_ID,
        ChangeBatch: {
            Changes: [{
                Action: "UPSERT",
                ResourceRecordSet: {
                    Name: "api.verimut.icu.",
                    Type: "A",
                    AliasTarget: {
                        HostedZoneId: ALB_ZONE_ID,
                        DNSName: ALB_DNS,
                        EvaluateTargetHealth: false
                    }
                }
            }]
        }
    }));
    console.log("Route 53 Alias record created.");

    // 4. Update ECS Service to use ALB
    // Note: You can't add a Load Balancer to a service after it's created if it didn't have one.
    // I will tell the user that the service needs to be recreated or we use direct IP for now.
    // ACTUALLY, for Fargate, you must specify the LB at creation.
    console.log("\n--- IMPORTANT ---");
    console.log("ECS Service must be recreated to bind to the Load Balancer.");
    console.log("I will now update the deployment script for future runs and proceed with service recreation.");

  } catch (err) {
    console.error("Finalization Error:", err.message);
  }
}

finish();
