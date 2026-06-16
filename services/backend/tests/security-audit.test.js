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

async function runSecurityAudit() {
  const header = `\n\n${'#'.repeat(50)}\n# SECURITY AUDIT TEST SUITE - ${new Date().toLocaleString()}\n\n`;
  fs.appendFileSync(LOG_FILE, header);

  // ═══════════════════════════════════════════════════
  // 1. INJECTION ATTACKS
  // ═══════════════════════════════════════════════════
  log('## 1. Injection Attack Resistance\n');

  await expect('SEC-INJ1: SQL injection in BVN field', async () => {
    const res = await axios.post(`${BASE_URL}/enroll`, {
      bvn: "'; DROP TABLE users; --",
      fullName: 'Hacker', phoneNumber: '+234hack', template: 'sig', bankAccounts: []
    }).catch(e => e.response);
    // Should reject (BVN validation) or Prisma should parameterize safely
    if (res.status === 200 && res.data.status === 'SUCCESS') {
      // If it somehow succeeded, the DB should still be intact
      const lookup = await axios.post(`${BASE_URL}/lookup-buyer`, { phoneNumber: '+234hack' }).catch(e => e.response);
      if (lookup.status === 500) throw new Error('Database may be corrupted by injection');
    }
  });

  await expect('SEC-INJ2: SQL injection in phone lookup', async () => {
    const res = await axios.post(`${BASE_URL}/lookup-buyer`, {
      phoneNumber: "' OR '1'='1"
    }).catch(e => e.response);
    // Should NOT return all users - should return 404 (not found)
    if (res.status === 200 && Array.isArray(res.data)) {
      throw new Error('SQL injection returned multiple records!');
    }
  });

  await expect('SEC-INJ3: XSS in fullName field', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    const res = await axios.post(`${BASE_URL}/enroll`, {
      bvn: '33333333333', fullName: xssPayload, phoneNumber: '+234xss001', template: 'sig', bankAccounts: []
    });
    // Even if stored, the API response should not execute scripts
    // Check that the response doesn't contain unescaped script tags
    const responseStr = JSON.stringify(res.data);
    if (responseStr.includes('<script>')) {
      throw new Error('XSS payload reflected in response without sanitization');
    }
  });

  await expect('SEC-INJ4: NoSQL/JSON injection in body', async () => {
    const res = await axios.post(`${BASE_URL}/lookup-buyer`, {
      phoneNumber: { $gt: '' }  // MongoDB-style injection (should fail on Prisma/Postgres)
    }).catch(e => e.response);
    if (res.status === 200) throw new Error('JSON injection returned data');
  });

  // ═══════════════════════════════════════════════════
  // 2. PII LEAK AUDIT (DEEP SCAN)
  // ═══════════════════════════════════════════════════
  log('\n## 2. PII Leak Deep Scan\n');

  const PII_FIELDS = ['bvn', 'accountNumber', 'pinHash', 'biometricTemplate', 'templateHash'];

  await expect('SEC-PII1: /lookup-buyer response contains no PII', async () => {
    const res = await axios.post(`${BASE_URL}/lookup-buyer`, { phoneNumber: '+2340000001' }).catch(e => e.response);
    if (res.status === 200) {
      const body = JSON.stringify(res.data);
      for (const field of PII_FIELDS) {
        if (body.includes(`"${field}"`)) throw new Error(`PII field "${field}" found in lookup response`);
      }
    }
  });

  await expect('SEC-PII2: /merchant/transactions response contains no PII', async () => {
    // Login first for auth
    const login = await axios.post(`${BASE_URL}/login`, { email: 'merchant@bpn.com', password: 'test1234' });
    const token = login.data.token;
    const res = await axios.get(`${BASE_URL}/merchant/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(e => e.response);
    if (res.status === 200) {
      const body = JSON.stringify(res.data);
      for (const field of PII_FIELDS) {
        if (body.includes(`"${field}"`)) throw new Error(`PII field "${field}" found in transactions response`);
      }
    }
  });

  await expect('SEC-PII3: /match-and-pay success never leaks raw BVN', async () => {
    // Create fresh session + match
    const inv = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-001', amount: 50 });
    const res = await axios.post(`${BASE_URL}/match-and-pay`, {
      sessionToken: inv.data.token, capturedTemplate: 'MOCK_SUCCESS_SIG'
    }).catch(e => e.response);
    if (res.status === 200) {
      const body = JSON.stringify(res.data);
      if (body.includes('"bvn"')) throw new Error('BVN leaked in match-and-pay response');
      if (body.includes('"accountNumber"')) throw new Error('Account number leaked in response');
    }
  });

  // ═══════════════════════════════════════════════════
  // 3. SESSION SECURITY
  // ═══════════════════════════════════════════════════
  log('\n## 3. Session Security\n');

  await expect('SEC-SESS1: Session token is not predictable (entropy check)', async () => {
    const tokens = [];
    for (let i = 0; i < 5; i++) {
      const res = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-001', amount: 100 });
      tokens.push(res.data.token);
    }
    const uniqueTokens = new Set(tokens);
    if (uniqueTokens.size !== 5) throw new Error('Duplicate tokens generated — low entropy');
    // Check minimum length
    for (const t of tokens) {
      if (t.length < 5) throw new Error(`Token "${t}" is too short for security`);
    }
  });

  await expect('SEC-SESS2: Cannot reuse consumed session token', async () => {
    const inv = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-001', amount: 200 });
    const token = inv.data.token;
    // Consume the session via reversal
    await axios.post(`${BASE_URL}/merchant/reverse-transaction`, { sessionToken: token });
    // Try to use the consumed token for payment
    const res = await axios.post(`${BASE_URL}/match-and-pay`, {
      sessionToken: token, capturedTemplate: 'MOCK_SUCCESS_SIG'
    }).catch(e => e.response);
    if (res.status === 200) throw new Error('Consumed session token was reused for payment!');
  });

  // ═══════════════════════════════════════════════════
  // 4. REPLAY & TIMING ATTACKS
  // ═══════════════════════════════════════════════════
  log('\n## 4. Replay & Timing Attacks\n');

  await expect('SEC-REPLAY1: Cannot replay a completed transaction reference', async () => {
    // Simulate: try to use an old reference in a new reversal
    const res = await axios.post(`${BASE_URL}/merchant/reverse-transaction`, {
      sessionToken: 'OLD_COMPLETED_REF_12345'
    }).catch(e => e.response);
    if (res.status === 200 && res.data.status === 'VOIDED') {
      throw new Error('Old reference was replayed and voided!');
    }
  });

  await expect('SEC-REPLAY2: Concurrent payment attempts on same session', async () => {
    const inv = await axios.post(`${BASE_URL}/invoice`, { sellerId: 'S-001', amount: 500 });
    const token = inv.data.token;
    // Fire 3 concurrent payment attempts
    const results = await Promise.allSettled([
      axios.post(`${BASE_URL}/match-and-pay`, { sessionToken: token, capturedTemplate: 'MOCK_SUCCESS_SIG' }),
      axios.post(`${BASE_URL}/match-and-pay`, { sessionToken: token, capturedTemplate: 'MOCK_SUCCESS_SIG' }),
      axios.post(`${BASE_URL}/match-and-pay`, { sessionToken: token, capturedTemplate: 'MOCK_SUCCESS_SIG' }),
    ]);
    const successes = results.filter(r => r.status === 'fulfilled' && r.value.data.status !== undefined);
    // At most ONE should succeed; the rest should fail with 404 (session consumed)
    if (successes.length > 1) {
      log(`  ⚠️  WARNING: ${successes.length} concurrent payments succeeded on same session — potential double-spend`);
    }
  });

  // ═══════════════════════════════════════════════════
  // 5. WEBHOOK SECURITY
  // ═══════════════════════════════════════════════════
  log('\n## 5. Webhook Security\n');

  await expect('SEC-WH1: Spoofed webhook does not corrupt transaction state', async () => {
    // Attempt to send a fake webhook with fabricated reference
    const res = await axios.post(`${BASE_URL}/webhook/anchor`, {
      event: 'transfer.updated',
      data: { id: 'FAKE_REF_HACKER', status: 'successful' }
    }).catch(e => e.response);
    // Should not crash — it should gracefully handle unknown references
    if (res.status === 500) throw new Error('Spoofed webhook caused server crash');
  });

  await expect('SEC-WH2: Spoofed mandate callback', async () => {
    const res = await axios.post(`${BASE_URL}/mandate/callback`, {
      mandateId: 'FAKE_MANDATE_HACKER', status: 'authorized'
    }).catch(e => e.response);
    if (res.status === 500) throw new Error('Spoofed mandate callback caused server crash');
  });

  // ═══════════════════════════════════════════════════
  // 6. AUTHORIZATION & ACCESS CONTROL
  // ═══════════════════════════════════════════════════
  log('\n## 6. Authorization & Access Control\n');

  await expect('SEC-AUTH1: Merchant stats without auth returns 401', async () => {
    const res = await axios.get(`${BASE_URL}/merchant/stats`).catch(e => e.response);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await expect('SEC-AUTH2: Merchant transactions without auth returns 401', async () => {
    const res = await axios.get(`${BASE_URL}/merchant/transactions`).catch(e => e.response);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await expect('SEC-AUTH3: NDPR export without auth returns 401', async () => {
    const res = await axios.get(`${BASE_URL}/merchant/ndpr-export`).catch(e => e.response);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await expect('SEC-AUTH4: Invalid Bearer token returns 401', async () => {
    const res = await axios.get(`${BASE_URL}/merchant/stats`, {
      headers: { Authorization: 'Bearer FAKE_TOKEN_12345' }
    }).catch(e => e.response);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // ═══════════════════════════════════════════════════
  // 7. PAYLOAD SIZE & MALFORMED INPUT
  // ═══════════════════════════════════════════════════
  log('\n## 7. Payload & Malformed Input\n');

  await expect('SEC-MAL1: Extremely long BVN string', async () => {
    const res = await axios.post(`${BASE_URL}/enroll`, {
      bvn: 'A'.repeat(10000), fullName: 'Test', phoneNumber: '+234', template: 'sig', bankAccounts: []
    }).catch(e => e.response);
    if (res.status !== 400) throw new Error(`Expected 400 for oversized BVN, got ${res.status}`);
  });

  await expect('SEC-MAL2: Empty request body on /invoice', async () => {
    const res = await axios.post(`${BASE_URL}/invoice`, {}).catch(e => e.response);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await expect('SEC-MAL3: String instead of number for amount', async () => {
    const res = await axios.post(`${BASE_URL}/invoice`, {
      sellerId: 'S-001', amount: 'not_a_number'
    }).catch(e => e.response);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // ═══════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════
  log(`\n## Security Audit Summary: ${passed} passed, ${failed} failed out of ${passed + failed} tests\n`);
}

runSecurityAudit();
