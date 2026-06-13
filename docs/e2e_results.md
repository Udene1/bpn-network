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
