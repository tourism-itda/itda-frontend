import { Link, useLocation } from "react-router";
import type { UserResponse } from "../lib/auth";

interface AuthActionsProps {
  user: UserResponse | null;
  className?: string;
}

/** 내비 우측 끝 영역: 로그인 상태면 "닉네임님"(→ 마이페이지), 아니면 로그인/회원가입. 데스크탑·모바일 상단 바가 함께 쓴다. */
export function AuthActions({ user, className = "" }: AuthActionsProps) {
  const location = useLocation();
  // 로그인 후 보던 화면으로 돌아오도록 현재 위치를 넘긴다(Login.tsx가 state.from을 사용).
  const loginState = { from: location.pathname + location.search };

  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      {user ? (
        <Link
          to="/app/mypage"
          className="max-w-[140px] sm:max-w-[180px] truncate font-medium text-foreground hover:text-primary transition-colors"
          title="마이페이지"
        >
          {user.nickname}님
        </Link>
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
