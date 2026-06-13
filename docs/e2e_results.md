# E2E Test Results - 12/6/2026, 9:01:30 pm

--- Phase 1: Login ---
Token acquired: eyJhbGciOiJIUzI1NiIs...

--- Phase 2: Enrollment ---
Enrollment Success: {"status":"SUCCESS","userId":"ca3018c7-ad2a-4a0a-a05c-a78ef20514c8"}

--- Phase 3: Create Invoice (Public) ---
Invoice Token: ZH3KUV

--- Phase 4: Biometric Payment ---
Payment Result: {
  "status": "PENDING",
  "reference": "REF-53AEG9",
  "buyerName": "John Doe",
  "buyerBank": "044",
  "buyerAccount": "0011223344",
  "amount": 5000
}

--- Phase 5: Transaction History ---
Last TXNs count: 2

--- Phase 6: Failed Biometric Payment (Wrong Template/Expired) ---
Payment Rejected (Expected): Session expired or not found

✅ **Full E2E Flow Completed Successfully**
