import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Self-install dependencies into a temp directory to keep project clean
const TEMP_DIR = path.join(process.cwd(), '.bpn-deploy-temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

console.log("--- Installing AWS SDK v3 (Temp) ---");
execSync('npm install --prefix .bpn-deploy-temp @aws-sdk/client-rds @aws-sdk/client-ec2 @aws-sdk/client-route53 @aws-sdk/client-acm dotenv', { stdio: 'inherit' });

// Now run the actual deployment logic
const scriptPath = path.join(process.cwd(), 'services/backend/scripts/infra-deploy.js');
console.log(`--- Executing Infrastructure Logic: ${scriptPath} ---`);

// Configure node to look in the temp node_modules
process.env.NODE_PATH = path.join(TEMP_DIR, 'node_modules');
require('module').Module._initPaths();

// Load the deployment logic
import('./services/backend/scripts/infra-deploy.js');
