import Fastify from 'fastify';
import crypto from 'crypto';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { BiometricService } from './services/biometric.service.js';
import { AuditService } from './services/audit.service.js';
import { PaymentService } from './services/payment.service.js';
import { AuthService } from './services/auth.service.js';
import { NotificationService } from './services/notification.service.js';
import { RedisService } from './services/redis.service.js';
import { FraudService } from './services/fraud.service.js';
import { BpnCredentialService } from './services/bpn-credential.service.js';
import { BpnAuthorizationService } from './services/bpn-authorization.service.js';
import { getBpnBiometricProvider } from './services/bpn-biometric-provider.factory.js';

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: true });
const prisma = new PrismaClient();

const MERCHANT_PROTECTED_ROUTES = new Set([
  '/invoice',
  '/payment/challenge',
  '/payment/authorize',
  '/lookup-buyer',
  '/merchant-assisted-enroll',
  '/merchant/reverse-transaction',
  '/verify-pin',
  '/match-and-pay',
]);

function verifyMerchantKey(request: any): boolean {
  const configured = process.env.BPN_MERCHANT_API_KEY;
  const supplied = request.headers['x-bpn-merchant-key'];
  if (!configured || typeof supplied !== 'string') return false;
  const expected = Buffer.from(configured, 'utf8');
  const actual = Buffer.from(supplied, 'utf8');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (request, body, done) {
  (request as any).rawBody = body;
  try {
    done(null, JSON.parse(body as string));
  } catch (error) {
    done(error as Error, undefined);
  }
});

// ─── Rate Limiting & Auth Middleware ──────────────────────────
fastify.addHook('preHandler', async (request, reply) => {
  // Granular Rate Limiting (20 requests/minute per IP)
  const ip = request.ip;
  const route = request.routerPath || 'unknown';
  const key = `ratelimit:${ip}:${route}`;
  
  const reqCount = await RedisService.increment(key, 60);
  if (reqCount > 50) { // Slightly relaxed global per-route limit
    request.log.warn({ ip, route }, 'Rate limit exceeded');
    return reply.status(429).send({ error: 'Too many requests. Please try again later.' });
  }

  if (MERCHANT_PROTECTED_ROUTES.has(request.routerPath)) {
    if (!verifyMerchantKey(request)) {
      return reply.status(401).send({ error: 'Merchant authentication required' });
    }
    return;
  }

  const publicRoutes = ['/login', '/health', '/webhook/anchor', '/enroll', '/mandate/callback'];
  if (publicRoutes.includes(request.routerPath)) return;

  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.status(401).send({ error: 'Missing Authorization Header' });
  }

  const decoded = AuthService.verifyToken(authHeader.replace('Bearer ', ''));
  if (!decoded) {
    request.log.warn({ authHeader }, 'Invalid JWT attempted');
    return reply.status(401).send({ error: 'Invalid or Expired Token' });
  }
  (request as any).user = decoded;
});

// Centralized Error Handler (Sanitized Logging)
fastify.setErrorHandler((error, request, reply) => {
  const { statusCode } = reply;
  
  // Log non-sensitive details
  request.log.error({ 
    err: error.message, 
    code: error.code,
    url: request.url,
    method: request.method
  }, 'Request Error');

  if (statusCode >= 500) {
    return reply.status(500).send({ error: 'Internal Server Error', reference: (request as any).id });
  }
  
  reply.send(error);
});

// ─── GET /health ───────────────────────────────────────────────
// Liveness only: confirms the Fastify process is serving requests.
fastify.get('/health', async () => ({ ok: true, service: 'bpn-backend' }));

// ─── GET /health/db ────────────────────────────────────────────
// Readiness probe that performs a real Prisma query against the configured
// PostgreSQL database. No schema/data is exposed.
fastify.get('/health/db', async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, service: 'bpn-backend', database: 'reachable', orm: 'prisma' };
  } catch (error) {
    request.log.error({ err: error }, 'Database readiness check failed');
    return reply.status(503).send({ ok: false, service: 'bpn-backend', database: 'unreachable', orm: 'prisma' });
  }
});

