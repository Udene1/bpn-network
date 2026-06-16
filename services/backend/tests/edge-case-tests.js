import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const LOG_FILE = '../../docs/e2e_results.md';
let passed = 0;
let failed = 0;

function log(msg) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, msg + '\n');
}

function pass(name) { passed++; log(`✅ ${name}`); }
function fail(name, detail) { failed++; log(`❌ ${name}: ${detail}`); }

async function expect(name, fn) {
  try {
    await fn();
    pass(name);
  } catch (e) {
    fail(name, e.message);
  }
}

async function runEdgeCaseTests() {
  const header = `\n\n${'#'.repeat(50)}\n# EDGE CASE TEST SUITE - ${new Date().toLocaleString()}\n\n`;
  fs.appendFileSync(LOG_FILE, header);

  // ═══════════════════════════════════════════════════
  // ENROLLMENT EDGE CASES
  // ═══════════════════════════════════════════════════
  log('## 1. Enrollment Edge Cases\n');

  await expect('E1: Reject BVN with 10 digits', async () => {
    const res = await axios.post(`${BASE_URL}/enroll`, {
      bvn: '1234567890', fullName: 'Test', phoneNumber: '+234800000', template: 'sig', bankAccounts: []
    }).catch(e => e.response);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await expect('E2: Reject BVN with 12 digits', async () => {
    const res = await axios.post(`${BASE_URL}/enroll`, {
      bvn: '123456789012', fullName: 'Test', phoneNumber: '+234800000', template: 'sig', bankAccounts: []
    }).catch(e => e.response);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await expect('E3: Enroll without bank accounts (should succeed)', async () => {
    const res = await axios.post(`${BASE_URL}/enroll`, {
      bvn: '11111111111', fullName: 'No Bank User', phoneNumber: '+2340000001', template: 'nobank-sig', bankAccounts: []
    });
    if (res.data.status !== 'SUCCESS') throw new Error('Expected SUCCESS');
    if (res.data.redirectUrl) throw new Error('Should NOT have redirectUrl without bank accounts');
  });

  await expect('E4: Enroll with empty biometric template', async () => {
    const res = await axios.post(`${BASE_URL}/enroll`, {
      bvn: '22222222211', fullName: 'Empty Bio', phoneNumber: '+2340000002', template: '', bankAccounts: []
    });
    // Should still succeed (template is encrypted regardless)
    if (res.data.status !== 'SUCCESS') throw new Error('Expected SUCCESS');
  });

  // ═══════════════════════════════════════════════════
  // INVOICE / SESSION EDGE CASES
  // ═══════════════════════════════════════════════════
  log('\n## 2. Invoice & Session Edge Cases\n');

  await expect('I1: Reject zero amount invoice', async () => {
    const res = await axios.post(`${BASE_URL}/invoice`, {
      sellerId: 'S-001', amount: 0
    }).catch(e => e.response);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await expect('I2: Reject negative amount invoice', async () => {
    const res = await axios.post(`${BASE_URL}/invoice`, {
      sellerId: 'S-001', amount: -500
    }).catch(e => e.response);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await expect('I3: Reject invoice without sellerId', async () => {
    const res = await axios.post(`${BASE_URL}/invoice`, {
      amount: 1000
    }).catch(e => e.response);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await expect('I4: Valid invoice returns token + expiry', async () => {
    const res = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-001', amount: 5000 });
    if (!res.data.token) throw new Error('Missing session token');
    if (!res.data.expiresAt) throw new Error('Missing expiry timestamp');
  });

  // ═══════════════════════════════════════════════════
  // PAYMENT / MATCH-AND-PAY EDGE CASES
  // ═══════════════════════════════════════════════════
  log('\n## 3. Payment Edge Cases\n');

  await expect('P1: Reject expired/invalid session token', async () => {
    const res = await axios.post(`${BASE_URL}/match-and-pay`, {
      sessionToken: 'EXPIRED_TOKEN_XYZ', capturedTemplate: 'any'
    }).catch(e => e.response);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  await expect('P2: Reject bad biometric (no match)', async () => {
    const inv = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-001', amount: 100 });
    const res = await axios.post(`${BASE_URL}/match-and-pay`, {
      sessionToken: inv.data.token, capturedTemplate: 'WRONG_BIOMETRIC_DATA'
    }).catch(e => e.response);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await expect('P3: Rate limit after 6 attempts on same session', async () => {
    const inv = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-001', amount: 100 });
    const token = inv.data.token;
    // Send 6 failed attempts
    for (let i = 0; i < 6; i++) {
      await axios.post(`${BASE_URL}/match-and-pay`, {
        sessionToken: token, capturedTemplate: `bad-attempt-${i}`
      }).catch(() => {});
    }
    const res = await axios.post(`${BASE_URL}/match-and-pay`, {
      sessionToken: token, capturedTemplate: 'attempt-7'
    }).catch(e => e.response);
    if (res.status !== 429) throw new Error(`Expected 429 rate limit, got ${res.status}`);
  });

  await expect('P4: Missing capturedTemplate field', async () => {
    const res = await axios.post(`${BASE_URL}/match-and-pay`, {
      sessionToken: 'ANY'
    }).catch(e => e.response);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // ═══════════════════════════════════════════════════
  // REVERSAL EDGE CASES
  // ═══════════════════════════════════════════════════
  log('\n## 4. Reversal Edge Cases\n');

  await expect('R1: Reversal without sessionToken returns 400', async () => {
    const res = await axios.post(`${BASE_URL}/merchant/reverse-transaction`, {
      reason: 'test'
    }).catch(e => e.response);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await expect('R2: Reversal on non-existent session returns 404', async () => {
    const res = await axios.post(`${BASE_URL}/merchant/reverse-transaction`, {
      sessionToken: 'DOES_NOT_EXIST', reason: 'test'
    }).catch(e => e.response);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  await expect('R3: Double reversal is handled gracefully', async () => {
    const inv = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-001', amount: 999 });
    const token = inv.data.token;
    const rev1 = await axios.post(`${BASE_URL}/merchant/reverse-transaction`, { sessionToken: token });
    if (rev1.data.status !== 'VOIDED') throw new Error('First reversal should succeed');
    
    const rev2 = await axios.post(`${BASE_URL}/merchant/reverse-transaction`, { sessionToken: token })
      .catch(e => e.response);
    if (rev2.status !== 404) throw new Error(`Double-reversal should return 404, got ${rev2.status}`);
  });

  // ═══════════════════════════════════════════════════
  // PIN VERIFICATION EDGE CASES
  // ═══════════════════════════════════════════════════
  log('\n## 5. PIN Verification Edge Cases\n');

  await expect('PIN1: Wrong PIN returns 401', async () => {
    const inv = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-001', amount: 100 });
    const res = await axios.post(`${BASE_URL}/verify-pin`, {
      sessionToken: inv.data.token, pin: '9999', phoneNumber: '+2340000001'
    }).catch(e => e.response);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await expect('PIN2: PIN verify on expired session returns 404', async () => {
    const res = await axios.post(`${BASE_URL}/verify-pin`, {
      sessionToken: 'EXPIRED_XYZ', pin: '1234', phoneNumber: '+2340000001'
    }).catch(e => e.response);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  await expect('PIN3: PIN verify with non-existent phone returns 401', async () => {
    const inv = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-001', amount: 100 });
    const res = await axios.post(`${BASE_URL}/verify-pin`, {
      sessionToken: inv.data.token, pin: '1234', phoneNumber: '+234NONEXISTENT'
    }).catch(e => e.response);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // ═══════════════════════════════════════════════════
  // LOOKUP EDGE CASES
  // ═══════════════════════════════════════════════════
  log('\n## 6. Buyer Lookup Edge Cases\n');

  await expect('L1: Lookup without any search params returns 400', async () => {
    const res = await axios.post(`${BASE_URL}/lookup-buyer`, {}).catch(e => e.response);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await expect('L2: Lookup with non-existent phone returns 404', async () => {
    const res = await axios.post(`${BASE_URL}/lookup-buyer`, {
      phoneNumber: '+234GHOST'
    }).catch(e => e.response);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // ═══════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════
  log(`\n## Edge Case Summary: ${passed} passed, ${failed} failed out of ${passed + failed} tests\n`);
}

runEdgeCaseTests();
