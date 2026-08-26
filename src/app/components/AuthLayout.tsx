import type { ReactNode } from "react";
import { Compass, Route, Users } from "lucide-react";
import { BrandMark } from "./BrandMark";

const highlights = [
  { icon: Compass, title: "배경지 탐험", desc: "드라마·영화 속 장소를 실제 지도 위에서 확인해요" },
  { icon: Route, title: "여행 코스 추천", desc: "관심 시대와 인물만 고르면 코스를 짜드려요" },
  { icon: Users, title: "커뮤니티 공유", desc: "다른 여행자가 만든 루트를 가져와 바로 떠나요" },
];

const brandGradient = { background: "linear-gradient(160deg, var(--primary-700), var(--primary-500))" };

/**
 * 로그인/회원가입/비밀번호 찾기 공통 셸.
 * - 데스크탑(lg~): 좌측 브랜드 패널 + 우측 폼 카드의 2단 레이아웃.
 * - 모바일(~lg): 상단 브랜드 배너 + 그 아래로 겹쳐 올라오는 폼 바텀시트.
 * 페이지별로 달라지는 내용(뒤로가기 링크, 타이틀, 폼)은 children으로 넘긴다.
 */
export function AuthLayout({ children, size = "sm" }: { children: ReactNode; size?: "sm" | "md" }) {
  const maxWidthClass = size === "md" ? "lg:max-w-md" : "lg:max-w-sm";
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* 데스크탑 좌측 브랜드 패널 */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-2/5 flex-col justify-between p-14 relative overflow-hidden hanji-noise shrink-0"
        style={brandGradient}
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-2.5">
          <BrandMark className="w-9 h-9 text-lg" />
          <span className="font-heading text-xl font-black text-white">잇다 관광</span>
        </div>

        <div className="relative">
          <p className="text-xs tracking-[0.2em] text-white/70 font-bold uppercase mb-3">Discover Korean History</p>
          <h1 className="font-heading text-white text-[40px] leading-[1.15] font-black mb-4">
            사극 속 이야기를
            <br />
            여행으로 이어보세요
          </h1>
          <p className="text-white/70 text-base mb-10 max-w-sm">
            드라마·영화 속 배경지를 실제 여행 코스로, 잇다가 시대와 인물의 발자취를 안내합니다.
          </p>

          <div className="space-y-5">
            {highlights.map((h) => (
              <div key={h.title} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <h.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm mb-0.5">{h.title}</p>
                  <p className="text-white/60 text-sm">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/40 text-xs">© 2026 잇다 관광</p>
      </div>

      {/* 우측(데스크탑) / 전체(모바일) 폼 영역 */}
      <div
        className="flex-1 flex flex-col lg:items-center lg:justify-center lg:p-10 hanji-noise"
        style={{ background: "radial-gradient(120% 100% at 50% 0%, var(--primary-50), var(--background) 65%)" }}
      >
        {/* 모바일 전용 상단 브랜드 배너 — 데스크탑 좌측 패널을 대신해 브랜드를 보여준다 */}
        <div className="lg:hidden relative pt-14 pb-12 px-6 text-center overflow-hidden hanji-noise" style={brandGradient}>
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col items-center">
            <BrandMark className="w-11 h-11 text-lg mb-2.5" />
            <span className="font-heading text-xl font-black text-white">잇다 관광</span>
            <p className="text-white/70 text-sm mt-1.5">사극 속 이야기를 따라 떠나는 여행</p>
          </div>
        </div>

        {/* 폼 바텀시트(모바일) / 카드(데스크탑) */}
        <div
          className={`flex-1 lg:flex-none lg:w-full ${maxWidthClass} -mt-6 lg:mt-0 relative z-10 bg-card rounded-t-[28px] lg:rounded-2xl border-0 lg:border lg:border-border/60 shadow-[var(--shadow-lg)] p-6 pt-8 lg:p-8`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
