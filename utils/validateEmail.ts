/**
 * Validates if the provided email address is in a correct format.
 *
 * @param email - The email address to validate.
 * @returns True if the email address is valid, false otherwise.
 */
function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
