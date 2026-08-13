import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { MobileNav } from "./MobileNav";
import { DesktopNav } from "./DesktopNav";

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* 데스크탑 상단 내비게이션 (≥1025px) */}
      <header className="hidden lg:block sticky top-0 h-[68px] border-b border-border bg-background/95 backdrop-blur-sm z-50">
        <DesktopNav />
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* 모바일 하단 탭바 (≤1024px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm z-50">
        <MobileNav />
      </div>
    </div>
  );
}
