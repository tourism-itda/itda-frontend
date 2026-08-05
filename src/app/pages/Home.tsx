import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import { Input } from "../components/ui/input";
import { BrandMark } from "../components/BrandMark";

export default function Home() {
  const navigate = useNavigate();

  const dynastyItems = [
    {
      id: "1",
      name: "조선",
      years: "1392–1897",
      image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    },
    {
      id: "2",
      name: "고려",
      years: "918–1392",
      image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    },
    {
      id: "3",
      name: "삼국",
      years: "기원전 57–668",
      image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    },
  ];

  const popularContents = [
    { id: "101", title: "뿌리깊은 나무", meta: "드라마 · 조선 세종", image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
    { id: "102", title: "왕의 남자", meta: "영화 · 조선 연산군", image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
    { id: "103", title: "광해, 왕이 된 남자", meta: "영화 · 조선 광해군", image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
    { id: "104", title: "육룡이 나르샤", meta: "드라마 · 고려 말", image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  ];

  const personItems = [
    {
      id: "1",
      name: "세종대왕",
      role: "조선 4대 왕",
      image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    },
    {
      id: "2",
      name: "이순신",
      role: "조선 명장",
      image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    },
    {
      id: "3",
      name: "정조",
      role: "조선 22대 왕",
      image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    },
    {
      id: "4",
      name: "연산군",
      role: "조선 10대 왕",
      image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    },
  ];

  const [heroDynasty, ...otherDynasties] = dynastyItems;

  return (
    <div className="min-h-screen pb-10">
      {/* 검색바 */}
      <div className="sticky top-0 lg:top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-5 py-3 max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="드라마·영화 제목으로 검색" className="pl-9 h-10 bg-card text-sm" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 mt-10 space-y-20">

        {/* 시대별 탐색 — 히어로 + 보조 리스트 (비대칭) */}
        <section>
          <p className="text-[11px] tracking-[0.2em] text-gold font-medium uppercase mb-2">Dynasty</p>
          <h2 className="font-heading text-2xl mb-6">시대별 탐색</h2>

          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8">
            <button
              onClick={() => navigate(`/app/dynasty/${heroDynasty.id}`)}
              className="relative aspect-[16/11] overflow-hidden group text-left"
            >
              <img
                src={heroDynasty.image}
                alt={heroDynasty.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-terracotta/85 via-terracotta/10 to-transparent" />

              {/* 코너 장식: 네이비 탭 + 골드 라인 (섹션 표식 겸용) */}
              <div
                className="absolute top-0 right-0 w-16 h-16 bg-navy"
                style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
              />
              <div
                className="absolute top-0 right-0 w-16 h-16 bg-gold"
                style={{ clipPath: "polygon(100% 0, 52% 0, 100% 48%)" }}
              />

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-ivory/55 text-xs tracking-wide mb-1">{heroDynasty.years}</p>
                <p className="font-heading text-ivory text-4xl leading-none">{heroDynasty.name}</p>
              </div>
            </button>

            <div className="flex flex-col divide-y divide-border">
              {otherDynasties.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/app/dynasty/${item.id}`)}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 text-left group"
                >
                  <div className="w-20 h-20 shrink-0 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div>
                    <p className="font-heading text-lg">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.years}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 인기 콘텐츠 — 텍스트 중심 인덱스 리스트 */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-gold font-medium uppercase mb-2">Popular</p>
              <h2 className="font-heading text-2xl">인기 콘텐츠</h2>
            </div>
            <button
              onClick={() => navigate("/app/popular")}
              className="px-4 py-1.5 rounded-full bg-gold text-navy text-sm font-medium hover:bg-gold/80 transition-colors"
            >
              전체 보기
            </button>
          </div>

          <div className="border-t border-border">
            {popularContents.map((c, i) => (
              <button
                key={c.id}
                onClick={() => navigate(`/app/content/${c.id}`)}
                className="w-full flex items-center gap-5 py-4 border-b border-border text-left group"
              >
                <span className="font-heading text-2xl text-muted-foreground/40 w-8 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="w-14 h-14 shrink-0 overflow-hidden">
                  <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate group-hover:text-gold transition-colors">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.meta}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 인물별 탐색 — 얇은 보더 갤러리 그리드 */}
        <section>
          <p className="text-[11px] tracking-[0.2em] text-gold font-medium uppercase mb-2">Figures</p>
          <h2 className="font-heading text-2xl mb-6">인물별 탐색</h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {personItems.map((item, i) => (
              <button
                key={item.id}
                onClick={() => navigate(`/app/person/${item.id}`)}
                className="relative aspect-[3/4] bg-background text-left overflow-hidden group"
              >
                {i === 0 && (
                  <div
                    className="absolute top-0 left-0 w-10 h-10 bg-navy z-10"
                    style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
                  />
                )}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 bg-background/92 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground tracking-wide">{item.role}</p>
                  <p className="font-heading text-sm">{item.name}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>

      {/* 브랜드 워터마크 */}
      <div className="hidden lg:block fixed bottom-6 right-6 opacity-30 pointer-events-none select-none z-30">
        <BrandMark className="w-7 h-7 text-sm" />
      </div>
    </div>
  );
}