// ─── POST /login ──────────────────────────────────────────────
fastify.post('/login', async (request) => {
  const { phoneNumber } = request.body as any;
  if (!phoneNumber) return { error: 'phoneNumber is required' };
  const token = AuthService.generateToken({ phoneNumber });
  return { token };
});

// ─── POST /merchant-assisted-enroll ───────────────────────────
// Exceptional enrollment path for buyers who do not have a phone or cannot
// complete self-enrollment. The merchant device captures the real fingerprint;
// the raw image is forwarded only to the configured biometric provider and is
// not persisted by BPN. Bank mandate authorization remains a separate step.
const assistedEnrollSchema = {
  body: {
    type: 'object',
    required: ['bvn', 'fullName', 'bankAccounts', 'capture'],
    properties: {
      bvn: { type: 'string', minLength: 11, maxLength: 11 },
      fullName: { type: 'string', minLength: 2 },
      phoneNumber: { type: 'string' },
      bankAccounts: { type: 'array', minItems: 1 },
      capture: {
        type: 'object',
        required: ['imageBase64'],
        properties: { imageBase64: { type: 'string', minLength: 100 }, imageMime: { type: 'string' } }
      },
      merchantId: { type: 'string' },
      consent: { type: 'boolean' }
    }
  }
};
fastify.post('/merchant-assisted-enroll', { schema: assistedEnrollSchema }, async (request, reply) => {
  const { bvn, fullName, phoneNumber, bankAccounts, capture, merchantId, consent } = request.body as any;
  if (!consent) return reply.status(400).send({ error: 'Explicit biometric enrollment consent is required' });
  if (!bvn || bvn.length !== 11) return reply.status(400).send({ error: 'Invalid BVN (must be 11 digits)' });
  if (!Array.isArray(bankAccounts) || bankAccounts.length === 0) return reply.status(400).send({ error: 'At least one bank account is required' });

  const userId = crypto.randomUUID();
  try {
    const provider = getBpnBiometricProvider();
    const biometric = await provider.enroll({
      userId,
      modality: 'FINGERPRINT',
      capture: { imageBase64: capture.imageBase64, imageMime: capture.imageMime ?? 'image/jpeg' }
    });

    const user = await prisma.user.create({
      data: {
        id: userId,
        bvn,
        fullName,
        phoneNumber: phoneNumber || null,
        enrollmentMethod: 'MERCHANT_ASSISTED',
        accounts: {
          create: bankAccounts.map((acc: any, index: number) => ({
            bankCode: acc.bankCode,
            accountNumber: acc.accountNumber,
            accountName: acc.accountName || fullName,
            isDefault: index === 0,
          }))
        },
        biometricIdentities: {
          create: {
            provider: biometric.provider,
            providerReference: biometric.providerReference,
            modality: biometric.modality,
          }
        }
      },
      include: { accounts: true }
    });

    await AuditService.log({
      action: 'BIOMETRIC_ENROLLMENT_COMPLETED',
      userId: user.id,
      metadata: {
        method: 'MERCHANT_ASSISTED',
        merchantId: merchantId || null,
        provider: biometric.provider,
        providerReference: biometric.providerReference,
        rawCapturePersisted: false,
      },
      request
    });

    const mainAccount = user.accounts[0];
    let redirectUrl: string | undefined;
    if (mainAccount) {
      const mandate = await PaymentService.setupMandate(mainAccount.accountNumber, mainAccount.bankCode);
      await prisma.bankAccount.update({ where: { id: mainAccount.id }, data: { mandateId: mandate.mandateId } });
      redirectUrl = mandate.redirectUrl;
    }

    return {
      status: 'SUCCESS',
      userId: user.id,
      enrollmentMethod: user.enrollmentMethod,
      provider: biometric.provider,
      providerReference: biometric.providerReference,
      mandate: { required: true, redirectUrl },
    };
  } catch (err: any) {
    request.log.error({ err: err.message, userId }, 'Merchant-assisted enrollment failed');
    return reply.status(502).send({ error: 'Merchant-assisted biometric enrollment is unavailable' });
  }
});

