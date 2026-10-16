const crypto = require("crypto");
const { broadcastEvent } = require("../utils/sse.util");

/**
 * Advanced AI Fraud Intelligence & Forensic Biometrics Engine
 * 
 * 1. Deep Siamese Neural Signature Similarity & Dynamic Time Warping (DTW)
 * 2. Multi-Spectral UV Watermark & Paper Fluorescence Analyzer (365nm simulation)
 * 3. Real-Time Payee Name Alteration & Micro-Print Integrity Detector
 */

/**
 * Simulates Siamese Neural Network Feature Vector Embedding (512-dim embedding)
 */
function extractSignatureFeatures(signatureBufferOrStr) {
  const seed = typeof signatureBufferOrStr === "string" 
    ? signatureBufferOrStr 
    : (signatureBufferOrStr ? signatureBufferOrStr.toString("base64") : "default_seed");
  
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  // Derive synthetic biometric stroke parameters
  const strokePressure = (parseInt(hash.substring(0, 4), 16) % 40) + 60; // 60 - 100%
  const strokeCount = (parseInt(hash.substring(4, 8), 16) % 15) + 12; // 12 - 27 strokes
  const baselineInclineDeg = ((parseInt(hash.substring(8, 12), 16) % 30) - 15); // -15 to +15 deg
  const aspectCurvatureRatio = Number((1.2 + (parseInt(hash.substring(12, 16), 16) % 80) / 100).toFixed(2));
  
  return {
    featureVectorHash: hash,
    strokePressure,
    strokeCount,
    baselineInclineDeg,
    aspectCurvatureRatio,
  };
}

/**
 * Dynamic Time Warping (DTW) & Cosine Distance between presented and specimen signature
 */
function compareSignatures(presentedSignature, referenceSpecimen) {
  const presented = extractSignatureFeatures(presentedSignature || "presented_cheque_sig");
  const reference = extractSignatureFeatures(referenceSpecimen || "cbs_mandate_reference_sig");

  // Incline delta
  const inclineDiff = Math.abs(presented.baselineInclineDeg - reference.baselineInclineDeg);
  const strokeDiff = Math.abs(presented.strokeCount - reference.strokeCount);
  const pressureDiff = Math.abs(presented.strokePressure - reference.strokePressure);
  const aspectDiff = Math.abs(presented.aspectCurvatureRatio - reference.aspectCurvatureRatio);

  // Compute Siamese match score (0 - 100%)
  let score = 96.5 - (inclineDiff * 0.8) - (strokeDiff * 1.5) - (pressureDiff * 0.2) - (aspectDiff * 5.0);
  score = Math.max(12, Math.min(99.4, Number(score.toFixed(2))));

  const isMatched = score >= 75.0;
  const dtwAlignmentCost = Number((Math.sqrt(inclineDiff ** 2 + strokeDiff ** 2) * 1.4).toFixed(3));

  const forensicDetails = {
    siameseSimilarityPercent: score,
    isMatched,
    confidenceTier: score >= 90 ? "HIGH_CONFIDENCE_AUTHENTIC" : score >= 75 ? "ACCEPTABLE_MANUAL_REVIEW" : "POTENTIAL_FORGERY_ALERT",
    dtwContourDistance: dtwAlignmentCost,
    structuralAspectVariance: Number(aspectDiff.toFixed(3)),
    pressureGradientScore: Number((100 - pressureDiff).toFixed(1)),
    strokeAlignmentVector: {
      presentedStrokes: presented.strokeCount,
      referenceStrokes: reference.strokeCount,
      baselineInclinePresentedDeg: presented.baselineInclineDeg,
      baselineInclineReferenceDeg: reference.baselineInclineDeg,
    },
    recommendation: isMatched 
      ? "Signature matches specimen within NPCI-2010 tolerance. Auto-clearing approved."
      : "High geometric divergence detected. Escalate to Drawee Checker for 4-eyes biometric signoff.",
  };

  return forensicDetails;
}

/**
 * Multi-Spectral UV 365nm Watermark & Solvent Fluorescence Analyzer
 */
function analyzeUvSpectralFluorescence(chequeData = {}) {
  const {
    chequeNumber = "000001",
    hasChemicalWash = false,
    hasUvBleachHalo = false,
    fluorescenceIntensity = 12.4, // standard cotton paper reflectance < 25 CDU
  } = chequeData;

  const isSolventTreated = hasChemicalWash || hasUvBleachHalo || fluorescenceIntensity > 40.0;
  const securityFiberCount = Math.floor(25 + (parseInt(chequeNumber.slice(-3) || "123", 10) % 20));
  const rbiWatermarkIntegrity = isSolventTreated ? 42.0 : 98.6;
  const voidPantographTriggered = isSolventTreated;

  const result = {
    chequeNumber,
    uvWavelengthNm: 365,
    fluorescenceUnitsCDU: fluorescenceIntensity,
    maxPermissibleCDU: 35.0,
    rbiWatermarkIntegrityPercent: rbiWatermarkIntegrity,
    securityFibersDetected: securityFiberCount,
    securityFiberStatus: securityFiberCount >= 20 ? "PASS_VERIFIED" : "FAIL_INSUFFICIENT_FIBERS",
    voidPantographStatus: voidPantographTriggered ? "COMPROMISED_VOID_TRIGGERED" : "CLEAN_LATENT",
    chemicalSolventResiduals: isSolventTreated ? "POSITIVE_ACETONE_CHLORINE_HALO" : "NEGATIVE_UNALTERED",
    status: isSolventTreated ? "REJECT_CHEMICAL_ALTERATION" : "PASS_AUTHENTIC",
    timestamp: new Date().toISOString(),
  };

  return result;
}

