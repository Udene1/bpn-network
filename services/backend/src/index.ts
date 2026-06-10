import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BiometricService } from './services/biometric.service.js';
import { AnchorService } from './services/anchor.service.js';
import { AuthService } from './services/auth.service.js';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// ─── Auth Middleware ───────────────────────────────────────────
fastify.addHook('preHandler', async (request, reply) => {
  const publicRoutes = ['/invoice', '/login'];
  if (publicRoutes.includes(request.routerPath)) return;

  const authHeader = request.headers.authorization;
  if (!authHeader) return reply.status(401).send({ error: 'Missing Authorization Header' });

  const decoded = AuthService.verifyToken(authHeader.replace('Bearer ', ''));
  if (!decoded) return reply.status(401).send({ error: 'Invalid or Expired Token' });
  (request as any).user = decoded;
});

// ─── POST /login ──────────────────────────────────────────────
fastify.post('/login', async (request) => {
  const { phoneNumber } = request.body as any;
  const token = AuthService.generateToken({ phoneNumber });
  return { token };
});

// ─── POST /enroll ─────────────────────────────────────────────
fastify.post('/enroll', async (request, reply) => {
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
fastify.post('/invoice', async (request) => {
  const { sellerId, amount } = request.body as any;

  const session = await prisma.session.create({
    data: {
      sellerId,
      amount,
      token: Math.random().toString(36).substring(2, 8).toUpperCase(),
      expiresAt: new Date(Date.now() + 120 * 1000), // 120s
    },
  });

  return { token: session.token, sellerId, amount, expiresAt: session.expiresAt };
});

// ─── POST /pay ────────────────────────────────────────────────
fastify.post('/pay', async (request, reply) => {
  const { sessionToken, capturedTemplate } = request.body as any;

  // 1. Look up session
  const session = await prisma.session.findUnique({ where: { token: sessionToken } });
  if (!session || session.expiresAt < new Date()) {
    return reply.status(404).send({ error: 'Session expired or not found' });
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

  const account = matchedUser.accounts[0];
  if (!account) return reply.status(400).send({ error: 'No linked bank account' });

  // 3. Initiate transfer via Anchor BaaS
  const result = await AnchorService.transfer({
    amount: session.amount,
    source_account: account.accountNumber,
    destination_account: '0012345678', // Seller's account (would come from seller profile)
    destination_bank_code: '044',
    narration: `BPN Payment – Session ${sessionToken}`,
  });

  // 4. Record transaction
  const txn = await prisma.transaction.create({
    data: {
      amount: session.amount,
      status: result.status,
      sellerId: session.sellerId,
      buyerId: matchedUser.id,
      bankReference: result.id,
      description: `BPN POS Payment`,
    },
  });

  // 5. Audit log
  await prisma.auditLog.create({
    data: { userId: matchedUser.id, action: 'PAY', details: `₦${session.amount} to seller ${session.sellerId}. Ref: ${result.id}` },
  });

  return {
    status: txn.status,
    reference: txn.bankReference,
    buyerName: matchedUser.fullName,
    amount: session.amount,
  };
});

// ─── GET /transactions ────────────────────────────────────────
fastify.get('/transactions', async (request) => {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return transactions;
});

// ─── Server Start ─────────────────────────────────────────────
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('BPN Backend running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