// ─── POST /enroll ─────────────────────────────────────────────
const enrollSchema = {
  body: {
    type: 'object',
    required: ['bvn', 'fullName', 'phoneNumber'],
    properties: {
      bvn: { type: 'string', minLength: 11, maxLength: 11 },
      fullName: { type: 'string' },
      phoneNumber: { type: 'string' },
      template: { type: 'string' },
      publicKey: { type: 'string', minLength: 100 },
      bankAccounts: { type: 'array' },
      biometricCapture: { type: 'object', properties: { imageBase64: { type: 'string', minLength: 100 }, imageMime: { type: 'string' } } }
    }
  }
};
fastify.post('/enroll', { schema: enrollSchema }, async (request, reply) => {
  const { bvn, fullName, phoneNumber, template, publicKey, bankAccounts, biometricCapture } = request.body as any;

  if (!bvn || bvn.length !== 11) return reply.status(400).send({ error: 'Invalid BVN (must be 11 digits)' });

  try {
    const encryptedTemplate = template ? BiometricService.encryptTemplate(template) : null;
    const userId = crypto.randomUUID();
    let providerBiometric: any = null;
    if (biometricCapture?.imageBase64) {
      const provider = getBpnBiometricProvider();
      providerBiometric = await provider.enroll({ userId, modality: 'FINGERPRINT', capture: { imageBase64: biometricCapture.imageBase64, imageMime: biometricCapture.imageMime ?? 'image/jpeg' } });
    }

    const user = await prisma.user.create({
      data: {
        id: userId,
        bvn,
        fullName,
        phoneNumber,
        enrollmentMethod: 'PHONE',
        ...(encryptedTemplate ? { biometricTemplate: { create: { templateHash: encryptedTemplate } } } : {}),
        ...(publicKey ? { credentials: { create: { id: BpnCredentialService.generateCredentialId(), publicKey } } } : {}),
        accounts: {
          create: (bankAccounts || []).map((acc: any) => ({
            bankCode: acc.bankCode,
            accountNumber: acc.accountNumber,
            accountName: acc.accountName || fullName,
          })),
        },
        ...(providerBiometric ? { biometricIdentities: { create: { provider: providerBiometric.provider, providerReference: providerBiometric.providerReference, modality: providerBiometric.modality } } } : {}),
      },
      include: { accounts: true },
    });

    // NDPR Consent audit log
    await AuditService.log({
      action: 'NDPR_CONSENT_GRANTED',
      userId: user.id,
      metadata: { method: 'ENROLLMENT_FLOW' },
      request
    });

    // ─── Direct Debit Mandate Setup ───
    let redirectUrl: string | undefined;
    const mainAccount = user.accounts[0];
    if (mainAccount) {
      const mandate = await PaymentService.setupMandate(mainAccount.accountNumber, mainAccount.bankCode);
      
      await prisma.bankAccount.update({
        where: { id: mainAccount.id },
        data: { mandateId: mandate.mandateId }
      });
      redirectUrl = mandate.redirectUrl;
    }

    const credential = await prisma.bpnCredential.findFirst({ where: { userId: user.id, status: 'ACTIVE' }, select: { id: true } });
    return { status: 'SUCCESS', userId: user.id, credentialId: credential?.id, redirectUrl };
  } catch (err: any) {
    request.log.error(err, 'Enrollment failed');
    return reply.status(500).send({ error: 'Enrollment failed. Please try again later.' });
  }
});

/**
 * POST /mandate/callback
 * Webhook called by BaaS when a mandate is authorized by the user.
 */
fastify.post('/mandate/callback', async (request, reply) => {
  const { mandateId, status } = request.body as any;
  
  if (status === 'authorized') {
    await prisma.bankAccount.updateMany({
      where: { mandateId },
      data: { mandateId: `APPROVED-${mandateId}` } // Simplified status tracking
    });
    
    await AuditService.log({
      action: 'MANDATE_AUTHORIZED',
      metadata: { mandateId },
      request
    });
  }

  return { received: true };
});

