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
  // 백엔드의 /api/auth/signup은 UserResponse만 반환하고 토큰을 발급하지 않으므로,
  // 가입 직후 로그인을 호출해 AuthResponse(토큰 포함)를 받아온다.
  await apiFetch<UserResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return login(data.loginId, data.password);
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
