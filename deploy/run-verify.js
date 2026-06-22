const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join(process.cwd(), '.bpn-deploy-temp');

// Configure node to look in the temp node_modules
process.env.NODE_PATH = path.join(TEMP_DIR, 'node_modules');
require('module').Module._initPaths();

// Load the verification logic
require('../services/backend/scripts/verify-ecs.cjs');
