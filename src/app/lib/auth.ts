import { apiFetch } from "./api";

export interface UserResponse {
  userId: number;
  loginId: string;
  nickname: string;
  email: string;
  profileUrl: string | null;
}

interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}

export interface SignupRequest {
  loginId: string;
  password: string;
  name: string;
  nickname: string;
  email: string;
  birthDate: string;
  agreedToTerms: boolean;
}

const ACCESS_TOKEN_KEY = "accessToken";
const USER_KEY = "user";

function persistAuth(auth: AuthResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export async function login(loginId: string, password: string): Promise<AuthResponse> {
  const auth = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ loginId, password }),
  });
  persistAuth(auth);
  return auth;
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const auth = await apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
  persistAuth(auth);
  return auth;
}

export function logout(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCurrentUser(): UserResponse | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserResponse;
  } catch {
    return null;
  }
}