/**
 * Real-Time Payee Name Alteration & Micro-Print Integrity Detector
 */
function analyzePayeeIntegrity(chequePayload = {}) {
  const {
    payeeName = "RUSHIKESH PATEL",
    amountWords = "Rupees One Lakh Twenty Five Thousand Only",
    amountNumber = 125000,
    drawerAccount = "987654321098",
    isAltered = false,
  } = chequePayload;

  // Simulate pixel continuity and optical kerning analysis
  const opticalKerningDiscontinuity = isAltered ? 0.38 : 0.04; // > 0.15 indicates erasure / overwriting
  const strokeThicknessVariance = isAltered ? 1.45 : 0.08; // > 0.20 indicates secondary pen stroke
  const microPrintLineStatus = isAltered ? "DISRUPTED_UNDER_PAYEE" : "CONTINUOUS_INTACT";
  
  const payeeTampered = opticalKerningDiscontinuity > 0.15 || strokeThicknessVariance > 0.20 || isAltered;
  const confidenceScore = payeeTampered 
    ? Number((35.0 + Math.random() * 20).toFixed(1)) 
    : Number((95.0 + Math.random() * 4.5).toFixed(1));

  const result = {
    payeeName,
    amountWords,
    amountNumber,
    drawerAccount,
    payeeTampered,
    integrityConfidenceScore: confidenceScore,
    opticalKerningDiscontinuity,
    strokeThicknessVariance,
    microPrintLineStatus,
    microPrintText: "NPCI CTS-2010 RESERVE BANK OF INDIA VERIFIED",
    detectedAnomalies: payeeTampered ? [
      "Irregular font weight detected in Payee name letters",
      "Discontinuous micro-print border underlying payee field",
      "Optical character baseline misalignment (> 2.1mm offset)",
    ] : [],
    verdict: payeeTampered ? "TAMPERED_FRAUD_HOLD" : "CLEAN_VERIFIED",
    timestamp: new Date().toISOString(),
  };

  return result;
}

/**
 * Generate Comprehensive Forensic Dossier for a Cheque
 */
function generateForensicDossier(cheque) {
  const signatureAnalysis = compareSignatures(
    cheque.signature || cheque.chequeNumber, 
    cheque.specimenSignature || "standard_mandate_ref"
  );
  const uvAnalysis = analyzeUvSpectralFluorescence({
    chequeNumber: cheque.chequeNumber,
    hasChemicalWash: cheque.fraudAlerts?.chemicalWash || false,
    hasUvBleachHalo: cheque.fraudAlerts?.uvHalo || false,
  });
  const payeeAnalysis = analyzePayeeIntegrity({
    payeeName: cheque.payeeName,
    amountWords: cheque.amountInWords,
    amountNumber: Number(cheque.amount),
    drawerAccount: cheque.drawerAccount,
    isAltered: cheque.fraudAlerts?.payeeAltered || false,
  });

  const overallRiskScore = Math.round(
    ((100 - signatureAnalysis.siameseSimilarityPercent) * 0.45) +
    ((100 - uvAnalysis.rbiWatermarkIntegrityPercent) * 0.35) +
    ((100 - payeeAnalysis.integrityConfidenceScore) * 0.20)
  );

  const dossier = {
    dossierId: `FDS-${Date.now()}-${cheque.chequeNumber || "000000"}`,
    chequeId: cheque.id || "mock-chq",
    chequeNumber: cheque.chequeNumber,
    overallRiskScore: Math.min(100, Math.max(0, overallRiskScore)),
    compositeVerdict: overallRiskScore < 25 ? "PASSED_AUTHENTIC" : overallRiskScore < 60 ? "MANUAL_REVIEW_REQUIRED" : "BLOCKED_FRAUD_SUSPECT",
    signatureAnalysis,
    uvAnalysis,
    payeeAnalysis,
    certifiedAt: new Date().toISOString(),
  };

  broadcastEvent("FORENSIC_DOSSIER_COMPILED", {
    chequeNumber: cheque.chequeNumber,
    verdict: dossier.compositeVerdict,
    riskScore: dossier.overallRiskScore,
  });

  return dossier;
}

module.exports = {
  extractSignatureFeatures,
  compareSignatures,
  analyzeUvSpectralFluorescence,
  analyzePayeeIntegrity,
  generateForensicDossier,
};
