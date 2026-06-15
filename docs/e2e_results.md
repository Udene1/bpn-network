# E2E Test Results - 12/6/2026, 10:18:36 pm

--- Phase 1: Login ---
Token acquired: eyJhbGciOiJIUzI1NiIs...

--- Phase 2: Enrollment ---
Enrollment Success: {"status":"SUCCESS","userId":"cf87ce11-79c9-4370-8043-a61a433798ea"}

--- Phase 3: Create Invoice (Public) ---
Invoice Token: 1MTBWN

--- Phase 4: Biometric Payment ---
Payment Result: {
  "status": "PENDING",
  "reference": "REF-PDJ4C",
  "buyerName": "John Doe",
  "buyerBank": "044",
  "buyerAccount": "0011223344",
  "amount": 5000
}

--- Phase 5: Transaction History ---
Last TXNs count: 5

--- Phase 6: Failed Biometric Payment (Wrong Template/Expired) ---
Payment Rejected (Expected): Session expired or not found

--- Phase 7: Merchant Dashboard APIs ---
Merchant Stats: {"totalVolume":25000,"activeUsers":6,"successRate":"98.5%","lastUpdate":"2026-06-13T02:18:37.491Z"}
Merchant Transactions Count: 5

✅ **Full E2E Flow Completed Successfully**


========================================
# E2E Test Run - 12/6/2026, 10:21:11 pm

--- Phase 1: Login ---
Token acquired: eyJhbGciOiJIUzI1NiIs...

--- Phase 2: Enrollment ---
Enrollment Success: {"status":"SUCCESS","userId":"66eb4719-1373-4707-9baf-2fbd9c39a5a1"}

--- Phase 3: Create Invoice (Public) ---
Invoice Token: 90GJAT

--- Phase 4: Biometric Payment ---
Payment Result: {
  "status": "PENDING",
  "reference": "REF-RNJR59",
  "buyerName": "John Doe",
  "buyerBank": "044",
  "buyerAccount": "0011223344",
  "amount": 5000
}

--- Phase 5: Transaction History ---
Last TXNs count: 6

--- Phase 6: Failed Biometric Payment (Wrong Template/Expired) ---
Payment Rejected (Expected): Session expired or not found

--- Phase 7: Merchant Dashboard APIs ---
Merchant Stats: {"totalVolume":30000,"activeUsers":7,"successRate":"98.5%","lastUpdate":"2026-06-13T02:21:12.414Z"}
Merchant Transactions Count: 6

✅ **Full E2E Flow Completed Successfully**


========================================
# E2E Test Run - 12/6/2026, 10:21:13 pm

--- Phase 1: Login ---
Token acquired: eyJhbGciOiJIUzI1NiIs...

--- Phase 2: Enrollment ---
Enrollment Success: {"status":"SUCCESS","userId":"663525cf-5aa3-440f-ab50-fd5d9d6cbebb"}

--- Phase 3: Create Invoice (Public) ---
Invoice Token: BLCKDX

--- Phase 4: Biometric Payment ---
Payment Result: {
  "status": "PENDING",
  "reference": "REF-C5I5YG",
  "buyerName": "John Doe",
  "buyerBank": "044",
  "buyerAccount": "0011223344",
  "amount": 5000
}

--- Phase 5: Transaction History ---
Last TXNs count: 7

--- Phase 6: Failed Biometric Payment (Wrong Template/Expired) ---
Payment Rejected (Expected): Session expired or not found

--- Phase 7: Merchant Dashboard APIs ---
Merchant Stats: {"totalVolume":35000,"activeUsers":8,"successRate":"98.5%","lastUpdate":"2026-06-13T02:21:14.395Z"}
Merchant Transactions Count: 7

✅ **Full E2E Flow Completed Successfully**


========================================
# E2E Test Run - 13/6/2026, 11:32:59 pm

--- Phase 1: Login ---
Token acquired: eyJhbGciOiJIUzI1NiIs...

--- Phase 2: Enrollment ---
Enrollment Success: {"status":"SUCCESS","userId":"1840e9ea-6d4b-4aa3-9e22-cad009d0497a"}

