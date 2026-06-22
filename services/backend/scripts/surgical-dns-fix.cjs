const { Route53Client, ChangeResourceRecordSetsCommand } = require("@aws-sdk/client-route-53");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../docs/.env') });

const config = {
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const r53 = new Route53Client(config);
const HOSTED_ZONE_ID = "Z0082801RZ31CO57HUYM";
const DOMAIN = "api.verimut.icu.";
const STALE_IP = "108.129.150.80";
const ALB_DNS = "bpn-backend-alb-978245327.eu-west-1.elb.amazonaws.com";
const ALB_ZONE_ID = "Z32O12XQLNTSW2";

async function fix() {
  console.log("--- BPN Surgical DNS Fix ---");
  
  try {
    const changes = [
      {
        Action: "DELETE",
        ResourceRecordSet: {
          Name: DOMAIN,
          Type: "A",
          TTL: 300,
          ResourceRecords: [{ Value: STALE_IP }]
        }
      },
      {
        Action: "CREATE",
        ResourceRecordSet: {
          Name: DOMAIN,
          Type: "A",
          AliasTarget: {
            HostedZoneId: ALB_ZONE_ID,
            DNSName: ALB_DNS,
            EvaluateTargetHealth: false
          }
        }
      }
    ];

    console.log("Sending ChangeBatch...");
    const res = await r53.send(new ChangeResourceRecordSetsCommand({
      HostedZoneId: HOSTED_ZONE_ID,
      ChangeBatch: { Changes: changes }
    }));
    console.log(`Success! Change ID: ${res.ChangeInfo.Id}`);
  } catch (err) {
    console.error("DNS Fix Error:", err.message);
    
    // Fallback: If DELETE fails, just try UPSERT with Alias again
    try {
        console.log("Retrying with UPSERT...");
        await r53.send(new ChangeResourceRecordSetsCommand({
            HostedZoneId: HOSTED_ZONE_ID,
            ChangeBatch: {
                Changes: [{
                    Action: "UPSERT",
                    ResourceRecordSet: {
                        Name: DOMAIN,
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
        console.log("UPSERT Successful.");
    } catch (e2) {
        console.error("UPSERT also failed:", e2.message);
    }
  }
}

fix();
