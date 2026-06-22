const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join(process.cwd(), '.bpn-deploy-temp');
process.env.NODE_PATH = path.join(TEMP_DIR, 'node_modules');
require('module').Module._initPaths();

require('../services/backend/scripts/finish-https.cjs');
