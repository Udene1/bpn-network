import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testRecovery() {
  console.log('--- Phase 0: Login ---');
  const loginRes = await axios.post(`${BASE_URL}/login`, { phoneNumber: '+2348000000000' });
  const token = loginRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  console.log('\n--- Phase 1: Lookup Buyer (Manual Fallback) ---');
  try {
    const lookupRes = await axios.post(`${BASE_URL}/lookup-buyer`, { phoneNumber: '+2348000000000' }, { headers });
    console.log('Lookup Success:', JSON.stringify(lookupRes.data, null, 2));

    console.log('\n--- Phase 2: Create Session ---');
    const invoiceRes = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-777', amount: 3500 });
    const sessionToken = invoiceRes.data.token;
    console.log('Invoice Token:', sessionToken);

    console.log('\n--- Phase 3: Verify PIN (Authorizing fallback txn) ---');
    // Note: In real test, we would have enrolled a user with a PIN. 
    // For now, we mock the PIN check logic in the backend.
    const pinRes = await axios.post(`${BASE_URL}/verify-pin`, {
      sessionToken,
      phoneNumber: '+2348000000000',
      pin: '1234' 
    }, { headers });
    console.log('Payment Result:', JSON.stringify(pinRes.data, null, 2));

  } catch (e) {
    console.error('Error:', e.response?.data?.error || e.message);
  }
}

testRecovery();
