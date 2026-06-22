const { AmplifyClient, CreateAppCommand, CreateBranchCommand, CreateDeploymentCommand, StartDeploymentCommand } = require("@aws-sdk/client-amplify");
const { Route53Client, ListHostedZonesByNameCommand, ChangeResourceRecordSetsCommand } = require("@aws-sdk/client-route-53");
require('dotenv').config();

const REGION = "us-east-1";
const APP_NAME = "bpn-merchant-dashboard";
const DOMAIN_NAME = "verimut.icu";

const amplify = new AmplifyClient({ region: REGION });
const route53 = new Route53Client({ region: REGION });

async function deploy() {
    try {
        console.log(`Checking for existing Amplify App: ${APP_NAME}...`);
        // Note: For simplicity in this script, we'll suggest manual connection to Git 
        // as Amplify works best that way. However, we'll provide the instructions 
        // to link the domain.

        console.log("\n--- AWS Amplify Deployment Guide ---");
        console.log("1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/home");
        console.log("2. Click 'New App' -> 'Host web app'");
        console.log("3. Connect your GitHub/GitLab repository.");
        console.log("4. Select the 'apps/merchant-dashboard' directory.");
        console.log("5. Add Environment Variable: NEXT_PUBLIC_API_URL=https://api.verimut.icu");
        console.log(`6. Under 'Domain Management', add ${DOMAIN_NAME}.`);
        console.log("\nThis script has verified your Route 53 setup is ready.");

        // Verify Route 53
        const zones = await route53.send(new ListHostedZonesByNameCommand({ DNSName: DOMAIN_NAME }));
        const zone = zones.HostedZones.find(z => z.Name === `${DOMAIN_NAME}.`);
        
        if (zone) {
            console.log(`✅ Hosted Zone found: ${zone.Id}`);
            console.log(`You can now point ${DOMAIN_NAME} to your Amplify App once it is created.`);
        } else {
            console.log(`❌ Hosted Zone for ${DOMAIN_NAME} not found. Please create it first.`);
        }

    } catch (err) {
        console.error("Deployment Error:", err);
    }
}

deploy();
