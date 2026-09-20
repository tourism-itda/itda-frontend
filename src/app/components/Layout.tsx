import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { MobileNav } from "./MobileNav";
import { DesktopNav } from "./DesktopNav";
import { MobileHeader } from "./MobileHeader";
import { BrandMark } from "./BrandMark";
import { getCurrentUser, getMyProfile } from "../lib/auth";
import { applyDarkMode } from "../lib/theme";
import { useCurrentUser } from "../lib/useCurrentUser";

export default function Layout() {
  const location = useLocation();
  const user = useCurrentUser();

  // 로그인 상태면 서버에 저장된 다크 모드 설정으로 맞춘다. 실패해도 캐시된 설정을 그대로 두면 되므로
  // 조용히 무시한다(비로그인/네트워크 오류로 화면이 바뀌면 안 된다).
  useEffect(() => {
    if (!getCurrentUser()) return;
    let cancelled = false;
    getMyProfile()
      .then((me) => {
        if (!cancelled) applyDarkMode(me.darkMode);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 홈에서 스크롤하면 투명 헤더에 배경이 서서히 생기게 하기 위한 스크롤 감지.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 루트 만들기는 화면 맨 아래에 고정 액션 푸터가 붙는 페이지라 모바일 탭바를 숨긴다(푸터와 겹침 방지).
  const hideMobileNav = location.pathname.startsWith("/app/route-builder/");
  // 매듭 배경 + 투명 헤더의 "이어지는 배경" 연출은 첫 화면(홈)에서만. 나머지는 일반 헤더.
  const isHome = location.pathname === "/app";

  return (
    <div className="min-h-screen bg-transparent">
      {/* 매듭 문양 배경 — 홈에서만, 헤더/바디 경계 없이 우측 상단에 크게 깔리는 워터마크(고정). */}
      {isHome && (
        <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-10 hidden justify-end overflow-hidden lg:flex">
          <img
            src="/images/point.png"
            alt=""
            className="w-[180px] lg:w-[560px] max-w-none -translate-y-[12%] translate-x-[10%] select-none"
          />
        </div>
      )}

      {/* 데스크탑 상단 내비게이션 (≥1025px) — 홈에선 처음엔 투명, 스크롤하면 배경이 서서히 생긴다 */}
      <header
        className={`hidden lg:block sticky top-0 h-16 z-50 transition-colors duration-300 ${
          isHome
            ? scrolled
              ? "bg-background/80 backdrop-blur-md border-b border-border hanji-noise"
              : "bg-transparent border-b border-transparent"
            : "border-b border-border bg-background/95 backdrop-blur-sm hanji-noise"
        }`}
      >
        <DesktopNav user={user} />
      </header>

      {/* 모바일 상단 바 (≤1024px) — 홈에선 sticky로 고정하고 스크롤하면 배경이 서서히 찬다.
          그 외 페이지는 페이지별 sticky 서브헤더와 겹치지 않게 고정하지 않는다. */}
      <header
        className={`lg:hidden transition-colors duration-300 ${
          isHome
            ? `sticky top-0 z-50 ${
                scrolled
                  ? "bg-background/80 backdrop-blur-md border-b border-border hanji-noise"
                  : "bg-transparent border-b border-transparent"
              }`
            : "border-b border-border bg-background hanji-noise"
        }`}
      >
        <MobileHeader user={user} />
      </header>

      {/* 메인 콘텐츠 영역 */}
      {/* 모바일 탭바(h-16)에 가려지는 하단 여백은 푸터의 padding(py-8 + pb-8)이 맡는다. */}
      <main className="min-h-screen">
        <Outlet />
      </main>

      <footer className="border-t border-border/70 bg-background/85 pb-8 backdrop-blur-sm lg:pb-4">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-5 py-8 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="flex items-start gap-3">
            <BrandMark className="h-9 w-9 rounded-[8px]" />
            <div>
              <p className="text-sm font-bold tracking-tight">잇다</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                작품 속 이야기와 여행지를 이어주는 역사 여행 서비스
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs text-muted-foreground lg:items-end">
            <p className="font-semibold text-foreground/80">Data &amp; Sources</p>
            <p>한국관광공사 관광 데이터 · TMDB · 국사편찬위원회 연표</p>
            <p className="text-muted-foreground/70">© 2026 ITDA. Built for historical journeys.</p>
          </div>
        </div>
      </footer>

      {/* 모바일 하단 탭바 (≤1024px) */}
      {!hideMobileNav && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm z-50 hanji-noise">
          <MobileNav user={user} />
        </div>
      )}
    </div>
  );
}
