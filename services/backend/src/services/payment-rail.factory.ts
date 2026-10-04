import type { PaymentRail } from './payment-rail.js';
import { AnchorPaymentRail } from './anchor-payment-rail.js';
import { NibssPaymentRail } from './nibss-payment-rail.js';

export function getPaymentRail(): PaymentRail {
  const rail = (process.env.BPN_PAYMENT_RAIL || 'anchor').toLowerCase();

  switch (rail) {
    case 'anchor':
      return new AnchorPaymentRail();
    case 'nibss':
      return new NibssPaymentRail();
    default:
      throw new Error(
        `Unsupported BPN_PAYMENT_RAIL "${rail}". Expected "anchor" or "nibss".`,
      );
  }
}