// ─── POST /invoice ────────────────────────────────────────────
const invoiceSchema = {
  body: {
    type: 'object',
    required: ['sellerId', 'amount'],
    properties: {
      sellerId: { type: 'string' },
      amount: { type: 'number', minimum: 1 }
    }
  }
};
fastify.post('/invoice', { schema: invoiceSchema }, async (request) => {
  const { sellerId, amount } = request.body as any;
  const sessionToken = crypto.randomBytes(6).toString('base64url').toUpperCase();

  // Store transient session in Redis (120s expiry)
  await RedisService.set(`session:${sessionToken}`, { sellerId, amount }, 120);

  return { token: sessionToken, sellerId, amount, expiresAt: new Date(Date.now() + 120 * 1000) };
});

// ─── POST /payment/challenge ──────────────────────────────────
// Creates a payment-specific challenge. The customer authenticator signs this payload
// after local biometric verification; BPN never receives the fingerprint itself.
fastify.post('/payment/challenge', async (request, reply) => {
  const { sessionToken, credentialId, accountId } = request.body as any;
  if (!sessionToken || !credentialId) return reply.status(400).send({ error: 'sessionToken and credentialId are required' });

  const session = await RedisService.get('session:' + sessionToken);
  if (!session) return reply.status(404).send({ error: 'Session expired or not found' });

  const credential = await prisma.bpnCredential.findUnique({ where: { id: credentialId }, include: { user: { include: { accounts: true } } } });
  if (!credential || credential.status !== 'ACTIVE') return reply.status(404).send({ error: 'BPN credential not found or revoked' });

  const selectedAccount = accountId ? credential.user.accounts.find(account => account.id === accountId) : undefined;
  if (accountId && !selectedAccount) return reply.status(400).send({ error: 'Selected bank account is not linked to this credential owner' });
  const challenge = await BpnAuthorizationService.createChallenge(sessionToken, credential.id, session.sellerId, session.amount, selectedAccount?.id);
  const accounts = credential.user.accounts.map(account => ({ id: account.id, bankCode: account.bankCode, accountNumber: `••••${account.accountNumber.slice(-4)}`, accountName: account.accountName, isDefault: account.isDefault }));
  return { status: 'CHALLENGE_CREATED', challenge, accounts };
});

