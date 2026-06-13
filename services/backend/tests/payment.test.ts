import { PaymentService } from '../src/services/payment.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANCHOR_API_KEY = 'test-key';
    process.env.ANCHOR_ENVIRONMENT = 'sandbox';
  });

  it('should initiate a transfer successfully in sandbox', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 201,
      data: {
        status: 'success',
        data: { id: 'transfer-123', reference: 'ref-abc' }
      }
    });

    const result = await PaymentService.initiateTransfer({
      amount: 1000,
      sourceAccount: '111',
      destinationAccount: '222',
      destinationBankCode: '044',
      sourceBankCode: '044',
      narration: 'Test'
    });

    expect(result.status).toBe('PENDING');
    expect(result.id).toBe('transfer-123');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('sandbox-api.getanchor.co'),
      expect.anything(),
      expect.anything()
    );
  });

  it('should handle API errors gracefully', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { data: { message: 'Insufficient funds' } }
    });

    const result = await PaymentService.initiateTransfer({
      amount: 999999,
      sourceAccount: '111',
      destinationAccount: '222',
      destinationBankCode: '044',
      sourceBankCode: '044',
      narration: 'Fail Test'
    });

    expect(result.status).toBe('FAILED');
    expect(result.error).toBe('Insufficient funds');
  });
});
