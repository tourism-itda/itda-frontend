import { Link, useLocation } from "react-router";
import { LogOut } from "lucide-react";
import { logout } from "../lib/auth";
import type { UserResponse } from "../lib/auth";

interface AuthActionsProps {
  user: UserResponse | null;
  className?: string;
}

/**
 * 내비 우측 끝 영역.
 * - 로그인 상태: "닉네임님"(→ 마이페이지) + 로그아웃 버튼.
 * - 비로그인: 로그인 / 회원가입.
 * 데스크탑·모바일 상단 바가 함께 쓴다.
 */
export function AuthActions({ user, className = "" }: AuthActionsProps) {
  const location = useLocation();
  // 로그인 후 보던 화면으로 돌아오도록 현재 위치를 넘긴다(Login.tsx가 state.from을 사용).
  const loginState = { from: location.pathname + location.search };

  // user 상태는 useCurrentUser의 로컬 캐시라 이 컴포넌트에서 직접 바꿀 수 없다. 로그아웃 후에는
  // 홈으로 전체 이동(hard navigation)해 헤더 전체가 비로그인 상태로 새로 그려지게 한다.
  async function handleLogout() {
    await logout();
    window.location.assign("/app");
  }

  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      {user ? (
        <>
          <Link
            to="/app/mypage"
            className="max-w-[120px] sm:max-w-[160px] truncate font-medium text-foreground hover:text-primary transition-colors"
            title="마이페이지"
          >
            {user.nickname}님
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            state={loginState}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            로그인
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-primary px-3.5 py-1.5 font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            회원가입
          </Link>
        </>
      )}
    </div>
  );
}
