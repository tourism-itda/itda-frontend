import { NavLink } from "react-router";
import { BrandMark } from "./BrandMark";

export function DesktopNav() {
  const navItems = [
    { to: "/app", label: "홈", end: true },
    { to: "/app/planner", label: "플래너" },
    { to: "/app/community", label: "커뮤니티" },
    { to: "/app/mypage", label: "마이페이지" },
  ];

  return (
    <div className="relative max-w-[1280px] mx-auto h-full px-8 flex items-center">
      {/* 로고/브랜드 — 좌측 */}
      <div className="flex items-center gap-2.5 h-7">
        <BrandMark className="w-7 h-7 text-sm" />
        <span className="font-heading text-lg font-black text-primary leading-none">잇다 관광</span>
      </div>

      {/* 내비게이션 — 정중앙 */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative py-1 text-sm transition-colors ${
                isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {item.label}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-[1px] h-0.5 bg-gold" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