--- Phase 3: Create Invoice (Public) ---
Invoice Token: NIHKOU

--- Phase 4: Biometric Payment ---
Payment Result: {
  "status": "PENDING",
  "reference": "REF-USF9L",
  "buyerName": "John ••••",
  "buyerBank": "Access Bank",
  "amount": 5000
}

--- Phase 5: Transaction History ---
Last TXNs count: 8

--- Phase 6: Failed Biometric Payment (Wrong Template/Expired) ---
Payment Rejected (Expected): Session expired or not found

--- Phase 7: Merchant Dashboard APIs ---
Merchant Stats: {"totalVolume":40000,"activeUsers":9,"successRate":"98.5%","lastUpdate":"2026-06-14T03:33:04.445Z"}
Merchant Transactions Count: 8

✅ **Full E2E Flow Completed Successfully**


========================================
# Recovery Flow Test - 13/6/2026, 11:45:14 pm

--- Phase 0: Login ---

--- Phase 1: Lookup Buyer (Manual Fallback) ---
Lookup Success: {
  "status": "SUCCESS",
  "buyer": {
    "maskedName": "John ••••",
    "bankName": "Access Bank",
    "status": "VERIFIED"
  }
}

--- Phase 2: Create Session ---
Invoice Token: PKOKRQ

--- Phase 3: Verify PIN (Authorizing fallback txn) ---
Payment Result: {
  "status": "COMPLETED",
  "reference": "REFP-TMLJ1"
}

✅ **Recovery Flow Test Completed Successfully**


========================================
# Merchant Dashboard Enhancement Test - 14/6/2026, 12:06:04 am

--- Phase 1: Dashboard Stats (with Chart Data) ---
Stats Result: {
  "totalVolume": 0,
  "activeUsers": 9,
  "successRate": "98.5%",
  "chartData": [
    {
      "date": "2026-06-08",
      "volume": 4092
    },
    {
      "date": "2026-06-09",
      "volume": 227
    },
    {
      "date": "2026-06-10",
      "volume": 2925
    },
    {
      "date": "2026-06-11",
      "volume": 1310
    },
    {
      "date": "2026-06-12",
      "volume": 541
    },
    {
      "date": "2026-06-13",
      "volume": 2360
    },
    {
      "date": "2026-06-14",
      "volume": 1937
    }
  ],
  "lastUpdate": "2026-06-14T04:06:04.780Z"
}
✅ Chart data correctly aggregated for 7 days.

--- Phase 2: Transaction Filtering ---
Filtered Count: 0
✅ Filtering by status works.

--- Phase 3: Customer Lookup by Hash ---

❌ **Dashboard Test Failed**: Customer not found


========================================
# Merchant Dashboard Enhancement Test - 14/6/2026, 12:10:23 am

--- Phase 1: Dashboard Stats (with Chart Data) ---
Stats Result: {
  "totalVolume": 0,
  "activeUsers": 9,
  "successRate": "98.5%",
  "chartData": [
    {
      "date": "2026-06-08",
      "volume": 798
    },
    {
      "date": "2026-06-09",
      "volume": 4639
    },
    {
      "date": "2026-06-10",
      "volume": 2169
    },
    {
      "date": "2026-06-11",
      "volume": 1461
    },
    {
      "date": "2026-06-12",
      "volume": 4587
    },
    {
      "date": "2026-06-13",
      "volume": 4030
    },
    {
      "date": "2026-06-14",
      "volume": 2758
    }
  ],
  "lastUpdate": "2026-06-14T04:10:24.283Z"
}
✅ Chart data correctly aggregated for 7 days.

--- Phase 2: Transaction Filtering ---
Filtered Count: 0
✅ Filtering by status works.

--- Phase 3: Customer Lookup by Hash ---
Lookup Success: {
  "maskedName": "John ••••",
  "bankName": "Access Bank",
  "status": "VERIFIED"
}
✅ Customer lookup returns masked profile.

✅ **Merchant Dashboard Verification Completed Successfully**


========================================
# Compliance & Audit Verification - 14/6/2026, 12:22:03 am

