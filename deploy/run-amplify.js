const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Self-install dependencies into a temp directory to keep project clean
const TEMP_DIR = path.join(process.cwd(), '.bpn-deploy-temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

console.log("--- Installing AWS SDK v3 for Amplify Deployment (Temp) ---");
execSync('npm install --prefix .bpn-deploy-temp @aws-sdk/client-amplify @aws-sdk/client-route-53 dotenv', { stdio: 'inherit' });

// Now run the actual deployment logic
const scriptPath = path.join(process.cwd(), 'apps/merchant-dashboard/scripts/amplify-deploy.cjs');
if (!fs.existsSync(path.dirname(scriptPath))) fs.mkdirSync(path.dirname(scriptPath), { recursive: true });

console.log(`--- Executing Amplify Deployment Logic: ${scriptPath} ---`);

// Configure node to look in the temp node_modules
process.env.NODE_PATH = path.join(TEMP_DIR, 'node_modules');
require('module').Module._initPaths();

// Load the deployment logic
require(scriptPath);
