import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "./BrandMark";

/**
 * 로그인/회원가입/비밀번호 찾기 공통 셸.
 * 예전엔 스플래시 같은 대형 브랜드 패널이 화면을 채워 "첫 진입 화면"처럼 보였지만,
 * 이제는 앱 상단 헤더(로고 + 홈으로) 아래에 폼 카드 하나만 두어 "앱 안의 한 페이지"처럼 보이게 한다.
 * 페이지별로 달라지는 내용(뒤로가기 링크, 타이틀, 폼)은 children으로 넘긴다.
 */
export function AuthLayout({ children, size = "sm" }: { children: ReactNode; size?: "sm" | "md" }) {
  const maxWidthClass = size === "md" ? "max-w-md" : "max-w-sm";
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 앱 상단 헤더 — 로고(→홈) + 홈으로 돌아가기 */}
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50 hanji-noise">
        <div className="max-w-[1280px] mx-auto h-full px-4 lg:px-8 flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-2.5">
            <BrandMark className="w-7 h-7 text-sm" />
            <span className="font-heading text-lg font-black text-primary leading-none">잇다 관광</span>
          </Link>
          <Link
            to="/app"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로
          </Link>
        </div>
      </header>

      {/* 폼 영역 — 일반 페이지 카드 */}
      <main className="flex-1 flex items-start justify-center px-4 py-10 lg:py-16">
        <div
          className={`w-full ${maxWidthClass} bg-card rounded-2xl border border-border/60 shadow-[var(--shadow-md)] p-6 lg:p-8`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
