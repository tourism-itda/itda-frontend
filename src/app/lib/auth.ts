import { apiFetch } from "./api";

// itda-backend(참고용) 실제 DTO는 요청/응답 모두 camelCase이며 Jackson 네이밍 전략 변경이 없다.
// (LoginRequest, SignupRequest, UpdateProfileRequest 등 전부 camelCase 필드명의 record)
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

export interface SessionResponse {
  user: UserResponse | null;
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

export interface SuccessResponse {
  success: boolean;
}

export interface VerifyCodeResponse {
  resetToken: string;
}

export interface UserProfileResponse {
  userId: number;
  loginId: string;
  name: string;
  nickname: string;
  email: string;
  profileUrl: string | null;
  darkMode: boolean;
  language: string;
  notificationEnabled: boolean;
}

export interface UpdateProfileRequest {
  nickname?: string;
  profileUrl?: string;
  darkMode?: boolean;
  language?: string;
  notificationEnabled?: boolean;
}

// itda-backend에는 카카오 콜백 라우트가 없어 배포 시 경로가 바뀔 수 있으므로 환경변수로 분리한다.
const KAKAO_CALLBACK_PATH = import.meta.env.VITE_KAKAO_CALLBACK_PATH ?? "/api/auth/kakao/callback";

const ACCESS_TOKEN_KEY = "accessToken";
const USER_KEY = "user";

function persistAuth(auth: AuthResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// 앱 진입 시 자동 로그인 분기용. user가 null이면(토큰 없음/만료) 로컬에 남은 인증 정보를 정리한다.
export async function getSession(): Promise<SessionResponse> {
  const session = await apiFetch<SessionResponse>("/api/auth/session");
  if (session.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  } else {
    clearAuth();
  }
  return session;
}

export async function login(loginId: string, password: string): Promise<AuthResponse> {
  const auth = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ loginId, password }),
  });
  persistAuth(auth);
  return auth;
}

// itda-backend의 카카오 로그인은 POST /api/auth/oauth/kakao {auth_code}가 아니라
// GET /api/auth/kakao/callback?code=... (AuthController.kakaoCallback)이다. 실제 컨트롤러 기준으로 맞춤.
export async function loginWithKakao(code: string): Promise<AuthResponse> {
  const auth = await apiFetch<AuthResponse>(
    `${KAKAO_CALLBACK_PATH}?code=${encodeURIComponent(code)}`,
  );
  persistAuth(auth);
  return auth;
}

export async function checkLoginIdAvailable(loginId: string): Promise<boolean> {
  const res = await apiFetch<{ available: boolean }>(
    `/api/users/check-login-id?loginId=${encodeURIComponent(loginId)}`,
  );
  return res.available;
}

export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const res = await apiFetch<{ available: boolean }>(
    `/api/users/check-nickname?nickname=${encodeURIComponent(nickname)}`,
  );
  return res.available;
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  // itda-backend의 /api/auth/signup은 LoginResponse(accessToken + user)를 바로 반환한다
  // (AuthController.signup). 별도 재로그인 없이 응답에서 바로 토큰을 저장한다.
  const auth = await apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
  persistAuth(auth);
  return auth;
}

export function requestPasswordReset(loginId: string, email: string): Promise<SuccessResponse> {
  return apiFetch<SuccessResponse>("/api/auth/password/reset-request", {
    method: "POST",
    body: JSON.stringify({ loginId, email }),
  });
}

export function verifyPasswordResetCode(loginId: string, code: string): Promise<VerifyCodeResponse> {
  return apiFetch<VerifyCodeResponse>("/api/auth/password/verify-code", {
    method: "POST",
    body: JSON.stringify({ loginId, code }),
  });
}

export function resetPassword(resetToken: string, newPassword: string): Promise<SuccessResponse> {
  return apiFetch<SuccessResponse>("/api/auth/password/reset", {
    method: "PATCH",
    body: JSON.stringify({ resetToken, newPassword }),
  });
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<SuccessResponse>("/api/auth/logout", { method: "POST" });
  } finally {
    clearAuth();
  }
}

export function getMyProfile(): Promise<UserProfileResponse> {
  return apiFetch<UserProfileResponse>("/api/users/me");
}

// 백엔드는 UpdateProfileResponse(UserProfileResponse user)로 { user: {...} } 래핑해 응답한다
// (UserController.updateMyProfile). 실코드/실호출로 재검증됨 — 언래핑해서 호출부에 넘긴다.
export async function updateMyProfile(data: UpdateProfileRequest): Promise<UserProfileResponse> {
  const res = await apiFetch<{ user: UserProfileResponse }>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.user;
}

export async function deleteMyAccount(): Promise<SuccessResponse> {
  const res = await apiFetch<SuccessResponse>("/api/users/me", { method: "DELETE" });
  clearAuth();
  return res;
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
