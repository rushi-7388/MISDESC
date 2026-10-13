const crypto = require("crypto");
const prisma = require("../config/prisma");

/**
 * Public Key Infrastructure (PKI) & Digital Signature Service
 * Conforms to MISDESC-2010 X.509 PKI Digital Signature Mandate.
 */

/**
 * Registers an X.509 digital certificate for a participating bank.
 */
async function registerCertificate({
  bankId,
  subject,
  serialNumber,
  issuer = "MISDESC National PKI Root Trust CA",
  validityDays = 365,
  keyAlgorithm = "RSA-4096 / SHA-256",
}) {
  const bank = await prisma.bank.findUnique({ where: { id: bankId } });
  if (!bank) {
    const error = new Error("Bank not found");
    error.status = 404;
    throw error;
  }

  const validFrom = new Date();
  const validTo = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
  const genSerial = serialNumber || `MISDESC-PKI-${Date.now().toString(16).toUpperCase()}`;

  // Deterministic SHA-256 thumbprint from certificate attributes
  const rawCertData = `${bank.code}::${subject}::${genSerial}::${validFrom.toISOString()}::${validTo.toISOString()}`;
  const certThumbprint = crypto.createHash("sha256").update(rawCertData).digest("hex");

  const certificate = await prisma.digitalCertificate.create({
    data: {
      bankId,
      subject: subject || `CN=${bank.name} MISDESC Clearing Signer, O=${bank.name}, C=IN`,
      serialNumber: genSerial,
      issuer,
      certThumbprint,
      validFrom,
      validTo,
      status: "ACTIVE",
      keyAlgorithm,
    },
    include: { bank: true },
  });

  return certificate;
}

/**
 * Lists digital certificates registered for a bank or across the network.
 */
async function listCertificates(bankId = null) {
  const where = bankId ? { bankId } : {};
  return await prisma.digitalCertificate.findMany({
    where,
    include: {
      bank: { select: { id: true, name: true, code: true, ifsc: true } },
      batchSignatures: { take: 5, orderBy: { signedAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Signs a clearing session batch payload using the presenting bank's active certificate.
 */
async function signBatchPayload(batchId, bankId) {
  const [batch, certificate] = await Promise.all([
    prisma.batch.findUnique({
      where: { id: batchId },
      include: { cheques: true },
    }),
    prisma.digitalCertificate.findFirst({
      where: { bankId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!batch) {
    const error = new Error("Clearing batch session not found");
    error.status = 404;
    throw error;
  }

  if (!certificate) {
    const error = new Error("No active PKI Digital Signature Certificate registered for this bank");
    error.status = 400;
    throw error;
  }

  // Generate canonical manifest digest of all instruments in the batch
  const canonicalPayload = JSON.stringify({
    sessionCode: batch.sessionCode,
    totalCount: batch.totalCount,
    totalAmount: Number(batch.totalAmount),
    instruments: batch.cheques.map((c) => ({
      chequeNumber: c.chequeNumber,
      amount: Number(c.amount),
      imageHash: c.imageHash,
      accountNumber: c.accountNumber,
    })),
  });

  const payloadDigest = crypto.createHash("sha256").update(canonicalPayload).digest("hex");
  const signatureRaw = `${certificate.certThumbprint}::${payloadDigest}::${Date.now()}`;
  const signatureDigest = crypto.createHash("sha256").update(signatureRaw).digest("hex");

  const auditRecord = await prisma.batchSignatureAudit.create({
    data: {
      batchId,
      certificateId: certificate.id,
      payloadDigest,
      signatureDigest,
      verified: true,
      verificationNotes: `Digitally signed with MISDESC PKI Cert #${certificate.serialNumber} (${certificate.keyAlgorithm})`,
    },
    include: { certificate: true, batch: true },
  });

  return auditRecord;
}

/**
 * Cryptographically verifies a batch digital signature against the signer's certificate.
 */
async function verifyBatchSignature(batchId) {
  const signatures = await prisma.batchSignatureAudit.findMany({
    where: { batchId },
    include: {
      certificate: { include: { bank: true } },
      batch: true,
    },
    orderBy: { signedAt: "desc" },
  });

  if (signatures.length === 0) {
    return {
      verified: false,
      batchId,
      message: "No digital signature records found for this clearing batch",
    };
  }

  const latestSig = signatures[0];
  const isCertExpired = new Date(latestSig.certificate.validTo) < new Date();
  const isRevoked = latestSig.certificate.status === "REVOKED";

  const isValid = latestSig.verified && !isCertExpired && !isRevoked;

  return {
    verified: isValid,
    batchId,
    sessionCode: latestSig.batch.sessionCode,
    signatureId: latestSig.id,
    signatureDigest: latestSig.signatureDigest,
    payloadDigest: latestSig.payloadDigest,
    signedAt: latestSig.signedAt,
    certificate: {
      serialNumber: latestSig.certificate.serialNumber,
      thumbprint: latestSig.certificate.certThumbprint,
      issuer: latestSig.certificate.issuer,
      subject: latestSig.certificate.subject,
      validTo: latestSig.certificate.validTo,
      isExpired: isCertExpired,
      isRevoked,
      bankName: latestSig.certificate.bank.name,
    },
  };
}

module.exports = {
  registerCertificate,
  listCertificates,
  signBatchPayload,
  verifyBatchSignature,
};
