import axios from 'axios';
import type {
  MandateSetupResult,
  PaymentInstruction,
  PaymentRail,
  PaymentRailResult,
} from './payment-rail.js';

export class AnchorPaymentRail implements PaymentRail {
  readonly name = 'anchor';

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.ANCHOR_API_KEY || '';
    this.baseUrl =
      process.env.ANCHOR_ENVIRONMENT === 'production'
        ? 'https://api.getanchor.co/api/v1'
        : 'https://api.sandbox.getanchor.co/api/v1';
  }

  private headers() {
    return {
      'x-anchor-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async executeMandatePayment(params: {
    mandateId: string;
    amount: number;
    narration: string;
    idempotencyKey: string;
  }): Promise<PaymentRailResult> {
    if (!this.apiKey) {
      throw new Error('ANCHOR_API_KEY is not configured');
    }

    const response = await axios.post(
      `${this.baseUrl}/mandates/${params.mandateId}/debits`,
      {
        amount: params.amount * 100,
        narration: params.narration,
        idempotency_key: params.idempotencyKey,
      },
      { headers: this.headers() },
    );

    return {
      status: response.data.status || 'PENDING',
      reference: response.data.id,
    };
  }

  async initiateTransfer(
    instruction: PaymentInstruction,
    idempotencyKey: string,
  ): Promise<PaymentRailResult> {
    if (!this.apiKey) {
      throw new Error('ANCHOR_API_KEY is not configured');
    }

    const response = await axios.post(
      `${this.baseUrl}/transfers`,
      {
        amount: instruction.amount * 100,
        source_account_id: instruction.sourceAccount,
        beneficiary: {
          account_number: instruction.destinationAccount,
          bank_code: instruction.destinationBankCode,
          account_name: 'BPN Network Merchant',
        },
        narration: instruction.narration || 'BPN Payment',
        idempotency_key: idempotencyKey,
      },
      { headers: this.headers() },
    );

    return {
      status: response.data.status || 'PENDING',
      reference: response.data.id,
    };
  }

  async setupMandate(
    accountNumber: string,
    bankCode: string,
    userReference: string,
  ): Promise<MandateSetupResult> {
    if (!this.apiKey) {
      throw new Error('ANCHOR_API_KEY is not configured');
    }

    const response = await axios.post(
      `${this.baseUrl}/mandates`,
      {
        account_number: accountNumber,
        bank_code: bankCode,
        amount: 50000,
        frequency: 'on_demand',
        metadata: { bpn_id: userReference },
      },
      { headers: this.headers() },
    );

    return {
      mandateId: response.data.id,
      redirectUrl: response.data.authorization_url,
    };
  }

  async getStatus(reference: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ANCHOR_API_KEY is not configured');
    }

    const response = await axios.get(
      `${this.baseUrl}/transfers/${reference}`,
      { headers: this.headers() },
    );

    return response.data.status || 'PENDING';
  }
}
