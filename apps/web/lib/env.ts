export function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;

  // Hosting dashboards sometimes receive quoted values copied from .env files.
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }

  return trimmed;
}
