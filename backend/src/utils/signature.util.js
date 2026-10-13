/**
 * AI Specimen Signature 1:1 Verification Engine
 * Analyzes CBS Core Banking Specimen Cards vs Truncated Cheque Signatures
 * Simulates contour analysis, stroke density matching, and biometric tremor detection.
 */

function generateSignatureVectors(accountNumber) {
  // Deterministic or seeded sample signature paths based on account digits
  const seed = accountNumber ? Number(accountNumber.slice(-3)) || 123 : 123;
  const isSuspect = seed % 7 === 0; // deterministic trigger for demo accounts

  // Specimen SVG path
  const specimenSvgPath = "M 20 60 Q 50 10, 80 50 T 140 45 T 190 70 Q 220 20, 240 55 T 300 45 Q 330 80, 360 40";
  // Extracted cheque signature SVG (with natural human handwriting variance or fraud deviation)
  const extractedSvgPath = isSuspect
    ? "M 20 50 Q 60 40, 90 60 T 130 75 T 180 50 Q 230 40, 250 65 T 290 70"
    : "M 22 59 Q 49 12, 81 49 T 139 46 T 191 69 Q 219 21, 241 54 T 299 46 Q 329 79, 359 41";

  const matchScore = isSuspect ? Number((58 + (seed % 15)).toFixed(1)) : Number((93 + (seed % 6) + Math.random() * 0.8).toFixed(1));
  const disparityIndex = isSuspect ? 0.284 : 0.038;
  const strokeDensityMatch = isSuspect ? 64.2 : 98.4;
  const tremorPassed = !isSuspect;

  const verdict = matchScore >= 80 ? "CONFIRMED_MATCH" : "SUSPECT_MISMATCH";

  return {
    accountNumber,
    specimenCard: {
      signatoryName: "Authorized Signatory",
      accountType: "Current / Business Premium",
      cbsBranchCode: "CBS-SRT-004",
      verifiedSince: "2021-04-15",
      svgPath: specimenSvgPath,
    },
    extractedSignature: {
      zone: "Courtesy Signature Band (Btm-Right)",
      resolutionDpi: 300,
      svgPath: extractedSvgPath,
    },
    metrics: {
      matchScore,
      disparityIndex,
      strokeDensityMatch,
      tremorPassed,
      hesitationPointsDetected: isSuspect ? 4 : 0,
      verdict,
      recommendation:
        matchScore >= 80
          ? "Specimen signature aligns within standard MISDESC-2010 biometric tolerance. Authorized for clearance."
          : "Disparity exceeds 15% threshold. Potential signature forgery detected. Route to Senior Checker or Return Code 02.",
    },
  };
}

module.exports = {
  generateSignatureVectors,
};
