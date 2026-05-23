const ADMIN_EMAILS = [
  "sheywebstudio@gmail.com",
  "brown.anthony89@yahoo.com",
] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return (ADMIN_EMAILS as readonly string[]).includes(normalized);
}
