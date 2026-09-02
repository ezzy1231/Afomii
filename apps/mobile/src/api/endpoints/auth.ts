import { post } from "../client";

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  role: "CUSTOMER" | "RESTAURANT_ADMIN" | "EVENT_ORGANIZER" | "SYSTEM_ADMIN";
  language: string;
  country: string | null;
};

export type AuthEnvelope = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export function loginRequest(params: { identifier: string; password: string }) {
  const isEmail = params.identifier.includes("@");
  return post<AuthEnvelope>("/auth/login", {
    ...(isEmail ? { email: params.identifier } : { phone: params.identifier }),
    password: params.password,
  });
}

export function signupRequest(params: {
  email: string;
  password: string;
}) {
  return post<AuthEnvelope>("/auth/signup", {
    email: params.email,
    password: params.password,
    role: "CUSTOMER",
    language: "en",
  });
}

export function logoutRequest(refreshToken: string) {
  return post<void>("/auth/logout", { refreshToken });
}
