const BASE_URL = import.meta.env.VITE_API_URL ?? "";

const ACCESS_TOKEN_KEY = "accessToken";

// "자동 로그인" 체크 여부에 따라 토큰을 localStorage(브라우저를 껐다 켜도 유지) 또는
// sessionStorage(탭/브라우저를 닫으면 삭제)에 저장한다. 저장 전 양쪽을 모두 지워서
// 반대쪽 storage에 이전 토큰이 남아있지 않게 한다.
export function saveToken(token: string, rememberMe: boolean): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  (rememberMe ? localStorage : sessionStorage).setItem(ACCESS_TOKEN_KEY, token);
}

// localStorage(자동 로그인)를 먼저 보고, 없으면 sessionStorage(탭 한정 로그인)를 본다.
export function getToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

// 현재 토큰이 localStorage(자동 로그인)에 있는지 여부. user 캐시(auth.ts)를 토큰과
// 같은 storage에 맞춰 두는 데 쓴다.
export function isTokenRemembered(): boolean {
  return localStorage.getItem(ACCESS_TOKEN_KEY) !== null;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `요청에 실패했습니다. (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // 응답 body가 JSON이 아닌 경우 기본 메시지 사용
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
