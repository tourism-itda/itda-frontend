import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, ChevronRight, Footprints, LogIn, MapPin, MapPinOff, Search, User } from "lucide-react";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { ContentCard } from "../components/ContentCard";
import { useContents } from "../lib/useContents";
import { useKingdoms } from "../lib/useKingdoms";
import { usePersons } from "../lib/usePersons";
import { getKingdomEra } from "../lib/kingdomEra";

type Category = "콘텐츠 둘러보기" | "나라별" | "인물별";

export interface ExploreItem {
  id: string;
  title: string;
  tag: string;
  /** 나라 카드: 없음. 인물 카드: 소속 나라 한글 이름(예: "조선"). */
  subtitle?: string;
  /** 인물 카드에서만 쓰는 한 줄 소개(person.summary, 없으면 person.description으로 폴백). */
  description?: string | null;
  /** 인물 카드에서만 쓰는 시대 텍스트(예: "918년 ~ 1392년"). kingdoms 목록의 time_period를
   *  재사용해서 채운다 — 매칭되는 나라가 없으면 undefined로 두고 카드에서 생략한다. */
  era?: string;
  /** 나라 카드: kingdom.image_url. 인물 카드: person.image_url. */
  image?: string | null;
  /** 인물 카드에서만 쓰는 소속 나라 enum 코드(예: "GORYEO"). 나라별 그룹핑에 쓴다. */
  kingdomCode?: string;
  href: string;
}

const categories: Category[] = ["콘텐츠 둘러보기", "나라별", "인물별"];

// 인물별 탭에서 나라 그룹당 홈 화면에 보여줄 카드 수. 넘으면 "전체보기"로 유도한다.
const PERSON_GROUP_LIMIT = 8;

const mediaTypeLabel: Record<string, string> = {
  MOVIE: "영화",
  DRAMA: "드라마",
  DOCUMENTARY: "다큐",
};

// PersonResponse.type(enum 코드)의 한글 라벨. 백엔드가 라벨을 안 내려주므로 프론트에서
// mediaTypeLabel과 같은 방식으로 관리한다(explore/enums/PersonType.java 기준).
export const personTypeLabel: Record<string, string> = {
  KING: "왕",
  GENERAL: "장군",
  SCHOLAR: "학자",
  MONK: "승려",
  POLITICIAN: "정치가",
  INVENTOR: "과학자·발명가",
  INDEPENDENCE_ACTIVIST: "독립운동가",
};

