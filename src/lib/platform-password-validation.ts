const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;
const NUMBER_PATTERN = /\d/;
const CAPITAL_PATTERN = /[A-Z]/;

/** Shared platform password policy (signup + reset). */
export function validatePlatformSignupPassword(password: string): string | null {
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (!CAPITAL_PATTERN.test(password)) {
    return "Password must include at least one capital letter.";
  }

  if (!NUMBER_PATTERN.test(password)) {
    return "Password must include at least one number.";
  }

  if (!SPECIAL_CHARACTER_PATTERN.test(password)) {
    return "Password must include at least one special character.";
  }

  return null;
}

export function validatePlatformSignupPasswordConfirmation(
  password: string,
  confirmPassword: string,
): string | null {
  const passwordError = validatePlatformSignupPassword(password);
  if (passwordError) {
    return passwordError;
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

export const PLATFORM_PASSWORD_POLICY_HINT =
  "At least 6 characters, with a capital letter, a number, and a special character.";
