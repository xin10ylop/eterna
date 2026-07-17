/** Input validation. Small, explicit validators, no schema library needed
 *  yet; when Supabase lands these become the client side of shared zod
 *  schemas. Every validator returns `null` when valid, or a user-readable
 *  message describing exactly how to fix the input. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return 'Enter your email address.';
  if (!EMAIL_RE.test(v)) return 'That does not look like an email address.';
  return null;
}

export function validatePassword(pw: string): string | null {
  if (!pw) return 'Create a password.';
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return 'Use letters and at least one number.';
  return null;
}

export function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) score++;
  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}

export function validateName(name: string, field: string): string | null {
  const v = name.trim();
  if (!v) return `Enter your ${field}.`;
  if (v.length > 60) return `${field[0]?.toUpperCase()}${field.slice(1)} is too long.`;
  return null;
}

export function validateCode(code: string): string | null {
  if (code.length !== 6 || !/^\d{6}$/.test(code)) return 'Enter the 6-digit code.';
  return null;
}

/** Height 120–220 cm, weight 35–200 kg, generous adult ranges. */
export function validateHeightCm(v: number): string | null {
  if (!Number.isFinite(v) || v < 120 || v > 220) return 'Enter a height between 120 and 220 cm.';
  return null;
}

export function validateWeightKg(v: number): string | null {
  if (!Number.isFinite(v) || v < 35 || v > 200) return 'Enter a weight between 35 and 200 kg.';
  return null;
}
