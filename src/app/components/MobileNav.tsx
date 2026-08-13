import { NavLink } from "react-router";
import { Home, Calendar, Users, User } from "lucide-react";

export function MobileNav() {
  const navItems = [
    { to: "/app", label: "홈", icon: Home, end: true },
    { to: "/app/planner", label: "플래너", icon: Calendar },
    { to: "/app/community", label: "커뮤니티", icon: Users },
    { to: "/app/mypage", label: "마이페이지", icon: User },
  ];

  return (
    <nav className="flex items-center h-16 px-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          {({ isActive }) => (
            <>
              {/* active 탭: 아이콘 배경 pill */}
              <div className={`flex items-center justify-center w-10 h-6 rounded-full transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                <item.icon
                  className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span className={`text-sm transition-colors ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
