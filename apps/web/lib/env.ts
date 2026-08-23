export function readEnv(name: string): string | undefined {
  return trimEnv(process.env[name]);
}

export function trimEnv(value: string | undefined): string | undefined {
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
