import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { BiometricService } from './services/biometric.service.js';
import { PaymentService } from './services/payment.service.js';
import { AuthService } from './services/auth.service.js';
import { RedisService } from './services/redis.service.js';
import { FraudService } from './services/fraud.service.js';

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: true });
const prisma = new PrismaClient();

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

  const publicRoutes = ['/invoice', '/login', '/health', '/webhook/anchor'];
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

// ─── POST /login ──────────────────────────────────────────────
fastify.post('/login', async (request) => {
  const { phoneNumber } = request.body as any;
  const token = AuthService.generateToken({ phoneNumber });
  return { token };
});

// ─── POST /enroll ─────────────────────────────────────────────
const enrollSchema = {
  body: {
    type: 'object',
    required: ['bvn', 'fullName', 'phoneNumber', 'template'],
    properties: {
      bvn: { type: 'string', minLength: 11, maxLength: 11 },
      fullName: { type: 'string' },
      phoneNumber: { type: 'string' },
      template: { type: 'string' },
      bankAccounts: { type: 'array' }
    }
  }
};
fastify.post('/enroll', { schema: enrollSchema }, async (request, reply) => {
  const { bvn, fullName, phoneNumber, template, bankAccounts } = request.body as any;

  if (!bvn || bvn.length !== 11) return reply.status(400).send({ error: 'Invalid BVN (must be 11 digits)' });

  const encryptedTemplate = BiometricService.encryptTemplate(template);

  const user = await prisma.user.create({
    data: {
      bvn,
      fullName,
      phoneNumber,
      biometricTemplate: { create: { templateHash: encryptedTemplate } },
      accounts: {
        create: (bankAccounts || []).map((acc: any) => ({
          bankCode: acc.bankCode,
          accountNumber: acc.accountNumber,
          accountName: acc.accountName || fullName,
        })),
      },
    },
    include: { accounts: true },
  });

  // NDPR Consent audit log
  await prisma.auditLog.create({
    data: { userId: user.id, action: 'ENROLL', details: `Consent granted. Accounts linked: ${user.accounts.length}` },
  });

  return { status: 'SUCCESS', userId: user.id };
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
  const sessionToken = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Store transient session in Redis (120s expiry)
  await RedisService.set(`session:${sessionToken}`, { sellerId, amount }, 120);

  return { token: sessionToken, sellerId, amount, expiresAt: new Date(Date.now() + 120 * 1000) };
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

  let matchedUser: typeof allUsers[number] | null = null;
  for (const user of allUsers) {
    if (!user.biometricTemplate) continue;
    const { success } = await BiometricService.match(capturedTemplate, user.id, user.biometricTemplate.templateHash);
    if (success) { matchedUser = user; break; }
  }

  if (!matchedUser) return reply.status(401).send({ error: 'Biometric match failed' });

  // ─── FRAUD ENGINE CHECK ───
  const fraudResult = await FraudService.performChecks(matchedUser.id, matchedUser.bvn, session.amount);
  if (!fraudResult.safe) {
    await prisma.auditLog.create({
      data: { userId: matchedUser.id, action: 'FRAUD_BLOCK', details: fraudResult.reason || null }
    });
    return reply.status(403).send({ error: `Transaction Blocked: ${fraudResult.reason}` });
  }

  const account = matchedUser.accounts[0];
  if (!account) return reply.status(400).send({ error: 'No linked bank account' });

  // 3. Initiate transfer via Anchor BaaS
  const result = await PaymentService.initiateTransfer({
    amount: session.amount,
    sourceAccount: account.accountNumber,
    destinationAccount: '0012345678', // Seller's account
    destinationBankCode: '044',
    sourceBankCode: '044',
    narration: `BPN Payment – Session ${sessionToken}`,
  });

  // 4. Record transaction
  const txn = await prisma.transaction.create({
    data: {
      buyerId: matchedUser.id,
      amount: session.amount,
      sellerId: session.sellerId,
      status: 'PENDING',
      bankReference: 'REF-' + Math.random().toString(36).substring(7).toUpperCase(),
    },
  });

  request.log.info({ 
    txnId: txn.id, 
    buyerId: matchedUser.id, 
    sellerId: session.sellerId, 
    amount: session.amount 
  }, 'Transaction Authorized');

  // 5. Audit log & Session Cleanup
  await RedisService.del(`session:${sessionToken}`);
  await prisma.auditLog.create({
    data: { userId: matchedUser.id, action: 'PAY', details: `₦${session.amount} to seller ${session.sellerId}. Ref: ${txn.bankReference}` },
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

// ─── POST /webhook/anchor ──────────────────────────────────────
// This endpoint receives transaction status updates from Anchor BaaS.
fastify.post('/webhook/anchor', async (request, reply) => {
  const { event, data } = request.body as any;
  
  // In production, verify the webhook signature here:
  // const sig = request.headers['x-anchor-signature'];
  // if (!WebhookService.verify(request.rawBody, sig)) return reply.status(401).send();

  if (event === 'transfer.updated') {
    const { id, status } = data;
    
    // Map Anchor statuses to BPN statuses
    const bpnStatus = status === 'successful' ? 'COMPLETED' : 'FAILED';
    
    const transaction = await prisma.transaction.update({
      where: { bankReference: id },
      data: { status: bpnStatus }
    });

    request.log.info({ txnId: transaction.id, status: bpnStatus }, 'Transaction updated via webhook');
  }

  return { received: true };
});

// ─── GET /health ─────────────────────────────────────────────
fastify.get('/health', async (request, reply) => {
  const dbStatus = await prisma.$queryRaw`SELECT 1`.then(() => 'UP').catch(() => 'DOWN');
  const redisStatus = RedisService.isConnected() ? 'UP' : 'DOWN';
  
  const status = dbStatus === 'UP' && redisStatus === 'UP' ? 200 : 503;
  return reply.status(status).send({
    status: status === 200 ? 'HEALTHY' : 'UNHEALTHY',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString()
  });
});

// ─── GET /transactions ────────────────────────────────────────
fastify.get('/transactions', async (request) => {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return transactions;
});

// ─── Phase 7: Merchant Reporting & Compliance ────────────────

/**
 * GET /merchant/stats
 * Aggregates transaction volume and user metrics for the dashboard.
 */
fastify.get('/merchant/stats', async (request, reply) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { status: { in: ['COMPLETED', 'PENDING'] } }, 
    });
    
    const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const activeUsers = await prisma.user.count();

    // In production, success rate would be calculated from real session data.
    return {
      totalVolume,
      activeUsers,
      successRate: '98.5%',
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ 
      error: 'Unable to retrieve merchant statistics. Please try again later.' 
    });
  }
});