// ─── POST /payment/authorize ─────────────────────────────────
// Accepts a portable BPN authorization proof. The proof, not biometric data,
// is the network primitive used to authorize the payment.
fastify.post('/payment/authorize', async (request, reply) => {
  const proof = request.body as any;
  if (!proof?.sessionToken || !proof?.credentialId || !proof?.sellerId || proof.amount === undefined || !proof?.signature) {
    return reply.status(400).send({ error: 'Incomplete BPN authorization proof' });
  }

  const challenge = await BpnAuthorizationService.getChallenge(proof.sessionToken, proof.credentialId);
  if (!challenge) return reply.status(401).send({ error: 'Invalid, expired, or already-used authorization challenge' });
  if (challenge.sellerId !== proof.sellerId || challenge.amount !== proof.amount || (challenge.accountId || null) !== (proof.accountId || null)) {
    return reply.status(401).send({ error: 'Authorization proof does not match payment challenge' });
  }

  const credential = await prisma.bpnCredential.findUnique({ where: { id: proof.credentialId }, include: { user: { include: { accounts: true } } } });
  if (!credential || credential.status !== 'ACTIVE') return reply.status(401).send({ error: 'BPN credential is not active' });
  if (!BpnCredentialService.verifyAuthorizationProof(credential.publicKey, proof)) {
    return reply.status(401).send({ error: 'BPN authorization proof verification failed' });
  }
  await BpnAuthorizationService.consumeChallenge(proof.sessionToken, proof.credentialId);

  const user = credential.user;
  const fraudResult = await FraudService.performChecks(user.id, user.bvn, challenge.amount);
  if (!fraudResult.safe) return reply.status(403).send({ error: 'Transaction blocked by risk controls' });

  const mainAccount = challenge.accountId ? user.accounts.find((account: any) => account.id === challenge.accountId) : (user.accounts.find((account: any) => account.isDefault) || user.accounts[0]);
  if (!mainAccount || !mainAccount.mandateId) return reply.status(400).send({ error: 'No active direct debit mandate found for this account.' });

  const result = await PaymentService.executeMandatePayment({ amount: challenge.amount, mandateId: mainAccount.mandateId, narration: 'BPN Payment – ' + challenge.sessionToken, idempotencyKey: `bpn-session-${challenge.sessionToken}` });
  const txnStatus = result.status === 'COMPLETED' || result.status === 'successful' ? 'COMPLETED' : result.status === 'FAILED' || result.status === 'failed' ? 'FAILED' : 'PENDING';
  const txn = await prisma.transaction.create({ data: { buyerId: user.id, amount: challenge.amount, sellerId: challenge.sellerId, status: txnStatus, bankReference: result.reference } });
  await AuditService.log({ action: 'BPN_PAYMENT_AUTHORIZED', userId: user.id, entityId: txn.id, metadata: { credentialId: credential.id, amount: challenge.amount, reference: result.reference }, request });
  await RedisService.del('session:' + challenge.sessionToken);

  const maskedProfile = BiometricService.getMaskedBuyerProfile(user);
  return { status: txn.status, reference: txn.bankReference, buyerName: maskedProfile.maskedName, buyerBank: maskedProfile.bankName, amount: challenge.amount, authorization: 'BPN_CREDENTIAL' };
});

// ─── POST /match-and-pay ──────────────────────────────────────
const paySchema = {
  body: {
    type: 'object',
    required: ['sessionToken', 'capturedTemplate'],
    properties: {
      sessionToken: { type: 'string' },
      capturedTemplate: { type: 'string' }
    }
  }
};
fastify.post('/match-and-pay', { schema: paySchema }, async (request, reply) => {
  const { sessionToken, capturedTemplate } = request.body as any;

  // 1. Look up session in Redis
  const session = await RedisService.get(`session:${sessionToken}`);
  if (!session) {
    return reply.status(404).send({ error: 'Session expired or not found' });
  }

  // Per-Session Rate Limiting (5 attempts max)
  const sessionKey = `attemps:${sessionToken}`;
  const attempts = await RedisService.increment(sessionKey, 300); // 5 min window
  if (attempts > 5) {
    request.log.warn({ sessionToken }, 'Brute force suspected on POS Session');
    return reply.status(429).send({ error: 'Too many failed attempts. Session locked.' });
  }

  // 2. Biometric match against all enrolled users
  const allUsers = await prisma.user.findMany({ include: { biometricTemplate: true, accounts: true } });

  let matchedUser: any = null;
  for (const user of allUsers) {
    if (!user.biometricTemplate) continue;
    const { success, score } = await BiometricService.match(capturedTemplate, user.id, user.biometricTemplate.templateHash);
    
    await AuditService.logBiometricMatch({
      userId: user.id,
      success,
      score,
      request
    });

    if (success) { matchedUser = user; break; }
  }

  if (!matchedUser) return reply.status(401).send({ error: 'Biometric match failed' });

  // ─── FRAUD ENGINE CHECK ───
  const fraudResult = await FraudService.performChecks(matchedUser.id, matchedUser.bvn, session.amount);
  if (!fraudResult.safe) {
    await AuditService.log({
      action: 'FRAUD_BLOCK',
      userId: matchedUser.id,
      metadata: { reason: fraudResult.reason },
      request
    });
    return reply.status(403).send({ error: `Transaction Blocked: ${fraudResult.reason}` });
  }

  // 3. Initiate transfer via Anchor Mandate
  const mainAccount = matchedUser.accounts[0];
  if (!mainAccount || !mainAccount.mandateId) {
      return reply.status(400).send({ error: 'No active direct debit mandate found for this account.' });
  }

  const result = await PaymentService.executeMandatePayment({
    amount: session.amount,
    mandateId: mainAccount.mandateId,
    narration: `BPN Biometric Payment – Session ${sessionToken}`,
  });

  // 4. Record the authoritative rail reference and status.
  // Never generate a synthetic bank reference after the rail has already
  // returned its own correlation identifier.
  const txnStatus =
    result.status === 'COMPLETED' || result.status === 'successful'
      ? 'COMPLETED'
      : result.status === 'FAILED' || result.status === 'failed'
        ? 'FAILED'
        : 'PENDING';

  const txn = await prisma.transaction.create({
    data: {
      buyerId: matchedUser.id,
      amount: session.amount,
      sellerId: session.sellerId,
      status: txnStatus,
      bankReference: result.reference,
    },
  });

  request.log.info({
    txnId: txn.id,
    buyerId: matchedUser.id,
    sellerId: session.sellerId,
    amount: session.amount,
    railStatus: result.status,
    bankReference: result.reference,
  }, 'Transaction Authorized');

  // 5. Audit the actual state and clean up the transient session.
  await RedisService.del(`session:${sessionToken}`);
  await AuditService.log({
    action: txnStatus === 'COMPLETED' ? 'TRANSACTION_COMPLETED' : 'TRANSACTION_INITIATED',
    userId: matchedUser.id,
    entityId: txn.id,
    metadata: {
      ref: txn.bankReference,
      amount: session.amount,
      status: txnStatus,
      railStatus: result.status,
    },
    request
  });

  const maskedProfile = BiometricService.getMaskedBuyerProfile(matchedUser);

  return {
    status: txn.status,
    reference: txn.bankReference,
    buyerName: maskedProfile.maskedName,
    buyerBank: maskedProfile.bankName,
    amount: session.amount,
  };
});

