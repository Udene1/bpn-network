import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
  static async log(params: {
    action: string;
    userId?: string;
    entityId?: string;
    metadata?: any;
    request?: any;
  }) {
    try {
      const ip = params.request?.ip;
      const userAgent = params.request?.headers['user-agent'];

      await prisma.auditLog.create({
        data: {
          action: params.action,
          userId: params.userId,
          entityId: params.entityId,
          metadata: params.metadata || {},
          ip,
          userAgent
        }
      });
      console.log(`[AUDIT] ${params.action} logged for user ${params.userId || 'Guest'}`);
    } catch (error) {
      console.error('[AUDIT ERROR]', error);
    }
  }

  static async logBiometricMatch(params: {
    userId: string;
    success: boolean;
    score?: number;
    request?: any;
  }) {
    await this.log({
      action: params.success ? 'BIOMETRIC_MATCH_SUCCESS' : 'BIOMETRIC_MATCH_FAILURE',
      userId: params.userId,
      metadata: { score: params.score },
      request: params.request
    });
  }

  static async logConsent(userId: string, request?: any) {
    await this.log({
      action: 'NDPR_CONSENT_GRANTED',
      userId,
      metadata: { version: '1.0' },
      request
    });
  }
}
