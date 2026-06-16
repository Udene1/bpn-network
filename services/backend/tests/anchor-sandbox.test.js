import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3000';
const ANCHOR_SANDBOX_URL = 'https://api.sandbox.getanchor.co/api/v1';
const LOG_FILE = '../../docs/e2e_results.md';
const API_KEY = process.env.ANCHOR_API_KEY || 'anchr_test_placeholder';

function log(msg) {
  console.log(msg);
  fs.appendFileSync(LOG_FILE, `[ANCHOR-SANDBOX] ${msg}\n`);
}

async function runAnchorSandboxTests() {
  const header = `\n\n${'#'.repeat(50)}\n# ANCHOR SANDBOX INTEGRATION TESTS - ${new Date().toLocaleString()}\n\n`;
  fs.appendFileSync(LOG_FILE, header);

  log('--- Step 1: Health Check ---');
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    log(`BPN Backend: ${res.data.status}`);
  } catch (e) {
    log(`BPN Backend: OFFLINE (${e.message})`);
    return;
  }

  log('\n--- Step 2: Simulate Full Payment Lifecycle (BPN Integration) ---');
  
  try {
    const uniqueId = Math.random().toString(36).substring(7).toUpperCase();
    const testPhone = `+23490${Math.floor(Math.random() * 89999999) + 10000000}`;
    const testBvn = `222${Math.floor(Math.random() * 89999999) + 10000000}`;
    const testSig = `SIG_${uniqueId}`;

    // 1. Enroll User
    log(`1. Enrolling user with ID suffix ${uniqueId}...`);
    const enrollRes = await axios.post(`${BASE_URL}/enroll`, {
      bvn: testBvn,
      fullName: `Sandbox Tester ${uniqueId}`,
      phoneNumber: testPhone,
      template: testSig,
      bankAccounts: [{ bankCode: '044', accountNumber: '1234567890' }]
    });
    
    const { userId, redirectUrl } = enrollRes.data;
    log(`   User Enrolled: ${userId}`);
    log(`   Mandate Redirect: ${redirectUrl}`);

    // 2. Create Invoice
    log('2. Creating POS invoice...');
    const invRes = await axios.post(`${BASE_URL}/invoice`, {
      sellerId: 'MERCHANT_SB_01',
      amount: 2500
    });
    const token = invRes.data.token;
    log(`   Invoice Token: ${token}`);

    // 3. Match and Pay (Anchor Mandate Debit Trigger)
    log('3. Triggering payment via biometric match...');
    const payRes = await axios.post(`${BASE_URL}/match-and-pay`, {
      sessionToken: token,
      capturedTemplate: testSig
    });
    
    log(`   Payment Status: ${payRes.data.status}`);
    log(`   Bank Reference: ${payRes.data.reference}`);

    // 4. Simulate Webhook Success
    if (payRes.data.reference) {
        log('4. Simulating Anchor success webhook...');
        const hookRes = await axios.post(`${BASE_URL}/webhook/anchor`, {
            event: 'transfer.updated',
            data: { id: payRes.data.reference, status: 'successful' }
        });
        log(`   Webhook Processed: ${hookRes.data.received}`);
    }

    log('\n--- Step 3: Direct Anchor API Pulse (Sandbox) ---');
    if (API_KEY === 'anchr_test_placeholder') {
        log('⚠️ Skipping direct Anchor API calls (No valid ANCHOR_API_KEY found)');
    } else {
        try {
            const orgRes = await axios.get(`${ANCHOR_SANDBOX_URL}/organization`, {
                headers: { 'x-anchor-key': API_KEY }
            });
            log(`   Connected to Anchor Sandbox: ${orgRes.data.data.attributes.name}`);
        } catch (err) {
            log(`   Anchor Sandbox Connection Failed: ${err.response?.data?.message || err.message}`);
        }
    }

    log('\n✅ **Anchor Sandbox Integration Tests Complete**');

  } catch (e) {
    log(`\n❌ **Lifecycle Test Failed**: ${e.response?.data?.error || e.message}`);
  }
}

runAnchorSandboxTests();
