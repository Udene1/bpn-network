import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const LOG_FILE = '../../docs/e2e_results.md';

function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

async function testCompliance() {
  const separator = '\n\n' + '='.repeat(40) + '\n';
  const header = `${separator}# Compliance & Audit Verification - ${new Date().toLocaleString()}\n\n`;
  fs.appendFileSync(LOG_FILE, header);

  console.log('--- Phase 0: Login ---');
  const loginRes = await axios.post(`${BASE_URL}/login`, { phoneNumber: '+2348000000000' });
  const token = loginRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    log('--- Phase 1: Verify Audit Logs ---');
    const logsRes = await axios.get(`${BASE_URL}/merchant/ndpr-export`, { headers });
    const logLines = logsRes.data.split('\n').filter(l => l.length > 0);
    log(`Total Audit Records: ${logLines.length - 1}`); // Skip header
    if (logLines.length > 1) {
        log('✅ Audit logs are capturing events.');
    } else {
        log('❌ No audit logs found.');
    }

    log('\n--- Phase 2: Transaction Reversal (VOID Flow) ---');
    // Start a session
    const invoiceRes = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-VOID-7', amount: 500 });
    const sessionToken = invoiceRes.data.token;
    log(`Session Created: ${sessionToken}`);

    // Trigger Reversal
    const reverseRes = await axios.post(`${BASE_URL}/merchant/reverse-transaction`, { 
        sessionToken, 
        reason: 'Buyer abandoned or biometric timeout' 
    }, { headers });
    
    log(`Reversal Result: ${JSON.stringify(reverseRes.data, null, 2)}`);
    if (reverseRes.data.status === 'VOIDED') {
        log('✅ Transaction reversal/voiding works.');
    } else {
        log('❌ Reversal failed.');
    }

    // Verify Audit of Reversal
    const auditCheck = await axios.get(`${BASE_URL}/merchant/ndpr-export`, { headers });
    if (auditCheck.data.includes('TXN_REVERSED')) {
        log('✅ Reversal event recorded in Audit Log.');
    } else {
        log('❌ Reversal event missing from Audit.');
    }

    log('\n✅ **Compliance & Audit Verification Completed**');

  } catch (e) {
    log(`\n❌ **Compliance Test Failed**: ${e.response?.data?.error || e.message}`);
  }
}

testCompliance();
