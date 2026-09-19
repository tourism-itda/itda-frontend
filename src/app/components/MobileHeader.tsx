import { NavLink } from "react-router";
import { BrandMark } from "./BrandMark";
import { AuthActions } from "./AuthActions";
import type { UserResponse } from "../lib/auth";

// 페이지들이 자체 sticky 서브헤더(top-0)를 쓰기 때문에 이 바는 고정하지 않는다 — 스크롤하면 같이 올라가고,
// 서브헤더가 그 자리에 붙는다.
export function MobileHeader({ user }: { user: UserResponse | null }) {
  return (
    <div className="h-14 px-4 flex items-center justify-between gap-3">
      <NavLink to="/app" className="flex items-center gap-2 shrink-0">
        <BrandMark className="w-7 h-7 text-sm" />
        <span className="font-heading text-base font-black text-primary leading-none">잇다 관광</span>
      </NavLink>
      <AuthActions user={user} className="min-w-0" />
    </div>
  );
}
