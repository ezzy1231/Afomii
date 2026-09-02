import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "urbanexplore.auth.v1";

type TokenPair = { accessToken: string; refreshToken: string };

/**
 * Single source of truth for tokens:
 * - synchronous in-memory mirror (axios interceptors need sync access)
 * - SecureStore persistence (Keychain/Keystore)
 * - tiny event bus so a failed remote refresh can force a UI sign-out
 */
class TokenCache {
  access: string | null = null;
  refresh: string | null = null;

  private listeners = new Set<() => void>();

  onSignOut(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emitSignedOut() {
    for (const cb of this.listeners) cb();
  }

  set(tokens: TokenPair) {
    this.access = tokens.accessToken;
    this.refresh = tokens.refreshToken;
    void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(tokens));
  }

  setUserlessSignOut() {
    this.clear();
    this.emitSignedOut();
  }

  clear() {
    this.access = null;
    this.refresh = null;
    void SecureStore.deleteItemAsync(STORAGE_KEY);
  }

  async hydrate(): Promise<TokenPair | null> {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as TokenPair;
      if (parsed.accessToken && parsed.refreshToken) {
        this.access = parsed.accessToken;
        this.refresh = parsed.refreshToken;
        return parsed;
      }
    } catch {
      // corrupted storage - treat as signed out
    }
    return null;
  }
}

export const tokenCache = new TokenCache();
