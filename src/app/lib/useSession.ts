import { useEffect, useState } from "react";
import { getSession, UserResponse } from "./auth";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "error";

export interface SessionResult {
  status: SessionStatus;
  user: UserResponse | null;
}

/**
 * 앱 진입 시 GET /api/auth/session으로 로그인 여부를 확인하는 훅.
 * 자동 로그인 분기(스플래시 → /app 또는 /login)에 사용한다.
 */
export function useSession(): SessionResult {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSession()
      .then((session) => {
        if (cancelled) return;
        setUser(session.user);
        setStatus(session.user ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, user };
}
