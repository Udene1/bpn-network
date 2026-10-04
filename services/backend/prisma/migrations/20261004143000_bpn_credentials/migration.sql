-- BPN credentials replace biometric templates as the network authorization primitive.
CREATE TABLE "BpnCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "BpnCredential_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BpnCredential_userId_idx" ON "BpnCredential"("userId");
ALTER TABLE "BpnCredential" ADD CONSTRAINT "BpnCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
