const prisma = require("../config/prisma");
const { parseMicrLine } = require("../utils/micr.util");
const { runFraudChecks, hashFile } = require("../utils/fraud.util");
const { evaluateChequeRisk } = require("../utils/risk.util");
const { scanChequeOCR } = require("../utils/ocr.util");
const { generatePacs002Xml } = require("../utils/iso20022.util");
const { recordChainedEvent } = require("../utils/ledger.util");
const { broadcastEvent } = require("../utils/sse.util");
const { generateSignatureVectors } = require("../utils/signature.util");
const { generateForensicAnalysis } = require("../utils/forensics.util");

// AI / OCR scanning endpoint for auto-extraction
async function scanOcrCheque(req, res) {
  try {
    const filePath = req.file ? req.file.path : null;
    const { hintText } = req.body;

    const result = await scanChequeOCR(filePath, hintText);
    return res.json(result);
  } catch (err) {
    console.error("OCR scan error:", err);
    return res.status(500).json({ error: "Failed to perform OCR scan on cheque image" });
  }
}

// Presenting bank uploads a cheque
async function createCheque(req, res) {
  try {
    const { micrLine, payeeName, amount, draweeIfsc, batchId } = req.body;

    if (!micrLine || !payeeName || !amount || !draweeIfsc) {
      return res.status(400).json({ error: "micrLine, payeeName, amount, draweeIfsc are required" });
    }

    const parsed = parseMicrLine(micrLine);
    if (!parsed.valid) {
      return res.status(400).json({ error: parsed.error });
    }

    const draweeBank = await prisma.bank.findUnique({ where: { ifsc: draweeIfsc } });
    if (!draweeBank) {
      return res.status(404).json({ error: "Drawee bank with that IFSC not found in the system" });
    }

    let imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    let imageHash = req.file ? hashFile(req.file.path) : null;

    if (!imageUrl) {
      if (parsed.chequeNumber === "000102") imageUrl = "/cheque-000102.jpg";
      else if (parsed.chequeNumber === "000123") imageUrl = "/cheque-000123.jpg";
      else imageUrl = "/sample-cheque.jpg";
      imageHash = `sha256_MISDESC2010_${parsed.chequeNumber}_${Date.now()}`;
    }

    // 1. Dynamic Risk Evaluation (0 - 100) with Positive Pay Cross-Match
    const riskEval = await evaluateChequeRisk({
      chequeNumber: parsed.chequeNumber,
      accountNumber: parsed.accountNumber,
      amount,
      imageHash,
      draweeIfsc,
      payeeName,
    });

    // 2. Find active clearing batch session if not explicitly provided
    let assignedBatchId = batchId || null;
    if (!assignedBatchId) {
      const activeBatch = await prisma.batch.findFirst({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
      });
      if (activeBatch) assignedBatchId = activeBatch.id;
    }

    // AI Signature Biometric Metrics
    const signatureAnalysis = generateSignatureVectors(parsed.accountNumber);

    const cheque = await prisma.cheque.create({
      data: {
        chequeNumber: parsed.chequeNumber,
        micrCode: micrLine,
        accountNumber: parsed.accountNumber,
        ifsc: parsed.ifsc,
        amount,
        payeeName,
        imageUrl,
        imageHash,
        status: "PRESENTED",
        riskScore: riskEval.score,
        riskTier: riskEval.tier,
        riskFactors: riskEval.factors,
        ppsStatus: riskEval.ppsStatus,
        ppsDiscrepancy: riskEval.ppsDiscrepancy,
        signatureMatchScore: signatureAnalysis.metrics.matchScore,
        signatureStatus: signatureAnalysis.metrics.verdict,
        batchId: assignedBatchId,
        presentingBankId: req.user.bankId,
        draweeBankId: draweeBank.id,
        uploadedById: req.user.id,
      },
      include: { presentingBank: true, draweeBank: true, batch: true },
    });

    // 3. Cryptographic Blockchain Hash-Chain Event Record
    await recordChainedEvent({
      chequeId: cheque.id,
      fromStatus: null,
      toStatus: "PRESENTED",
      remarks: `Presented into clearing. Risk Score: ${riskEval.score}/100 (${riskEval.tier})${assignedBatchId ? " · Batch Assigned" : ""}`,
      actorId: req.user.id,
    });

    // 4. Fraud Flags Check
    const fraudFlags = await runFraudChecks({
      chequeId: cheque.id,
      chequeNumber: cheque.chequeNumber,
      accountNumber: cheque.accountNumber,
      amount: cheque.amount,
      imageHash,
    });

    // 5. Broadcast real-time SSE notification to all connected banks
    broadcastEvent("CHEQUE_PRESENTED", {
      chequeId: cheque.id,
      chequeNumber: cheque.chequeNumber,
      amount: cheque.amount,
      payeeName: cheque.payeeName,
      presentingBank: cheque.presentingBank?.name,
      draweeBank: cheque.draweeBank?.name,
      draweeBankId: cheque.draweeBankId,
      riskTier: cheque.riskTier,
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({ ...cheque, fraudFlags, riskEvaluation: riskEval });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create cheque" });
  }
}

// List cheques visible to the logged-in user's bank
async function listCheques(req, res) {
  const { bankId, role } = req.user;
  const { status } = req.query;

  const where = {
    ...(status ? { status } : {}),
    ...(role === "ADMIN" ? {} : { OR: [{ presentingBankId: bankId }, { draweeBankId: bankId }] }),
  };

  const cheques = await prisma.cheque.findMany({
    where,
    include: {
      presentingBank: true,
      draweeBank: true,
      batch: true,
      fraudFlags: { where: { resolved: false } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(cheques);
}

async function getCheque(req, res) {
  const cheque = await prisma.cheque.findUnique({
    where: { id: req.params.id },
    include: {
      presentingBank: true,
      draweeBank: true,
      batch: true,
      events: { orderBy: { createdAt: "asc" }, include: { actor: true } },
      fraudFlags: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!cheque) return res.status(404).json({ error: "Cheque not found" });
  return res.json(cheque);
}

// XML representation for an individual cheque (pacs.002 on return)
async function getChequeIso20022(req, res) {
  const cheque = await prisma.cheque.findUnique({
    where: { id: req.params.id },
    include: { presentingBank: true, draweeBank: true },
  });

  if (!cheque) return res.status(404).json({ error: "Cheque not found" });

  const xml = generatePacs002Xml({ cheque });
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  return res.send(xml);
}

// Positive Pay System: Pre-register a cheque
async function registerPositivePay(req, res) {
  try {
    const { accountNumber, chequeNumber, payeeName, amount, chequeDate } = req.body;

    if (!accountNumber || !chequeNumber || !payeeName || !amount) {
      return res.status(400).json({ error: "accountNumber, chequeNumber, payeeName, amount are required" });
    }

    const record = await prisma.positivePayRecord.upsert({
      where: {
        accountNumber_chequeNumber: {
          accountNumber,
          chequeNumber,
        },
      },
      update: {
        payeeName,
        amount: Number(amount),
        chequeDate: chequeDate ? new Date(chequeDate) : new Date(),
        status: "REGISTERED",
      },
      create: {
        accountNumber,
        chequeNumber,
        payeeName,
        amount: Number(amount),
        chequeDate: chequeDate ? new Date(chequeDate) : new Date(),
        bankId: req.user.bankId,
        status: "REGISTERED",
      },
    });

    return res.status(201).json(record);
  } catch (err) {
    console.error("Positive Pay Registration Error:", err);
    return res.status(500).json({ error: "Failed to register Positive Pay record" });
  }
}

// List all registered Positive Pay records
async function listPositivePay(req, res) {
  try {
    const records = await prisma.positivePayRecord.findMany({
      orderBy: { createdAt: "desc" },
      include: { bank: true },
    });
    return res.json(records);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load Positive Pay records" });
  }
}

// AI Specimen Signature Analysis comparison endpoint
async function getSignatureComparison(req, res) {
  try {
    const cheque = await prisma.cheque.findUnique({
      where: { id: req.params.id },
    });
    if (!cheque) return res.status(404).json({ error: "Cheque not found" });

    const analysis = generateSignatureVectors(cheque.accountNumber);
    return res.json(analysis);
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate signature analysis" });
  }
}

// Bulk ingest cheques from branch batch upload / CSV manifest
async function bulkIngestCheques(req, res) {
  try {
    const { batchName, instruments } = req.body;
    if (!instruments || !Array.isArray(instruments) || instruments.length === 0) {
      return res.status(400).json({ error: "instruments array is required and cannot be empty" });
    }

    // 1. Locate or create a dedicated batch session
    let batch;
    if (batchName) {
      const code = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`;
      batch = await prisma.batch.create({
        data: {
          sessionName: batchName,
          sessionCode: code,
          status: "OPEN",
        },
      });
    } else {
      batch = await prisma.batch.findFirst({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
      });
      if (!batch) {
        const code = `BATCH-${Date.now().toString().slice(-6)}`;
        batch = await prisma.batch.create({
          data: {
            sessionName: `Clearing Ingestion Batch ${code}`,
            sessionCode: code,
            status: "OPEN",
          },
        });
      }
    }

    const results = [];
    let runningBatchAmount = 0;

    for (const item of instruments) {
      try {
        const chequeNumber = String(item.chequeNumber || "").padStart(6, "0");
        const accountNumber = String(item.accountNumber || "");
        const amount = Number(item.amount);
        const payeeName = item.payeeName;
        const draweeIfsc = item.draweeIfsc || "HDFC0005678";

        if (!chequeNumber || !accountNumber || !amount || !payeeName) {
          results.push({
            success: false,
            chequeNumber: chequeNumber || "UNKNOWN",
            error: "Missing mandatory fields (chequeNumber, accountNumber, amount, payeeName)",
          });
          continue;
        }

        const draweeBank = await prisma.bank.findUnique({ where: { ifsc: draweeIfsc } });
        if (!draweeBank) {
          results.push({
            success: false,
            chequeNumber,
            error: `Drawee bank IFSC ${draweeIfsc} not registered in MISDESC network`,
          });
          continue;
        }

        // Standardized MISDESC-2010 MICR line
        const micrLine = item.micrLine || `C${chequeNumber}C 395002002A ${accountNumber}C 10`;

        // 1. Risk Evaluation & Positive Pay System Cross-Match
        const riskEval = await evaluateChequeRisk({
          chequeNumber,
          accountNumber,
          amount,
          imageHash: null,
          draweeIfsc,
          payeeName,
        });

        // 2. AI Specimen Signature Analysis
        const signatureAnalysis = generateSignatureVectors(accountNumber);

        // 3. Persist Cheque
        const cheque = await prisma.cheque.create({
          data: {
            chequeNumber,
            micrCode: micrLine,
            accountNumber,
            ifsc: "SBIN0001234",
            amount,
            payeeName,
            imageUrl: item.imageUrl || (chequeNumber === "000102" ? "/cheque-000102.jpg" : chequeNumber === "000123" ? "/cheque-000123.jpg" : "/sample-cheque.jpg"),
            imageHash: `sha256_${Date.now()}_${chequeNumber}`,
            status: "PRESENTED",
            riskScore: riskEval.score,
            riskTier: riskEval.tier,
            riskFactors: riskEval.factors,
            ppsStatus: riskEval.ppsStatus,
            ppsDiscrepancy: riskEval.ppsDiscrepancy,
            signatureMatchScore: signatureAnalysis.metrics.matchScore,
            signatureStatus: signatureAnalysis.metrics.verdict,
            batchId: batch.id,
            presentingBankId: req.user.bankId,
            draweeBankId: draweeBank.id,
            uploadedById: req.user.id,
          },
          include: { presentingBank: true, draweeBank: true, batch: true },
        });

        // 4. Chained Blockchain Ledger Entry
        const ledgerRecord = await recordChainedEvent({
          chequeId: cheque.id,
          fromStatus: null,
          toStatus: "PRESENTED",
          remarks: `Clearing Batch ${batch.sessionCode} Ingestion · Risk: ${riskEval.score}/100 · PPS: ${riskEval.ppsStatus}`,
          actorId: req.user.id,
        });

        // 5. Run Fraud Checks
        await runFraudChecks({
          chequeId: cheque.id,
          chequeNumber: cheque.chequeNumber,
          accountNumber: cheque.accountNumber,
          amount: cheque.amount,
          imageHash: cheque.imageHash,
        });

        runningBatchAmount += amount;

        results.push({
          success: true,
          chequeId: cheque.id,
          chequeNumber: cheque.chequeNumber,
          accountNumber: cheque.accountNumber,
          amount: Number(cheque.amount),
          payeeName: cheque.payeeName,
          riskScore: cheque.riskScore,
          riskTier: cheque.riskTier,
          ppsStatus: cheque.ppsStatus,
          signatureStatus: cheque.signatureStatus,
          signatureMatchScore: cheque.signatureMatchScore,
          blockHash: ledgerRecord.hash,
        });
      } catch (itemErr) {
        console.error("Bulk item ingestion error:", itemErr);
        results.push({
          success: false,
          chequeNumber: item.chequeNumber || "UNKNOWN",
          error: itemErr.message,
        });
      }
    }

    const successfulCount = results.filter((r) => r.success).length;

    // Update batch aggregates
    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        totalCount: { increment: successfulCount },
        totalAmount: { increment: runningBatchAmount },
      },
    });

    // Broadcast SSE event
    broadcastEvent("BATCH_INGESTED", {
      batchId: batch.id,
      sessionCode: batch.sessionCode,
      totalIngested: successfulCount,
      totalAmount: runningBatchAmount,
      presentingBankId: req.user.bankId,
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      message: `Successfully ingested ${successfulCount} of ${instruments.length} instruments into clearing batch ${batch.sessionCode}`,
      batch: {
        id: batch.id,
        sessionCode: batch.sessionCode,
        sessionName: batch.sessionName,
      },
      totalIngested: successfulCount,
      totalFailed: instruments.length - successfulCount,
      totalBatchAmount: runningBatchAmount,
      items: results,
    });
  } catch (err) {
    console.error("Bulk ingestion failed:", err);
    return res.status(500).json({ error: "Failed to process bulk cheque ingestion pipeline" });
  }
}

async function getChequeForensics(req, res) {
  try {
    const cheque = await prisma.cheque.findUnique({
      where: { id: req.params.id },
    });
    if (!cheque) return res.status(404).json({ error: "Cheque not found" });

    const forensics = generateForensicAnalysis(cheque);
    return res.json(forensics);
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate forensic analysis" });
  }
}

module.exports = {
  scanOcrCheque,
  createCheque,
  listCheques,
  getCheque,
  getChequeIso20022,
  registerPositivePay,
  listPositivePay,
  getSignatureComparison,
  getChequeForensics,
  bulkIngestCheques,
};
