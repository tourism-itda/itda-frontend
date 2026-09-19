import { useEffect, useState } from "react";
import { getCurrentUser, getSession, UserResponse } from "./auth";

/**
 * 내비게이션의 로그인 표시용 훅.
 * 로컬 user 캐시로 첫 렌더부터 바로 그리고(깜빡임 방지), 서버 세션으로 다시 확인해 만료된 로그인은
 * 비로그인(null)으로 바꾼다. 네트워크 오류일 땐 캐시를 그대로 둔다.
 */
export function useCurrentUser(): UserResponse | null {
  const [user, setUser] = useState<UserResponse | null>(() => getCurrentUser());

  useEffect(() => {
    let cancelled = false;
    getSession()
      .then((session) => {
        if (!cancelled) setUser(session.user);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return user;
}