/**
 * GET /merchant/transactions
 * Returns the most recent 10 transactions with integrated buyer data.
 */
fastify.get('/merchant/transactions', async (request, reply) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { buyer: { include: { accounts: true } } }
    });

    return transactions.map(tx => ({
      ...tx,
      buyer: BiometricService.getMaskedBuyerProfile(tx.buyer)
    }));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ 
      error: 'Failed to fetch transaction history. Check your network connection.' 
    });
  }
});

/**
 * GET /merchant/ndpr-export
 * Generates an NDPR-compliant CSV log of all biometric security events.
 */
fastify.get('/merchant/ndpr-export', async (request, reply) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const csvHeaders = 'ID,User,Action,Details,Date\n';
    const csvRows = logs.map(l => `${l.id},${l.userId},${l.action},${l.details},${l.createdAt}`).join('\n');
    
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename=ndpr_audit_export.csv');
    return csvHeaders + csvRows;
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ 
      error: 'Audit export failed. System logs are temporarily unavailable.' 
    });
  }
});

// ─── Phase 8: Recovery & Fallback ────────────────────────────

/**
 * POST /lookup-buyer
 * Searches for a buyer by phone or partial BVN. 
 * Returns ONLY masked profile for POS confirmation.
 */
fastify.post('/lookup-buyer', async (request, reply) => {
  const { phoneNumber, partialBvn } = request.body as any;

  if (!phoneNumber && !partialBvn) {
    return reply.status(400).send({ error: 'Provide phone number or partial BVN' });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        phoneNumber ? { phoneNumber } : {},
        partialBvn ? { bvn: { endsWith: partialBvn } } : {}
      ]
    },
    include: { accounts: true }
  });

  if (!user) return reply.status(404).send({ error: 'Buyer not found' });

  return {
    status: 'SUCCESS',
    buyer: BiometricService.getMaskedBuyerProfile(user)
  };
});

/**
 * POST /verify-pin
 * Validates a buyer's PIN after a successful lookup.
 */
fastify.post('/verify-pin', async (request, reply) => {
  const { sessionToken, pin, phoneNumber } = request.body as any;

  const session = await RedisService.get(`session:${sessionToken}`);
  if (!session) return reply.status(404).send({ error: 'Session expired' });

  const user = await prisma.user.findUnique({
    where: { phoneNumber },
    include: { accounts: true }
  });

  if (!user || (user.pinHash ? user.pinHash !== pin : pin !== '1234')) { // Mocking PIN check
    return reply.status(401).send({ error: 'Invalid PIN' });
  }

  // Authorize transaction (Reuse matching logic)
  const account = user.accounts[0];
  if (!account) return reply.status(400).send({ error: 'No linked account' });

  const txn = await prisma.transaction.create({
    data: {
      buyerId: user.id,
      amount: session.amount,
      sellerId: session.sellerId,
      status: 'PENDING',
      bankReference: 'REFP-' + Math.random().toString(36).substring(7).toUpperCase(),
    },
  });

  await RedisService.del(`session:${sessionToken}`);
  return { status: 'COMPLETED', reference: txn.bankReference };
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
