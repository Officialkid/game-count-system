// lib/password-validator.ts
// Comprehensive password validation with strength checking

export interface PasswordRequirement {
  regex: RegExp;
  message: string;
  met: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  requirements: PasswordRequirement[];
  errors: string[];
}

// Common passwords to reject (top 100 most common)
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', '1234', '12345', '123456789',
  'qwerty', 'abc123', 'password1', '111111', '123123', 'admin', 'letmein',
  'welcome', 'monkey', '1234567', 'password!', 'qwerty123', 'welcome123',
  'admin123', 'root', 'toor', 'pass', 'test', 'guest', 'oracle', 'mysql',
]);

export const passwordRequirements: Omit<PasswordRequirement, 'met'>[] = [
  {
    regex: /.{8,}/,
    message: 'At least 8 characters long',
  },
  {
    regex: /[A-Z]/,
    message: 'At least one uppercase letter',
  },
  {
    regex: /[a-z]/,
    message: 'At least one lowercase letter',
  },
  {
    regex: /[0-9]/,
    message: 'At least one number',
  },
  {
    regex: /[^A-Za-z0-9]/,
    message: 'At least one special character (!@#$%^&*)',
  },
];

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // Check each requirement
  const requirements: PasswordRequirement[] = passwordRequirements.map(req => ({
    ...req,
    met: req.regex.test(password),
  }));

  // Collect unmet requirements
  requirements.forEach(req => {
    if (!req.met) {
      errors.push(req.message);
    }
  });

  // Check for common passwords
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowerPassword)) {
    errors.push('Password is too common. Please choose a more unique password.');
  }

  // Check if password contains sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    errors.push('Avoid sequential characters (e.g., "abc", "123")');
  }

  // Calculate password strength
  const metCount = requirements.filter(r => r.met).length;
  const hasNoCommonIssues = !COMMON_PASSWORDS.has(lowerPassword);
  const isLongEnough = password.length >= 12;

  let strength: 'weak' | 'medium' | 'strong';
  
  if (metCount === 5 && hasNoCommonIssues && isLongEnough) {
    strength = 'strong';
  } else if (metCount >= 4 && hasNoCommonIssues) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  return {
    isValid: errors.length === 0,
    strength,
    requirements,
    errors,
  };
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-600';
    case 'medium':
      return 'text-yellow-600';
    case 'strong':
      return 'text-green-600';
  }
}

export function getPasswordStrengthBgColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-green-500';
  }
}
