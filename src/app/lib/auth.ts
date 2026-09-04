import { apiFetch, ApiError, saveToken, clearToken, isTokenRemembered } from "./api";

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

export interface PresignedUrlResponse {
  presignedUrl: string;
  publicUrl: string;
}

const USER_KEY = "user";

// user 캐시는 토큰과 같은 storage에 함께 둔다. 토큰이 sessionStorage에 있는데 user만
// localStorage에 남으면, 탭을 닫아도 로그인 정보 일부가 계속 남는 문제가 생긴다.
function saveUser(user: UserResponse, rememberMe: boolean) {
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
  (rememberMe ? localStorage : sessionStorage).setItem(USER_KEY, JSON.stringify(user));
}

function persistAuth(auth: AuthResponse, rememberMe: boolean) {
  saveToken(auth.accessToken, rememberMe);
  saveUser(auth.user, rememberMe);
}

function clearAuth() {
  clearToken();
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// 앱 진입 시 자동 로그인 분기용. user가 null이면(토큰 없음/만료) 로컬에 남은 인증 정보를 정리한다.
export async function getSession(): Promise<SessionResponse> {
  const session = await apiFetch<SessionResponse>("/api/auth/session");
  if (session.user) {
    // user 캐시를 토큰이 실제로 들어있는 storage(자동 로그인 여부)에 맞춰 갱신한다.
    saveUser(session.user, isTokenRemembered());
  } else {
    clearAuth();
  }
  return session;
}

export async function login(loginId: string, password: string, rememberMe: boolean): Promise<AuthResponse> {
  const auth = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ loginId, password }),
  });
  persistAuth(auth, rememberMe);
  return auth;
}

// 카카오 로그인: 백엔드가 POST /api/auth/kakao({ code }) 방식으로 확정했다(AuthController.kakaoLogin,
// 실제 소스로 재검증함). 응답은 일반 로그인과 동일한 LoginResponse({accessToken, user})라 저장 로직도 동일하게 재사용한다.
// 카카오 로그인 화면엔 "자동 로그인" 체크박스가 없어, 기존 동작 그대로 항상 localStorage에 저장한다.
export async function loginWithKakao(code: string): Promise<AuthResponse> {
  const auth = await apiFetch<AuthResponse>("/api/auth/kakao", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  persistAuth(auth, true);
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
  persistAuth(auth, true);
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
  const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserResponse;
  } catch {
    return null;
  }
}

// UserController.getAvatarPresignedUrl: GET /api/users/me/avatar/presigned?contentType=...
// -> PresignedUrlResponse(presignedUrl, publicUrl). 실제 소스로 필드명 재검증함.
export function getAvatarPresignedUrl(contentType: string): Promise<PresignedUrlResponse> {
  return apiFetch<PresignedUrlResponse>(
    `/api/users/me/avatar/presigned?contentType=${encodeURIComponent(contentType)}`,
  );
}

// S3Service.generatePresignedUrl은 PutObjectRequest에 지정된 contentType으로만 서명되므로,
// PUT 요청의 Content-Type은 반드시 presigned URL을 발급받을 때 넘긴 값과 동일해야 한다.
// apiFetch는 항상 Authorization/Content-Type: application/json을 붙이므로 여기서는 쓸 수 없다 —
// S3는 우리 백엔드가 아니라 서명된 요청만 검증하며, Authorization 헤더가 섞이면 서명 불일치로 거부된다.
// S3가 돌려주는 상태코드(예: 403)는 우리 백엔드 세션과 무관하므로 ApiError가 아닌 일반 Error로
// 던진다 — 호출부에서 401/403이면 /login으로 보내는 공용 처리에 걸리지 않게 하기 위함.
export async function uploadAvatarFile(presignedUrl: string, file: File): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error("이미지 업로드에 실패했어요.");
  }
}
