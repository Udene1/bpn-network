const { ACMClient, RequestCertificateCommand, DescribeCertificateCommand } = require("@aws-sdk/client-acm");
const { Route53Client, ChangeResourceRecordSetsCommand } = require("@aws-sdk/client-route-53");
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
const r53 = new Route53Client({ ...config, region: "us-east-1" }); // Global Route 53
const DOMAIN = "api.verimut.icu";
const HOSTED_ZONE_ID = "Z0082801RZ31CO57HUYM";

async function setup() {
  console.log(`--- Requesting SSL Certificate for ${DOMAIN} ---`);
  
  try {
    // 1. Request Certificate
    const req = await acm.send(new RequestCertificateCommand({
      DomainName: DOMAIN,
      ValidationMethod: "DNS",
      IdempotencyToken: "bpnapi123"
    }));
    const certArn = req.CertificateArn;
    console.log(`Certificate Requested: ${certArn}`);

    // 2. Wait for validation records (polling)
    console.log("Waiting for DNS validation records...");
    let validationRecord;
    for (let i = 0; i < 10; i++) {
      const detail = await acm.send(new DescribeCertificateCommand({ CertificateArn: certArn }));
      const options = detail.Certificate.DomainValidationOptions;
      if (options && options[0].ResourceRecord) {
        validationRecord = options[0].ResourceRecord;
        break;
      }
      await new Promise(r => setTimeout(r, 5000));
    }

    if (!validationRecord) {
      console.error("Timed out waiting for validation record.");
      return;
    }

    console.log(`Validation Record Found: ${validationRecord.Name} -> ${validationRecord.Value}`);

    // 3. Add to Route 53
    console.log("Adding validation record to Route 53...");
    await r53.send(new ChangeResourceRecordSetsCommand({
      HostedZoneId: HOSTED_ZONE_ID,
      ChangeBatch: {
        Changes: [{
          Action: "UPSERT",
          ResourceRecordSet: {
            Name: validationRecord.Name,
            Type: validationRecord.Type,
            TTL: 60,
            ResourceRecords: [{ Value: validationRecord.Value }]
          }
        }]
      }
    }));
    console.log("Validation record added. ACM will now verify...");

  } catch (err) {
    console.error("Certificate Setup Error:", err.message);
  }
}

setup();
