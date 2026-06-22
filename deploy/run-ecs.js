const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Self-install dependencies into a temp directory to keep project clean
const TEMP_DIR = path.join(process.cwd(), '.bpn-deploy-temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

console.log("--- Installing AWS SDK v3 for ECS Deployment (Temp) ---");
execSync('npm install --prefix .bpn-deploy-temp @aws-sdk/client-sts @aws-sdk/client-ec2 @aws-sdk/client-iam @aws-sdk/client-ecs @aws-sdk/client-cloudwatch-logs @aws-sdk/client-route-53 dotenv', { stdio: 'inherit' });

// Now run the actual deployment logic
const scriptPath = path.join(process.cwd(), 'services/backend/scripts/ecs-deploy.cjs');
console.log(`--- Executing ECS Deployment Logic: ${scriptPath} ---`);

// Configure node to look in the temp node_modules
process.env.NODE_PATH = path.join(TEMP_DIR, 'node_modules');
require('module').Module._initPaths();

// Load the deployment logic
require('../services/backend/scripts/ecs-deploy.cjs');
