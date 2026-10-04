CREATE TABLE "BpnBiometricIdentity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerReference" TEXT NOT NULL,
  "modality" TEXT NOT NULL DEFAULT 'FINGERPRINT',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "BpnBiometricIdentity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BpnBiometricIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "BpnBiometricIdentity_provider_providerReference_key" ON "BpnBiometricIdentity"("provider","providerReference");
CREATE INDEX "BpnBiometricIdentity_userId_idx" ON "BpnBiometricIdentity"("userId");
