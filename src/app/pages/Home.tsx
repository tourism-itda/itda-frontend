import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, ChevronRight, Footprints, MapPin, Search } from "lucide-react";
import { Input } from "../components/ui/input";

type Category = "인기 콘텐츠" | "시대별 탐색" | "인물별 탐색";
type Genre = "전체" | "드라마" | "영화" | "다큐";

interface ExploreItem {
  id: string;
  title: string;
  tag: string;
  date: string;
  location: string;
  image: string;
  href: string;
}

const categories: Category[] = ["인기 콘텐츠", "시대별 탐색", "인물별 탐색"];

const popularContents: (ExploreItem & { genre: Genre })[] = [
  { id: "101", title: "뿌리깊은 나무", tag: "드라마", genre: "드라마", date: "2011", location: "경복궁 일원", image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", href: "/app/content/101" },
  { id: "102", title: "왕의 남자", tag: "영화", genre: "영화", date: "2005", location: "창덕궁 후원", image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", href: "/app/content/102" },
  { id: "103", title: "광해, 왕이 된 남자", tag: "영화", genre: "영화", date: "2012", location: "창경궁", image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", href: "/app/content/103" },
  { id: "104", title: "육룡이 나르샤", tag: "드라마", genre: "드라마", date: "2015", location: "개경 유적지", image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", href: "/app/content/104" },
  { id: "105", title: "이산", tag: "드라마", genre: "드라마", date: "2007", location: "수원 화성", image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", href: "/app/content/105" },
  { id: "110", title: "역사스페셜: 고려청자", tag: "다큐", genre: "다큐", date: "2019", location: "강진 청자마을", image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600", href: "/app/content/110" },
];

const dynastyItems: ExploreItem[] = [
  { id: "1", title: "조선", tag: "시대", date: "1392–1897", location: "한양(서울)", image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080", href: "/app/dynasty/1" },
  { id: "2", title: "고려", tag: "시대", date: "918–1392", location: "개경(개성)", image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080", href: "/app/dynasty/2" },
  { id: "3", title: "삼국", tag: "시대", date: "기원전 57–668", location: "금성·평양·위례성", image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080", href: "/app/dynasty/3" },
];

const personItems: ExploreItem[] = [
  { id: "1", title: "세종대왕", tag: "인물", date: "재위 1418–1450", location: "경복궁", image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080", href: "/app/person/1" },
  { id: "2", title: "이순신", tag: "인물", date: "1592–1598", location: "여수 진남관", image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080", href: "/app/person/2" },
  { id: "3", title: "정조", tag: "인물", date: "재위 1776–1800", location: "수원 화성", image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080", href: "/app/person/3" },
  { id: "4", title: "연산군", tag: "인물", date: "재위 1494–1506", location: "창덕궁", image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080", href: "/app/person/4" },
];

const upcomingSchedule = [
  { id: "e1", title: "세종대왕 즉위 기념 특별전", date: "2026.09.01", tag: "전시", image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300" },
  { id: "e2", title: "이순신 장군 탄신 기념행사", date: "2026.09.15", tag: "행사", image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300" },
  { id: "e3", title: "정조대왕 능행차 재현", date: "2026.10.03", tag: "축제", image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300" },
];

const categoryEyebrow: Record<Category, string> = {
  "인기 콘텐츠": "Popular",
  "시대별 탐색": "Dynasty",
  "인물별 탐색": "Figures",
};

function ExploreCard({ item, onClick }: { item: ExploreItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-card rounded-[28px] border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="relative aspect-[470/323] lg:aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute left-3 bottom-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full bg-neutral-900/70 backdrop-blur-sm text-white text-xs font-bold tracking-wide">
            {item.tag}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-sm text-neutral-900 text-xs font-bold tracking-wide">
            {item.location}
          </span>
        </div>
      </div>
      <div className="px-5 pt-5 pb-5">
        <p className="font-heading text-[16px] lg:text-[18px] font-black mb-2 line-clamp-1">{item.title}</p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{item.date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{item.location}</span>
        </div>
        <span className="inline-flex items-center gap-0.5 text-sm text-primary font-bold group-hover:gap-1.5 transition-all">
          상세 정보 보기
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("인기 콘텐츠");

  const activeItems = useMemo(() => {
    const source: ExploreItem[] =
      category === "인기 콘텐츠"
        ? popularContents
        : category === "시대별 탐색"
        ? dynastyItems
        : personItems;

    if (query === "") return source;
    return source.filter((item) => item.title.includes(query) || item.location.includes(query));
  }, [category, query]);

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">

        {/* 히어로 섹션 */}
        <section className="pt-10 lg:pt-16 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1 min-w-0">
              <p className="text-xs tracking-[0.2em] text-primary font-bold uppercase mb-3">Discover Korean History</p>
              <h1 className="font-heading text-[34px] leading-[38.08px] tracking-[-0.04em] lg:text-[64px] lg:leading-[71.68px] mb-3 lg:max-w-[764px]">
                역사 속 이야기를
                <br />
                여행으로 이어보세요
              </h1>
              <p className="text-[16px] font-medium leading-[28px] lg:text-[18px] lg:leading-[32px] text-muted-foreground mt-5 mb-7 lg:whitespace-nowrap">
                드라마·영화 속 배경지를 실제 여행 코스로,
                <br className="lg:hidden" />
                {" "}잇다가 시대와 인물의 발자취를 안내합니다.
              </p>

              {/* 검색바 (pill) */}
              <div className="flex items-center gap-2 bg-card border border-border rounded-full shadow-sm h-[52px] p-1.5 lg:h-16 lg:p-2 max-w-2xl mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="드라마·영화 제목, 시대, 인물로 검색"
                  className="border-0 shadow-none bg-transparent h-9 px-1 text-[16px] font-semibold focus-visible:ring-0"
                />
              </div>
            </div>

            {/* 마스코트 이미지 — 우측, 텍스트 쪽으로 당겨서 배치 */}
            <div className="shrink-0 flex justify-center lg:justify-end lg:-ml-[160px] xl:-ml-[190px]">
              <img
                src="/images/tiger.png"
                alt="잇다 마스코트 호랑이"
                className="w-72 sm:w-80 lg:w-[26rem] xl:w-[32rem] h-auto drop-shadow-xl select-none pointer-events-none"
              />
            </div>
          </div>
        </section>

        {/* 카테고리 탭 */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`flex items-center h-[38px] px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-colors ${
                category === c
                  ? "bg-primary-75 border-primary text-primary"
                  : "bg-card border-neutral-200 text-foreground hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 섹션 타이틀 + 개수 + 전체보기 */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs tracking-[0.2em] text-primary font-bold uppercase mb-2">
                {categoryEyebrow[category]}
              </p>
              <div className="flex items-baseline gap-2">
                <h2 className="font-heading text-[24px] font-black">{category}</h2>
                <span className="text-sm text-muted-foreground">총 {activeItems.length}개</span>
              </div>
            </div>
            {category === "인기 콘텐츠" && (
              <button
                onClick={() => navigate("/app/popular")}
                className="text-sm text-primary font-bold hover:underline flex items-center gap-0.5 shrink-0"
              >
                전체보기
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {activeItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeItems.map((item) => (
                <ExploreCard key={item.id} item={item} onClick={() => navigate(item.href)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          )}
        </section>

        {/* 하단 2단 그리드 */}
        <section className="grid lg:grid-cols-3 gap-5 mb-10">
          <div className="lg:col-span-2 bg-card rounded-[28px] border border-border shadow-sm p-6">
            <h3 className="font-heading text-lg font-black mb-4">다가오는 일정</h3>
            <div className="divide-y divide-border">
              {upcomingSchedule.map((ev) => (
                <div key={ev.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="w-16 h-16 shrink-0 rounded-sm overflow-hidden">
                    <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{ev.title}</p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{ev.date}</span>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    {ev.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-[28px] p-8 flex flex-col justify-between text-ivory shadow-md"
            style={{ background: "linear-gradient(135deg, var(--terracotta), var(--gold))" }}
          >
            <div>
              <Footprints className="w-7 h-7 mb-3" />
              <h3 className="font-heading text-2xl lg:text-[28px] font-black mb-2">나만의 역사 여행 코스 만들기</h3>
              <p className="text-base text-ivory/85">관심 시대와 인물을 고르면 잇다가 여행 코스를 추천해드려요.</p>
            </div>
            <button
              onClick={() => navigate("/app/planner")}
              className="mt-6 self-start h-12 px-5 rounded-full bg-white text-neutral-900 text-sm font-black hover:bg-white/90 transition-colors flex items-center"
            >
              플래너 시작하기
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
