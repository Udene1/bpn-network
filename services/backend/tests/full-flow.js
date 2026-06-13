import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const LOG_FILE = '../../docs/e2e_results.md';

function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

async function runTest() {
  fs.writeFileSync(LOG_FILE, `# E2E Test Results - ${new Date().toLocaleString()}\n\n`);
  try {
    log('--- Phase 1: Login ---');
    const loginRes = await axios.post(`${BASE_URL}/login`, { phoneNumber: '+2348000000000' });
    const token = loginRes.data.token;
    log(`Token acquired: ${token.substring(0, 20)}...`);

    const headers = { Authorization: `Bearer ${token}` };

    log('\n--- Phase 2: Enrollment ---');
    const randomBVN = Math.floor(10000000000 + Math.random() * 90000000000).toString();
    const enrollRes = await axios.post(`${BASE_URL}/enroll`, {
      bvn: randomBVN,
      fullName: 'John Doe',
      phoneNumber: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
      template: 'minutiae-data-12345',
      bankAccounts: [{ bankCode: '044', accountNumber: '0011223344' }]
    }, { headers });
    log(`Enrollment Success: ${JSON.stringify(enrollRes.data)}`);

    log('\n--- Phase 3: Create Invoice (Public) ---');
    const invoiceRes = await axios.post(`${BASE_URL}/invoice`, {
      sellerId: 'seller-abc',
      amount: 5000
    });
    const sessionToken = invoiceRes.data.token;
    log(`Invoice Token: ${sessionToken}`);

    log('\n--- Phase 4: Biometric Payment ---');
    const payRes = await axios.post(`${BASE_URL}/match-and-pay`, {
      sessionToken,
      capturedTemplate: 'minutiae-data-12345'
    }, { headers });
    log(`Payment Result: ${JSON.stringify(payRes.data, null, 2)}`);

    log('\n--- Phase 5: Transaction History ---');
    const historyRes = await axios.get(`${BASE_URL}/transactions`, { headers });
    log(`Last TXNs count: ${historyRes.data.length}`);

    log('\n--- Phase 6: Failed Biometric Payment (Wrong Template/Expired) ---');
    try {
      await axios.post(`${BASE_URL}/match-and-pay`, {
        sessionToken,
        capturedTemplate: 'wrong-template-6789'
      }, { headers });
    } catch (e) {
      log(`Payment Rejected (Expected): ${e.response?.data?.error}`);
    }

    log('\n✅ **Full E2E Flow Completed Successfully**');

  } catch (error) {
    log(`\n❌ **Test Failed**: ${error.response?.data?.error || error.message}`);
  }
}

runTest();
