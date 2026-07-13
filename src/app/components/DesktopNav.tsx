import { NavLink } from "react-router";
import { Home, Calendar, Users, User, Map } from "lucide-react";

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
        <div className="flex items-center gap-2">
          <Map className="w-6 h-6 text-primary" />
          <h1 className="text-xl">역사여행</h1>
        </div>
      </div>

      {/* 내비게이션 메뉴 */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
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
