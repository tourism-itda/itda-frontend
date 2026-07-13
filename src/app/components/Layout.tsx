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
      {/* 데스크탑 사이드바 (≥1025px) */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 border-r border-border bg-card z-50">
        <DesktopNav />
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* 모바일 하단 탭바 (≤1024px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm z-50">
        <MobileNav />
      </div>
    </div>
  );
}
