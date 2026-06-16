const { RDSClient, DescribeDBInstancesCommand } = require("@aws-sdk/client-rds");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../docs/.env') });

const rds = new RDSClient({
  region: process.env.AWS_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function checkResources() {
  console.log("--- Checking AWS Resource Status ---");
  try {
    const data = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: "bpn-prod-db" }));
    const instance = data.DBInstances[0];
    console.log(`DB Status: ${instance.DBInstanceStatus}`);
    if (instance.Endpoint) {
      console.log(`DB Endpoint: ${instance.Endpoint.Address}`);
      console.log(`DB Port: ${instance.Endpoint.Port}`);
    } else {
      console.log("DB Endpoint not yet available.");
    }
  } catch (err) {
    console.error("Error retrieving DB status:", err.message);
  }
}

checkResources();