const upcomingSchedule = [
  { id: "e1", title: "세종대왕 즉위 기념 특별전", date: "2026.09.01", tag: "전시", image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300" },
  { id: "e2", title: "이순신 장군 탄신 기념행사", date: "2026.09.15", tag: "행사", image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300" },
  { id: "e3", title: "정조대왕 능행차 재현", date: "2026.10.03", tag: "축제", image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300" },
];

const categoryEyebrow: Record<Category, string> = {
  "콘텐츠 둘러보기": "Popular",
  "나라별": "Dynasty",
  "인물별": "Figures",
};

export function ExploreCard({ item, onClick }: { item: ExploreItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {item.image && (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              item.tag === "인물" ? "object-[50%_20%]" : ""
            }`}
          />
        )}
        <div className="absolute left-2 bottom-2 flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-full bg-neutral-900/70 backdrop-blur-sm text-white text-[10px] font-bold tracking-wide">
            {item.tag}
          </span>
          {item.subtitle && (
            <span className="px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-sm text-neutral-900 text-[10px] font-bold tracking-wide">
              {item.subtitle}
            </span>
          )}
        </div>
      </div>
      <div className="px-3 pt-3 pb-3">
        <p className="font-heading text-[14px] font-black mb-1 line-clamp-1">{item.title}</p>
        {(item.subtitle || item.era) && item.tag === "인물" && (
          <p className="text-[11px] text-muted-foreground/80 font-semibold mb-1 truncate">
            {[item.subtitle, item.era].filter(Boolean).join(" · ")}
          </p>
        )}
        {item.description && (
          <div className="flex items-start gap-1 text-xs text-muted-foreground mb-2">
            {item.tag === "인물" ? (
              <User className="w-3 h-3 shrink-0 mt-0.5" />
            ) : (
              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
            )}
            <span className="line-clamp-2">{item.description}</span>
          </div>
        )}
        <span className="inline-flex items-center gap-0.5 text-xs text-primary font-bold group-hover:gap-1.5 transition-all">
          상세 정보 보기
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("콘텐츠 둘러보기");

  // 콘텐츠 둘러보기 탭은 검색어를 API 쿼리(q)로 보내므로, 매 타이핑마다 요청하지 않도록 디바운스한다.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const popular = useContents({ sort: "popular", limit: 6, q: debouncedQuery || undefined });
  const kingdoms = useKingdoms();
  const persons = usePersons();

  const dynastyItems: ExploreItem[] = useMemo(
    () =>
      kingdoms.data.map((k) => ({
        id: k.kingdom,
        title: k.name,
        tag: "시대",
        image: k.image_url,
        href: `/app/dynasty/${k.kingdom}`,
      })),
    [kingdoms.data]
  );

  const personItems: ExploreItem[] = useMemo(
    () =>
      persons.data.map((p) => ({
        id: String(p.person_id),
        title: p.name,
        tag: "인물",
        subtitle: personTypeLabel[p.type] ?? p.type,
        description: p.summary ?? p.description,
        era: getKingdomEra(kingdoms.data, p.kingdom),
        image: p.image_url,
        kingdomCode: p.kingdom,
        href: `/app/person/${p.person_id}`,
      })),
    [persons.data, kingdoms.data]
  );

  const activeItems = useMemo(() => {
    if (category === "콘텐츠 둘러보기") return [];
    const source: ExploreItem[] = category === "나라별" ? dynastyItems : personItems;
    if (query === "") return source;
    return source.filter(
      (item) => item.title.includes(query) || (item.description ?? "").includes(query)
    );
  }, [category, query, dynastyItems, personItems]);

  // 인물별 탭 전용: 나라(kingdom) 코드 -> 한글 이름. 전체보기 진입 경로(/app/dynasty/:code/persons)의
  // 표시 이름도 이 맵을 그대로 쓴다.
  const kingdomNameByCode = useMemo(() => {
    const map: Record<string, string> = {};
    kingdoms.data.forEach((k) => {
      map[k.kingdom] = k.name;
    });
    return map;
  }, [kingdoms.data]);

  // 인물별 탭에서만 쓰는, 나라별로 묶은 인물 카드 그룹. 그룹 순서는 나라별 탭(kingdoms.data)과
  // 동일하게 시대 순으로 맞춘다.
  const personGroups = useMemo(() => {
    if (category !== "인물별") return [];
    const order = kingdoms.data.map((k) => k.kingdom);
    const byCode = new Map<string, ExploreItem[]>();
    activeItems.forEach((item) => {
      const code = item.kingdomCode ?? "UNKNOWN";
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code)!.push(item);
    });
    const codes = Array.from(byCode.keys()).sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return codes.map((code) => ({
      code,
      name: kingdomNameByCode[code] ?? code,
      items: byCode.get(code)!,
    }));
  }, [category, activeItems, kingdoms.data, kingdomNameByCode]);

  // 나라별/인물별 탭은 각각 GET /explore/kingdoms(No.21), GET /explore/persons(No.24) 상태를 그대로 쓴다.
  const activeExploreStatus = category === "나라별" ? kingdoms.status : category === "인물별" ? persons.status : "done";

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">

        {/* 히어로 섹션 */}
        <section className="pt-10 lg:pt-16 pb-8">
          <div className="flex flex-col gap-8">
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
                <span className="text-sm text-muted-foreground">
                  총 {category === "콘텐츠 둘러보기" ? popular.data?.total ?? 0 : activeItems.length}개
                </span>
              </div>
            </div>
            {category === "콘텐츠 둘러보기" && (
              <button
                onClick={() => navigate("/app/popular")}
                className="text-sm text-primary font-bold hover:underline flex items-center gap-0.5 shrink-0"
              >
                전체보기
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {category === "콘텐츠 둘러보기" ? (
            <>
              {popular.status === "loading" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="aspect-[3/4] rounded-sm mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-1.5" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  ))}
                </div>
              )}
              {popular.status === "error" && (
                <div className="text-center py-16 text-muted-foreground">
                  <MapPinOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">콘텐츠를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
                </div>
              )}
              {popular.status === "done" && (popular.data?.data.length ?? 0) === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">검색 결과가 없습니다</p>
                </div>
              )}
              {popular.status === "done" && (popular.data?.data.length ?? 0) > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {popular.data!.data.map((item) => (
                    <ContentCard
                      key={item.content_id}
                      content={{
                        id: String(item.content_id),
                        title: item.title,
                        genre: item.media ? mediaTypeLabel[item.media.type] ?? item.media.type : "",
                        era: item.media?.release_year ? String(item.media.release_year) : "",
                        image: item.thumbnail_url,
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {activeExploreStatus === "loading" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="aspect-square rounded-2xl mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-1.5" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  ))}
                </div>
              )}
              {activeExploreStatus === "unauthenticated" && (
                <div className="text-center py-16 text-muted-foreground">
                  <LogIn className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm mb-4">로그인이 필요한 기능이에요</p>
                  <Button onClick={() => navigate("/login")}>로그인하기</Button>
                </div>
              )}
              {activeExploreStatus === "error" && (
                <div className="text-center py-16 text-muted-foreground">
                  <MapPinOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    {category} 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
                  </p>
                </div>
              )}
              {activeExploreStatus === "done" && activeItems.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    {query
                      ? "검색 결과가 없습니다"
                      : category === "나라별"
                        ? "아직 등록된 나라 정보가 없습니다"
                        : "아직 등록된 인물 정보가 없습니다"}
                  </p>
                </div>
              )}
              {activeExploreStatus === "done" && activeItems.length > 0 && category === "인물별" && (
                <div className="space-y-10">
                  {personGroups.map((group) => (
                    <div key={group.code}>
                      <div className="flex items-end justify-between mb-4">
                        <div className="flex items-baseline gap-2">
                          <h3 className="font-heading text-lg font-black">{group.name}</h3>
                          <span className="text-sm text-muted-foreground">총 {group.items.length}개</span>
                        </div>
                        {group.items.length > PERSON_GROUP_LIMIT && (
                          <button
                            onClick={() => navigate(`/app/dynasty/${group.code}/persons`)}
                            className="text-sm text-primary font-bold hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            전체보기
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {group.items.slice(0, PERSON_GROUP_LIMIT).map((item) => (
                          <ExploreCard key={item.id} item={item} onClick={() => navigate(item.href)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeExploreStatus === "done" && activeItems.length > 0 && category === "나라별" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {activeItems.map((item) => (
                    <ExploreCard key={item.id} item={item} onClick={() => navigate(item.href)} />
                  ))}
                </div>
              )}
            </>
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
