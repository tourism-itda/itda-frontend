import { NavLink } from "react-router";
import { Home, Calendar, Users, User } from "lucide-react";
import { BrandMark } from "./BrandMark";

export function DesktopNav() {
  const navItems = [
    { to: "/app", label: "홈", icon: Home, end: true },
    { to: "/app/planner", label: "플래너", icon: Calendar },
    { to: "/app/community", label: "커뮤니티", icon: Users },
    { to: "/app/mypage", label: "마이페이지", icon: User },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 로고/브랜드 */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <h1 className="text-lg font-bold tracking-tight">역사여행</h1>
        </div>
      </div>

      {/* 내비게이션 메뉴 */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
