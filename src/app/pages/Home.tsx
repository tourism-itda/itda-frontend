import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import { Input } from "../components/ui/input";

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

  return (
    <div className="min-h-screen pb-10">
      {/* 검색바 */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-5 py-3 max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="드라마·영화 제목으로 검색" className="pl-9 h-10 bg-card text-sm" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 space-y-14 mt-8">

        {/* 왕조별 탐색 */}
        <section>
          <h2 className="mb-5">왕조별 탐색</h2>
          <div className="overflow-x-auto -mx-5 px-5 pb-3">
            <div className="flex gap-3 lg:grid lg:grid-cols-3 lg:gap-5">
              {dynastyItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/app/dynasty/${item.id}`)}
                  className="shrink-0 w-64 lg:w-auto relative aspect-[4/3] rounded-2xl overflow-hidden group text-left"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* 그라데이션: 하단 60%만 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* 텍스트: 하단 여백 넉넉히 */}
                  <div className="absolute bottom-5 left-4">
                    <p className="text-white text-xl font-semibold leading-tight">{item.name}</p>
                    <p className="text-white/55 text-[11px] mt-1 tracking-wide">{item.years}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 인물별 탐색 */}
        <section>
          <h2 className="mb-5">인물별 탐색</h2>
          <div className="overflow-x-auto -mx-5 px-5 pb-3">
            <div className="flex gap-3 lg:grid lg:grid-cols-4 lg:gap-5">
              {personItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/app/person/${item.id}`)}
                  className="shrink-0 w-44 lg:w-auto relative aspect-[3/4] rounded-2xl overflow-hidden group text-left"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white/55 text-[11px] mb-1 tracking-wide">{item.role}</p>
                    <p className="text-white text-lg font-semibold leading-tight">{item.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 인기 콘텐츠 */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2>인기 콘텐츠</h2>
            <button
              onClick={() => navigate("/app/popular")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              전체 보기
            </button>
          </div>

          <div className="overflow-x-auto -mx-5 px-5 pb-3 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0">
            <div className="flex gap-3 lg:grid lg:grid-cols-4 lg:gap-4">
              {popularContents.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/app/content/${c.id}`)}
                  className="shrink-0 w-40 lg:w-auto group text-left"
                >
                  <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2">
                    <img
                      src={c.image}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {/* 텍스트: 이미지 바로 아래 붙여서, 중앙 아닌 왼쪽 정렬은 유지하되 px 추가 */}
                  <div className="px-0.5">
                    <p className="font-medium text-sm leading-tight mb-0.5 line-clamp-1">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.meta}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
