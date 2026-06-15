export class NotificationService {
  /**
   * Sends a transaction receipt via SMS or Push.
   * Integration point: Termii, Twilio, or Firebase.
   */
  static async sendReceipt(params: {
    phoneNumber: string;
    amount: number;
    reference: string;
    status: 'SUCCESS' | 'FAILED';
  }) {
    const message = params.status === 'SUCCESS' 
      ? `BPN Receipt: Paid ₦${params.amount}. Ref: ${params.reference}. Thank you for using BPN!`
      : `BPN Alert: Payment of ₦${params.amount} failed. Ref: ${params.reference}. Please try again.`;

    console.log(`[NOTIFICATION] Sending to ${params.phoneNumber}: ${message}`);
    
    // TERMII INTEGRATION EXAMPLE
    /*
    await axios.post('https://api.ng.termii.com/api/sms/send', {
      to: params.phoneNumber,
      from: "BPN-PAY",
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: process.env.TERMII_API_KEY
    });
    */
    
    return true;
  }
}
