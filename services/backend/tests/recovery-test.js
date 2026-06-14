import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const LOG_FILE = '../../docs/e2e_results.md';

function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

async function testRecovery() {
  const separator = '\n\n' + '='.repeat(40) + '\n';
  const header = `${separator}# Recovery Flow Test - ${new Date().toLocaleString()}\n\n`;
  fs.appendFileSync(LOG_FILE, header);

  try {
    log('--- Phase 0: Login ---');
    const loginRes = await axios.post(`${BASE_URL}/login`, { phoneNumber: '+2348000000000' });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    log('\n--- Phase 1: Lookup Buyer (Manual Fallback) ---');
    const lookupRes = await axios.post(`${BASE_URL}/lookup-buyer`, { phoneNumber: '+2348000000000' }, { headers });
    log(`Lookup Success: ${JSON.stringify(lookupRes.data, null, 2)}`);

    log('\n--- Phase 2: Create Session ---');
    const invoiceRes = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-777', amount: 3500 });
    const sessionToken = invoiceRes.data.token;
    log(`Invoice Token: ${sessionToken}`);

    log('\n--- Phase 3: Verify PIN (Authorizing fallback txn) ---');
    const pinRes = await axios.post(`${BASE_URL}/verify-pin`, {
      sessionToken,
      phoneNumber: '+2348000000000',
      pin: '1234' 
    }, { headers });
    log(`Payment Result: ${JSON.stringify(pinRes.data, null, 2)}`);

    log('\n✅ **Recovery Flow Test Completed Successfully**');

  } catch (e) {
    log(`\n❌ **Recovery Test Failed**: ${e.response?.data?.error || e.message}`);
  }
}

testRecovery();
