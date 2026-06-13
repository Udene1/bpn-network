import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  try {
    console.log('--- Phase 1: Login ---');
    const loginRes = await axios.post(`${BASE_URL}/login`, { phoneNumber: '+2348000000000' });
    const token = loginRes.data.token;
    console.log('Token acquired:', token);

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n--- Phase 2: Enrollment ---');
    const enrollRes = await axios.post(`${BASE_URL}/enroll`, {
      bvn: '12345678901',
      fullName: 'John Doe',
      phoneNumber: '+2348000000000',
      template: 'minutiae-data-12345',
      bankAccounts: [{ bankCode: '044', accountNumber: '0011223344' }]
    }, { headers });
    console.log('Enrollment Success:', enrollRes.data);

    console.log('\n--- Phase 3: Create Invoice (Public) ---');
    const invoiceRes = await axios.post(`${BASE_URL}/invoice`, {
      sellerId: 'seller-abc',
      amount: 5000
    });
    const sessionToken = invoiceRes.data.token;
    console.log('Invoice Token:', sessionToken);

    console.log('\n--- Phase 4: Biometric Payment ---');
    const payRes = await axios.post(`${BASE_URL}/match-and-pay`, {
      sessionToken,
      capturedTemplate: 'minutiae-data-12345'
    }, { headers });
    console.log('Payment Result:', payRes.data);

    console.log('\n--- Phase 5: Transaction History ---');
    const historyRes = await axios.get(`${BASE_URL}/transactions`, { headers });
    console.log('Last TXNs count:', historyRes.data.length);

    console.log('\n--- Phase 6: Failed Biometric Payment (Wrong Template) ---');
    try {
      await axios.post(`${BASE_URL}/match-and-pay`, {
        sessionToken,
        capturedTemplate: 'wrong-template-6789'
      }, { headers });
    } catch (e) {
      console.log('Payment Rejected (Expected):', e.response?.data?.error);
    }

  } catch (error) {
    console.error('Test Failed:', error.response?.data || error.message);
  }
}

runTest();
