import { getPaymentRail } from './payment-rail.factory.js';
import type { PaymentInstruction } from './payment-rail.js';

/**
 * PaymentService is the BPN payment orchestration boundary.
 *
 * It deliberately does not know whether the underlying banking rail is
 * Anchor, NIBSS, or a future provider. Select the rail with BPN_PAYMENT_RAIL.
 */
export class PaymentService {
  private static rail() {
    return getPaymentRail();
  }

  static async executeMandatePayment(params: {
    mandateId: string;
    amount: number;
    narration: string;
    idempotencyKey?: string;
  }): Promise<{ status: string; reference: string }> {
    const idempotencyKey =
      params.idempotencyKey ||
      `bpn-debit-${params.mandateId}-${params.amount}-${Date.now()}`;

    return this.rail().executeMandatePayment({
      mandateId: params.mandateId,
      amount: params.amount,
      narration: params.narration,
      idempotencyKey,
    });
  }

  static async initiateTransfer(
    instruction: PaymentInstruction,
    idempotencyKey?: string,
  ): Promise<{ status: string; reference: string }> {
    const key =
      idempotencyKey ||
      `bpn-transfer-${instruction.sourceAccount}-${instruction.destinationAccount}-${instruction.amount}-${Date.now()}`;

    return this.rail().initiateTransfer(instruction, key);
  }

  static async setupMandate(
    accountNumber: string,
    bankCode: string,
    userReference = 'internal_user_ref',
  ): Promise<{ mandateId: string; redirectUrl?: string }> {
    return this.rail().setupMandate(accountNumber, bankCode, userReference);
  }

  static async getStatus(reference: string): Promise<string> {
    return this.rail().getStatus(reference);
  }
}
