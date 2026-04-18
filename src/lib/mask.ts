// Utilities for masking contact information until a hire relationship is confirmed.

export function maskPhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "•••••";
  const start = digits.slice(0, 3);
  const end = digits.slice(-2);
  return `${start}${"•".repeat(Math.max(4, digits.length - 5))}${end}`;
}

export function maskEmail(email?: string | null): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return "•••••";
  const visible = local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(3, local.length - 2))}@${domain}`;
}
