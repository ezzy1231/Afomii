import { create } from "zustand";
import {
  loginRequest,
  logoutRequest,
  signupRequest,
  type AuthUser,
} from "../api/endpoints/auth";
import { tokenCache } from "../api/auth-tokens";

export type AuthStatus = "hydrating" | "signedOut" | "signedIn";

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  resetToSignedOut: () => void;
  hydrate: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "hydrating",
  user: null,

  hydrate: async () => {
    const tokens = await tokenCache.hydrate();
    // M1 keeps a cached copy of the user alongside tokens; profile re-fetch
    // lands with the /users/profile work in FE-3.
    if (!tokens) {
      set({ status: "signedOut", user: null });
      return;
    }
    try {
      const raw = await import("expo-secure-store").then((m) =>
        m.getItemAsync("urbanexplore.user.v1")
      );
      const user = raw ? (JSON.parse(raw) as AuthUser) : null;
      set({ status: user ? "signedIn" : "signedOut", user });
      if (!user) tokenCache.setUserlessSignOut();
    } catch {
      set({ status: "signedOut", user: null });
    }
  },

  login: async (identifier, password) => {
    const res = await loginRequest({ identifier, password });
    tokenCache.set({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });
    void import("expo-secure-store").then((m) =>
      m.setItemAsync("urbanexplore.user.v1", JSON.stringify(res.user))
    );
    set({ status: "signedIn", user: res.user });
  },

  signup: async (email, password) => {
    const res = await signupRequest({ email, password });
    tokenCache.set({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });
    void import("expo-secure-store").then((m) =>
      m.setItemAsync("urbanexplore.user.v1", JSON.stringify(res.user))
    );
    set({ status: "signedIn", user: res.user });
  },

  resetToSignedOut: () => set({ status: "signedOut", user: null }),

  signOut: async () => {
    const rt = tokenCache.refresh;
    if (rt) {
      try {
        await logoutRequest(rt);
      } catch {
        // server-side revocation is best-effort; local state clears regardless
      }
    }
    tokenCache.clear();
    void import("expo-secure-store").then((m) =>
      m.deleteItemAsync("urbanexplore.user.v1")
    );
    set({ status: "signedOut", user: null });
  },
}));

// Remote sign-out (refresh revoked/expired mid-session) mirrors into the store.
tokenCache.onSignOut(() => {
  const state = useAuthStore.getState();
  if (state.status !== "signedOut") state.resetToSignedOut();
});