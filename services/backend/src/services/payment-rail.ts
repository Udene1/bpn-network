export type PaymentRailStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface PaymentRailResult {
  status: PaymentRailStatus | string;
  reference: string;
}

export interface MandateSetupResult {
  mandateId: string;
  redirectUrl?: string;
}

export interface PaymentInstruction {
  amount: number;
  sourceAccount: string;
  sourceBankCode: string;
  destinationAccount: string;
  destinationBankCode: string;
  narration: string;
}

export interface PaymentRail {
  readonly name: string;

  executeMandatePayment(params: {
    mandateId: string;
    amount: number;
    narration: string;
    idempotencyKey: string;
  }): Promise<PaymentRailResult>;

  initiateTransfer(instruction: PaymentInstruction, idempotencyKey: string): Promise<PaymentRailResult>;

  setupMandate(accountNumber: string, bankCode: string, userReference: string): Promise<MandateSetupResult>;

  getStatus(reference: string): Promise<string>;
}
