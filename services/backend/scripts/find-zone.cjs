const { Route53Client, ListHostedZonesCommand } = require("@aws-sdk/client-route-53");
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

async function findZone() {
  console.log("--- BPN Route 53 Zone Discovery ---");
  try {
    const res = await r53.send(new ListHostedZonesCommand({}));
    console.log("Hosted Zones:", JSON.stringify(res.HostedZones, null, 2));
    
    console.log("\nListing records for verimut.icu...");
    const { ListResourceRecordSetsCommand } = require("@aws-sdk/client-route-53");
    const records = await r53.send(new ListResourceRecordSetsCommand({ HostedZoneId: "Z0082801RZ31CO57HUYM" }));
    console.log(JSON.stringify(records.ResourceRecordSets, null, 2));
  } catch (err) {
    console.error("Route 53 Error:", err.message);
  }
}

findZone();
