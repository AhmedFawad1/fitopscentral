// Normalize Unicode to prevent sneaky homoglyph attacks
export const normalizeInput = (value) =>
  value.normalize("NFKC");

// Trim + remove invisible chars
export const cleanWhitespace = (value) =>
  value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();

// Strict email sanitizer
export const sanitizeEmail = (value) =>
  cleanWhitespace(normalizeInput(value))
    .toLowerCase()
    .replace(/\s+/g, "");

// Block dangerous characters (XSS / injection)
export const containsDangerousChars = (value) =>
  /[<>;"'`\\]/.test(value);

// Length guard
export const exceedsLength = (value, max = 255) =>
  value.length > max;

// Basic email validation
export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Rate-limit helper (frontend soft-block)
export const isRateLimited = () => {
  const now = Date.now();
  const last = Number(localStorage.getItem("last_login_attempt"));
  if (last && now - last < 3000) return true;
  localStorage.setItem("last_login_attempt", now.toString());
  return false;
};
// Avoid SQL injection by never interpolating user input into queries. Always use parameterized queries or ORM methods that handle this for you.
// utils/inputSecurity.ts
export const validateSafeInput = (value) => {
  if (typeof value !== "string") return false;

  // block obvious injection / XSS payloads
  const dangerousPattern = /(--|\b(select|insert|update|delete|drop|alter)\b|['"`;<>])/i;

  return !dangerousPattern.test(value);
};

