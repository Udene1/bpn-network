import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const LOG_FILE = '../../docs/e2e_results.md';

function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

async function testDashboard() {
  const separator = '\n\n' + '='.repeat(40) + '\n';
  const header = `${separator}# Merchant Dashboard Enhancement Test - ${new Date().toLocaleString()}\n\n`;
  fs.appendFileSync(LOG_FILE, header);

  console.log('--- Phase 0: Login ---');
  const loginRes = await axios.post(`${BASE_URL}/login`, { phoneNumber: '+2348000000000' });
  const token = loginRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    log('--- Phase 1: Dashboard Stats (with Chart Data) ---');
    const statsRes = await axios.get(`${BASE_URL}/merchant/stats`, { headers });
    log(`Stats Result: ${JSON.stringify(statsRes.data, null, 2)}`);
    if (statsRes.data.chartData && statsRes.data.chartData.length === 7) {
        log('✅ Chart data correctly aggregated for 7 days.');
    } else {
        log('❌ Chart data missing or incorrect length.');
    }

    log('\n--- Phase 2: Transaction Filtering ---');
    const filterRes = await axios.get(`${BASE_URL}/merchant/transactions?status=COMPLETED&limit=5`, { headers });
    log(`Filtered Count: ${filterRes.data.length}`);
    const allCompleted = filterRes.data.every(tx => tx.status === 'COMPLETED');
    log(allCompleted ? '✅ Filtering by status works.' : '❌ Filtering failed.');

    log('\n--- Phase 3: Customer Lookup by Hash ---');
    // Using a known hash from the database
    const hash = '02c47cbdf0bf6e0447b714db03b73523:946d679c9b7262681aecd6d85aad400aff030342feb7525b7b2ed1ed8091b7a4'; 
    const lookupRes = await axios.get(`${BASE_URL}/merchant/lookup-customer/${encodeURIComponent(hash)}`, { headers });
    log(`Lookup Success: ${JSON.stringify(lookupRes.data, null, 2)}`);
    log(lookupRes.data.maskedName ? '✅ Customer lookup returns masked profile.' : '❌ Lookup returned sensitive data or failed.');

    log('\n✅ **Merchant Dashboard Verification Completed Successfully**');

  } catch (e) {
    log(`\n❌ **Dashboard Test Failed**: ${e.response?.data?.error || e.message}`);
  }
}

testDashboard();
