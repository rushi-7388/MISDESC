/**
 * Request Validation Engine
 * Provides deterministic boundary validation, schema checks, and error formatting
 * for MISDESC financial and regulatory endpoints.
 */

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
    this.details = details;
  }
}

function validateRequired(obj, fields) {
  const missing = [];
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === "") {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    throw new ValidationError(`Missing required field(s): ${missing.join(", ")}`, missing);
  }
}

function validatePositiveNumber(value, fieldName) {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    throw new ValidationError(`Field '${fieldName}' must be a positive number greater than 0`);
  }
  return num;
}

function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `Invalid '${fieldName}': '${value}'. Must be one of: ${allowedValues.join(", ")}`
    );
  }
  return value;
}

module.exports = {
  ValidationError,
  validateRequired,
  validatePositiveNumber,
  validateEnum,
};