/**
 * GET /merchant/lookup-customer/:hash
 * Returns masked profile for customer loyalty checks.
 */
fastify.get('/merchant/lookup-customer/:hash', async (request, reply) => {
  const { hash } = request.params as any;
  const user = await prisma.user.findFirst({
    where: { biometricTemplate: { templateHash: hash } },
    include: { accounts: true }
  });
  if (!user) return reply.status(404).send({ error: 'Customer not found' });
  return BiometricService.getMaskedBuyerProfile(user);
});

/**
 * POST /merchant/reverse-transaction
 * Voids a pending payment session (Automatic Reversal).
 */
fastify.post('/merchant/reverse-transaction', async (request, reply) => {
  try {
    const { sessionToken, reason } = request.body as any;
    if (!sessionToken) return reply.status(400).send({ error: 'Session token is required' });

    const session = await RedisService.get(`session:${sessionToken}`);
    if (!session) {
      // If session is already gone, check if a transaction was created and should be voided
      const pendingTxn = await prisma.transaction.findFirst({
        where: { bankReference: `REF-${sessionToken}`, status: 'PENDING' }
      });
      
      if (!pendingTxn) return reply.status(404).send({ error: 'Active session not found and no pending transaction to reverse.' });
      
      await prisma.transaction.update({
        where: { id: pendingTxn.id },
        data: { status: 'VOIDED' }
      });
      return { status: 'VOIDED', message: 'Stale transaction reached and voided' };
    }

    // Wrap in Prisma transaction for atomicity
    await prisma.$transaction([
      prisma.transaction.updateMany({
        where: { bankReference: `REF-${sessionToken}`, status: { in: ['PENDING'] } },
        data: { status: 'VOIDED' }
      }),
      prisma.auditLog.create({
        data: {
          action: 'TXN_REVERSED',
          entityId: sessionToken,
          metadata: { reason, amount: session.amount, sellerId: session.sellerId },
          ip: request.ip,
          userAgent: request.headers['user-agent']
        }
      })
    ]);

    await RedisService.del(`session:${sessionToken}`);
    return { status: 'VOIDED', reference: `REF-${sessionToken}` };
  } catch (error: any) {
    request.log.error(error, 'Reversal endpoint failed');
    return reply.status(500).send({ error: 'Reversal failed. Please contact support if funds were deducted.' });
  }
});