--- Phase 1: Verify Audit Logs ---
Total Audit Records: 17
✅ Audit logs are capturing events.

--- Phase 2: Transaction Reversal (VOID Flow) ---
Session Created: 4B3PX4

❌ **Compliance Test Failed**: Session not found


========================================
# Compliance & Audit Verification - 14/6/2026, 12:22:27 am

--- Phase 1: Verify Audit Logs ---
Total Audit Records: 17
✅ Audit logs are capturing events.

--- Phase 2: Transaction Reversal (VOID Flow) ---
Session Created: TK2A89

❌ **Compliance Test Failed**: Internal Server Error


========================================
# Compliance & Audit Verification - 14/6/2026, 12:22:54 am



========================================
# Compliance & Audit Verification - 14/6/2026, 12:25:57 am

--- Phase 1: Verify Audit Logs ---
Total Audit Records: 18
✅ Audit logs are capturing events.

--- Phase 2: Transaction Reversal (VOID Flow) ---
Session Created: 950E1F

❌ **Compliance Test Failed**: Internal Server Error


========================================
# Compliance & Audit Verification - 14/6/2026, 12:30:29 am

--- Phase 1: Verify Audit Logs ---
Total Audit Records: 19
✅ Audit logs are capturing events.

--- Phase 2: Transaction Reversal (VOID Flow) ---
Session Created: AHH2TO

❌ **Compliance Test Failed**: Internal Server Error


========================================
# Compliance & Audit Verification - 14/6/2026, 12:30:56 am

--- Phase 1: Verify Audit Logs ---
Total Audit Records: 20
✅ Audit logs are capturing events.

--- Phase 2: Transaction Reversal (VOID Flow) ---
Session Created: LWLXTT
Reversal Result: {
  "status": "VOIDED",
  "reference": "REF-LWLXTT"
}
✅ Transaction reversal/voiding works.
✅ Reversal event recorded in Audit Log.

✅ **Compliance & Audit Verification Completed**


========================================
# Direct Debit Mandate Flow Verification - 14/6/2026, 12:48:00 am

--- Phase 1: Enrollment with Mandate Trigger ---

❌ **Mandate Flow Test Failed**: Missing Authorization Header


========================================
# Direct Debit Mandate Flow Verification - 14/6/2026, 12:48:14 am

--- Phase 1: Enrollment with Mandate Trigger ---

❌ **Mandate Flow Test Failed**: 


========================================
# Direct Debit Mandate Flow Verification - 14/6/2026, 12:48:49 am

--- Phase 1: Enrollment with Mandate Trigger ---
Enrollment Response: {
  "status": "SUCCESS",
  "userId": "4391becf-085c-4b0a-b606-be85dd70bbd7",
  "redirectUrl": "https://sandbox.getanchor.co/authorize-mandate?ref=bpn-test"
}
✅ Enrollment correctly returned Mandate Redirect URL.

--- Phase 2: Mandate Callback (Webhook) ---
Callback Response: {
  "received": true
}
✅ Mandate callback endpoint is active.

✅ **Mandate Flow Verification Completed Successfully**


##################################################
# FINAL HARDENING & PAYMENT AUDIT - 15/6/2026, 7:52:49 pm

--- Test 1: PII Masking Audit ---

❌ **Audit Failed**: Missing Authorization Header


##################################################
# FINAL HARDENING & PAYMENT AUDIT - 15/6/2026, 7:53:05 pm

--- Test 1: PII Masking Audit ---

❌ **Audit Failed**: Buyer not found


##################################################
# FINAL HARDENING & PAYMENT AUDIT - 15/6/2026, 7:53:31 pm

--- Phase 0: Setup (Public Enrollment) ---
--- Test 1: PII Masking Audit ---
✅ PII Masking: Verified. Only maskedName and bankName returned.

--- Test 2: Stable Reversal Logic ---
Reversal 1: VOIDED
Reversal 2 (Duplicate): Correctly rejected with 404/Error: Active session not found and no pending transaction to reverse.

--- Test 3: Mandate Payment Strategy Pulse ---

❌ **Audit Failed**: Session expired or not found
