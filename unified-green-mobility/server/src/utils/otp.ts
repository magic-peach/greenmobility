/**
 * OTP (One-Time Password) generation and verification utilities
 */

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Verify OTP code (exact match)
 */
export function verifyOTP(inputOTP: string, storedOTP: string): boolean {
  return inputOTP === storedOTP;
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(createdAt: Date, expiryMinutes: number = 10): boolean {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes > expiryMinutes;
}

/**
 * Generate OTP with expiry timestamp
 */
export function generateOTPWithExpiry(expiryMinutes: number = 10): {
  code: string;
  expiresAt: Date;
} {
  const code = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
  return { code, expiresAt };
}

