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
