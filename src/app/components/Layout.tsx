import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { MobileNav } from "./MobileNav";
import { DesktopNav } from "./DesktopNav";
import { getCurrentUser, getMyProfile } from "../lib/auth";
import { applyDarkMode } from "../lib/theme";

export default function Layout() {
  const location = useLocation();

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
    <div className="min-h-screen bg-background">
      {/* 데스크탑 상단 내비게이션 (≥1025px) */}
      <header className="hidden lg:block sticky top-0 h-16 border-b border-border bg-background/95 backdrop-blur-sm z-50 hanji-noise">
        <DesktopNav />
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className={`min-h-screen lg:pb-0 ${hideMobileNav ? "" : "pb-20"}`}>
        <Outlet />
      </main>

      {/* 모바일 하단 탭바 (≤1024px) */}
      {!hideMobileNav && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm z-50 hanji-noise">
          <MobileNav />
        </div>
      )}
    </div>
  );
}
