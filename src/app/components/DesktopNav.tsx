import { NavLink } from "react-router";
import { BrandMark } from "./BrandMark";
import { AuthActions } from "./AuthActions";
import type { UserResponse } from "../lib/auth";

export function DesktopNav({ user }: { user: UserResponse | null }) {
  // 마이페이지는 우측 계정 클러스터(AuthActions)에서 노출하므로 가운데 내비에는 두지 않는다(중복 방지).
  const navItems = [
    { to: "/app", label: "홈", end: true },
    { to: "/app/planner", label: "플래너" },
    { to: "/app/community", label: "커뮤니티" },
  ];

  return (
    <div className="relative max-w-[1280px] mx-auto h-full px-8 flex items-center">
      {/* 로고/브랜드 — 좌측 */}
      <NavLink to="/app" className="flex items-center gap-2.5 h-7">
        <BrandMark className="w-7 h-7 text-sm" />
        <span className="font-heading text-lg font-black text-primary leading-none">잇다 관광</span>
      </NavLink>

      {/* 내비게이션 — 정중앙 */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative py-1 text-sm transition-colors ${
                isActive ? "text-foreground font-bold" : "text-foreground/70 hover:text-foreground"
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

      {/* 로그인/회원가입 또는 사용자 이름 — 우측 끝 */}
      <AuthActions user={user} className="ml-auto gap-4" />
    </div>
  );
}
