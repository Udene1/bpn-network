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
const ZONE_ID = "Z0082801RZ31CO57HUYM";
const IP = "108.129.150.80";

async function updateDns() {
  console.log("--- BPN Route 53 DNS Update ---");
  console.log(`Setting api.verimut.icu -> ${IP}`);
  
  try {
    const res = await r53.send(new ChangeResourceRecordSetsCommand({
      HostedZoneId: ZONE_ID,
      ChangeBatch: {
        Comment: "Auto-mapping BPN Backend IP",
        Changes: [
          {
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: "api.verimut.icu.",
              Type: "A",
              TTL: 300,
              ResourceRecords: [{ Value: IP }]
            }
          }
        ]
      }
    }));
    console.log(`DNS Update Submitted. Status: ${res.ChangeInfo.Status}`);
  } catch (err) {
    console.error("DNS Update Error:", err.message);
  }
}

updateDns();
