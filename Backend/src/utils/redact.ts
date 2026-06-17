// Basic PII redaction helpers for logs/audit meta

type AnyObj = Record<string, any>;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// Simple phone: sequences of 8-15 digits possibly with separators
const PHONE_RE = /\b(?:\+?\d[\s-]?){8,15}\b/g;
// IBAN-like
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi;
// National ID generic (10-18 digits/alnum)
const NID_RE = /\b[0-9A-Z]{10,18}\b/gi;

export function redactPII(input: any): any {
  if (input == null) return input;
  if (typeof input === 'string') {
    let s = input;
    s = s.replace(EMAIL_RE, '***@***');
    s = s.replace(IBAN_RE, '***REDACTED***');
    s = s.replace(NID_RE, (m) => (m.includes('@') ? m : '***REDACTED***'));
    s = s.replace(PHONE_RE, '***REDACTED***');
    return s;
  }
  if (Array.isArray(input)) return input.map((v) => redactPII(v));
  if (typeof input === 'object') {
    const out: AnyObj = Array.isArray(input) ? [] : {} as AnyObj;
    for (const [k, v] of Object.entries(input as AnyObj)) {
      out[k] = redactPII(v);
    }
    return out;
  }
  return input;
}

export function redactRequestSnapshot(req: any) {
  try {
    const headersSafe = { ...req.headers };
    if (headersSafe.authorization) headersSafe.authorization = '***REDACTED***';
    return {
      path: req.path,
      method: req.method,
      query: redactPII(req.query),
      bodyRedacted: redactPII(req.body),
      headersSafe,
    };
  } catch {
    return { path: req?.path, method: req?.method };
  }
}

