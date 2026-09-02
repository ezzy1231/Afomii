import axios from "axios";
import { tokenCache } from "./auth-tokens";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000/api/v1";

export class ApiError extends Error {
  statusCode: number;
  code: string;
  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  if (tokenCache.access) {
    config.headers.Authorization = `Bearer ${tokenCache.access}`;
  }
  return config;
});

// Single-flight refresh: one promise shared by every 401 arriving mid-refresh.
let refreshInFlight: Promise<string | null> | null = null;

function normalizeError(err: unknown): ApiError {
  const e = err as { response?: { data?: { message?: string; statusCode?: number; code?: string }; status?: number }; message?: string };
  const payload = e?.response?.data;
  return new ApiError(
    payload?.message ?? e?.message ?? "Network request failed",
    payload?.statusCode ?? e?.response?.status ?? 0,
    payload?.code ?? "UNKNOWN"
  );
}

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const original = error.config ?? {};
    const status = error.response?.status as number | undefined;
    const url: string = original?.url ?? "";

    const canRefresh =
      status === 401 &&
      !original._retry &&
      tokenCache.refresh &&
      !url.includes("/auth/");

    if (canRefresh) {
      original._retry = true;
      refreshInFlight =
        refreshInFlight ??
        axios
          .post(`${API_URL}/auth/refresh`, {
            refreshToken: tokenCache.refresh,
          })
          .then((res) => {
            const tokens = res.data as {
              accessToken: string;
              refreshToken: string;
            };
            tokenCache.set(tokens);
            return tokens.accessToken;
          })
          .catch(() => {
            tokenCache.setUserlessSignOut();
            return null;
          })
          .finally(() => {
            refreshInFlight = null;
          });

      const access = await refreshInFlight;
      if (access) {
        original.headers = { ...original.headers, Authorization: `Bearer ${access}` };
        return api(original);
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export const get = <T>(url: string): Promise<T> => api.get(url) as Promise<T>;
export const post = <T>(url: string, body?: unknown): Promise<T> =>
  api.post(url, body ?? {}) as Promise<T>;
export const patch = <T>(url: string, body?: unknown): Promise<T> =>
  api.patch(url, body ?? {}) as Promise<T>;