// ─── POST /webhook/anchor ──────────────────────────────────────
// Anchor signs the exact raw JSON body with the webhook secret using
// HMAC-SHA1 and sends the result as Base64(HMAC-SHA1-hexdigest) in
// x-anchor-signature. See Anchor's webhook verification documentation.
fastify.post('/webhook/anchor', async (request, reply) => {
  const secret = process.env.ANCHOR_WEBHOOK_SECRET || process.env.BPN_ANCHOR_WEBHOOK_SECRET;
  const signature = request.headers['x-anchor-signature'];
  const rawBody = (request as any).rawBody as string | undefined;

  if (!secret || typeof signature !== 'string' || !rawBody) {
    return reply.status(503).send({ error: 'Anchor webhook verification is not configured' });
  }

  const digestHex = crypto.createHmac('sha1', secret).update(rawBody, 'utf8').digest('hex');
  const expected = Buffer.from(digestHex, 'utf8').toString('base64');
  const supplied = Buffer.from(signature, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');

  if (supplied.length !== expectedBytes.length || !crypto.timingSafeEqual(supplied, expectedBytes)) {
    request.log.warn('Rejected Anchor webhook with invalid signature');
    return reply.status(401).send({ error: 'Invalid webhook signature' });
  }

  const body = request.body as any;
  const event = body?.data ?? body;
  const eventId = event?.id;
  const eventType = event?.type;

  if (!eventId || !eventType) {
    return reply.status(400).send({ error: 'Invalid Anchor webhook event' });
  }

  // Anchor can deliver events more than once. Only the first delivery of an
  // event is allowed to mutate transaction state.
  const firstDelivery = await RedisService.setIfAbsent(
    `anchor:webhook:event:${eventId}`,
    { type: eventType, receivedAt: new Date().toISOString() },
    7 * 24 * 60 * 60,
  );
  if (!firstDelivery) return { received: true, duplicate: true };

  const transferId = event?.relationships?.transfer?.data?.id;
  if (!transferId) {
    // Non-transfer events are authenticated and acknowledged but do not alter
    // BPN payment state.
    return { received: true };
  }

  let bpnStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'VOIDED' | null = null;
  if (eventType.endsWith('.initiated')) bpnStatus = 'PENDING';
  else if (eventType.endsWith('.successful')) bpnStatus = 'COMPLETED';
  else if (eventType.endsWith('.failed')) bpnStatus = 'FAILED';
  else if (eventType.endsWith('.reversed')) bpnStatus = 'VOIDED';

  if (!bpnStatus) return { received: true };

  const transaction = await prisma.transaction.findUnique({
    where: { bankReference: transferId },
    include: { buyer: true },
  });

  if (!transaction) {
    request.log.warn({ transferId, eventId, eventType }, 'Anchor webhook reference not found');
    return { received: true };
  }

  // Final states cannot be downgraded by a delayed initiated event.
  const finalStates = new Set(['COMPLETED', 'FAILED', 'VOIDED']);
  if (finalStates.has(transaction.status) && bpnStatus === 'PENDING') {
    return { received: true, status: transaction.status };
  }

  const updated = await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: bpnStatus },
  });

  if (transaction.buyer?.phoneNumber) {
    await NotificationService.sendReceipt({
      phoneNumber: transaction.buyer.phoneNumber,
      amount: updated.amount,
      reference: updated.bankReference || 'N/A',
      status: bpnStatus === 'COMPLETED' ? 'SUCCESS' : 'FAILED',
    });
  }

  request.log.info({ txnId: updated.id, status: bpnStatus, eventId, eventType }, 'Anchor webhook applied');
  return { received: true, status: bpnStatus };
});

// ─── Server Start ─────────────────────────────────────────────
const start = async () => {
  try {
    await RedisService.init();
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('BPN Backend running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
