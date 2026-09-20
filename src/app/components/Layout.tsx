import { useEffect } from "react";
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

  // 루트 만들기는 화면 맨 아래에 고정 액션 푸터가 붙는 페이지라 모바일 탭바를 숨긴다(푸터와 겹침 방지).
  const hideMobileNav = location.pathname.startsWith("/app/route-builder/");

  return (
    <div className="min-h-screen bg-transparent">
      {/* 데스크탑 상단 내비게이션 (≥1025px) */}
      <header className="hidden lg:block sticky top-0 h-16 border-b border-border bg-background/95 backdrop-blur-sm z-50 hanji-noise">
        <DesktopNav user={user} />
      </header>

      {/* 모바일 상단 바 (≤1024px) — 스크롤과 함께 올라간다(페이지별 sticky 서브헤더와 겹치지 않게 고정하지 않음) */}
      <header className="lg:hidden border-b border-border bg-background hanji-noise">
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
