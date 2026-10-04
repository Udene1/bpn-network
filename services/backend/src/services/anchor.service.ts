import { AnchorPaymentRail } from './anchor-payment-rail.js';

/**
 * Backwards-compatible Anchor facade.
 *
 * New payment flows should use PaymentService so the banking rail remains
 * replaceable. This facade exists for older callers that still reference
 * AnchorService directly.
 */
export class AnchorService {
  private static rail() {
    return new AnchorPaymentRail();
  }

  static async transfer(data: {
    amount: number;
    source_account: string;
    destination_account: string;
    destination_bank_code: string;
    narration: string;
  }) {
    return this.rail().initiateTransfer({
      amount: data.amount,
      sourceAccount: data.source_account,
      sourceBankCode: '',
      destinationAccount: data.destination_account,
      destinationBankCode: data.destination_bank_code,
      narration: data.narration,
    }, `anchor-transfer-${Date.now()}`);
  }
}
