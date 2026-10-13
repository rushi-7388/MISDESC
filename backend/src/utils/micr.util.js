/**
 * Simulated MICR band parser.
 *
 * Real MISDESC systems read the MICR line (E-13B font) off the physical cheque via
 * a scanner. For this simulation we accept a MICR-style string typed/entered
 * at upload time, in the simplified layout:
 *
 *   <chequeNumber(6)><ifsc(11)><accountNumber(6-16)><transactionCode(2)>
 *
 * Example: "000123 SBIN0001234 000456789012 10"
 */

const MICR_REGEX = /^(\d{6})\s+([A-Z]{4}0\d{6})\s+(\d{6,16})\s+(\d{2})$/;

function parseMicrLine(micrLine) {
  const match = MICR_REGEX.exec(micrLine.trim());
  if (!match) {
    return { valid: false, error: "MICR line does not match expected format" };
  }

  const [, chequeNumber, ifsc, accountNumber, transactionCode] = match;

  return {
    valid: true,
    chequeNumber,
    ifsc,
    accountNumber,
    transactionCode,
  };
}

function buildMicrLine({ chequeNumber, ifsc, accountNumber, transactionCode = "10" }) {
  return `${chequeNumber.padStart(6, "0")} ${ifsc} ${accountNumber} ${transactionCode}`;
}

module.exports = { parseMicrLine, buildMicrLine, MICR_REGEX };
