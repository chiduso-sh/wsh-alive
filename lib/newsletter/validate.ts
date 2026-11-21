// Shared by the subscribe API and the form, so both reject the same input.

export const MAX_NAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 254;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

export type Subscriber = { name: string; email: string };

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// Returns the cleaned subscriber, or an error message safe to show the user.
export function validateSubscriber(input: { name?: unknown; email?: unknown }): Subscriber | string {
  if (typeof input.name !== "string" || typeof input.email !== "string") return "Name and email are required.";

  // Collapse whitespace and drop characters that could break email headers or markup.
  const name = input.name.replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim();
  const email = normalizeEmail(input.email);

  if (!name) return "Please tell us your name.";
  if (name.length > MAX_NAME_LENGTH) return `Please keep your name under ${MAX_NAME_LENGTH} characters.`;
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL.test(email)) return "That email address doesn't look right.";
  return { name, email };
}
