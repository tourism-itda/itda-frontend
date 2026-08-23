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

// 카카오 로그인은 현재 프론트에서 연결할 수 없다(2026-08-22 dev 브랜치 기준, 실제 소스로 확인함).
//
// - 명세서엔 POST /auth/oauth/kakao로 돼있지만 실제로는 그런 경로가 없다.
// - 백엔드에 카카오 인가 URL로 리다이렉트해주는 엔드포인트도 없다(Spring Security의 표준
//   oauth2Login/ClientRegistration도 안 씀). 즉 프론트가 직접 카카오 인가 URL
//   (https://kauth.kakao.com/oauth/authorize?client_id=...&redirect_uri=...)로 이동시켜야 한다.
// - application.yml의 kakao.redirect-uri가 "http://localhost:8080/api/auth/kakao/callback"으로
//   고정돼 있다(프로필 override 없음). 카카오 토큰 교환 시 이 값이 그대로 쓰이므로, 인가 요청의
//   redirect_uri도 반드시 이 값과 정확히 일치해야 한다 — 즉 카카오 동의 후 브라우저는 프론트가
//   아니라 백엔드(localhost:8080) 주소로 직접 리다이렉트된다.
// - 그런데 GET /api/auth/kakao/callback(AuthController.kakaoCallback)은 리다이렉트가 아니라
//   LoginResponse({accessToken, user}) JSON을 그대로 반환한다. 프론트로 돌아오는 리다이렉트나
//   토큰 전달 로직이 전혀 없다.
// - 결과: 카카오 동의를 마치면 사용자는 SPA로 못 돌아오고 백엔드가 반환한 raw JSON 화면에서
//   멈춘다. 이건 프론트 코드로 고칠 수 없는 백엔드 쪽 문제다(itda-backend는 읽기 전용).
//   고치려면 kakaoCallback이 토큰을 쿼리파라미터 등으로 실어 프론트 URL로 302 리다이렉트하도록
//   바뀌어야 한다. 그 전까지 Login.tsx의 카카오 버튼은 "준비 중" 안내만 띄운다.
//
// (예전에 여기 있던 loginWithKakao(code)는 "프론트 라우트가 code를 받아 fetch로 콜백을 부른다"고
// 가정하고 짜여 있었는데, 위 이유로 그 시나리오 자체가 발생하지 않아 도달 불가능한 코드였다.)

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
