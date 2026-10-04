import type {
  MandateSetupResult,
  PaymentInstruction,
  PaymentRail,
  PaymentRailResult,
} from './payment-rail.js';

/**
 * NIBSS adapter boundary.
 *
 * This deliberately contains no invented NIBSS endpoints or credentials.
 * Once BPN receives an approved NIBSS staging specification/access, the
 * transport implementation can be added here without changing the BPN
 * payment orchestration layer.
 */
export class NibssPaymentRail implements PaymentRail {
  readonly name = 'nibss';

  private notConfigured(operation: string): never {
    throw new Error(
      `NIBSS staging integration is not configured for ${operation}. Provide the approved NIBSS staging contract/credentials.`,
    );
  }

  async executeMandatePayment(): Promise<PaymentRailResult> {
    return this.notConfigured('executeMandatePayment');
  }

  async initiateTransfer(): Promise<PaymentRailResult> {
    return this.notConfigured('initiateTransfer');
  }

  async setupMandate(): Promise<MandateSetupResult> {
    return this.notConfigured('setupMandate');
  }

  async getStatus(): Promise<string> {
    return this.notConfigured('getStatus');
  }
}
