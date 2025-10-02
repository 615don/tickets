/**
 * Password validation utilities for frontend
 * Should match backend validation in backend/src/utils/passwordValidation.js
 */

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

/**
 * Common weak passwords to reject
 * This is a small sample - matches backend list
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'passw0rd', 'shadow', '123123', '654321',
  'superman', 'qazwsx', 'michael', 'football', 'welcome',
  'admin', 'admin123', 'root', 'toor', 'pass', 'test'
]);

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Validation result with isValid flag and error messages
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Check if password exists
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required']
    };
  }

  // Check length
  if (password.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters long`);
  }

  if (password.length > MAX_LENGTH) {
    errors.push(`Password must be no more than ${MAX_LENGTH} characters long`);
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
  }

  // Check against common passwords (case insensitive)
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more unique password');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gets a human-readable error message from validation errors
 * @param errors - Array of error messages
 * @returns Combined error message
 */
export function getPasswordErrorMessage(errors: string[]): string {
  if (errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    return errors[0];
  }

  return 'Password requirements: ' + errors.join('; ');
}

/**
 * Get password strength as a percentage (for progress indicators)
 * @param password - Password to check
 * @returns Strength percentage (0-100)
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;

  let strength = 0;
  const checks = [
    password.length >= MIN_LENGTH,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    !COMMON_PASSWORDS.has(password.toLowerCase()),
    password.length >= 12, // Bonus for longer passwords
  ];

  checks.forEach(check => {
    if (check) strength += 100 / checks.length;
  });

  return Math.min(100, Math.round(strength));
}
