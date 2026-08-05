import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, SlidersHorizontal, TrendingUp, Flame } from "lucide-react";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ContentCard } from "../components/ContentCard";

type Genre = "전체" | "드라마" | "영화" | "다큐";
type Era = "전체" | "조선" | "고려" | "삼국" | "근현대";
type Sort = "인기순" | "최신순" | "평점순";

const allContents = [
  { id: "101", title: "뿌리깊은 나무", genre: "사극 드라마", era: "조선 세종", rank: 1, views: "2.1M", image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  { id: "102", title: "왕의 남자", genre: "사극 영화", era: "조선 연산군", rank: 2, views: "1.8M", image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  { id: "103", title: "광해, 왕이 된 남자", genre: "사극 영화", era: "조선 광해군", rank: 3, views: "1.6M", image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  { id: "104", title: "육룡이 나르샤", genre: "사극 드라마", era: "고려 말 ~ 조선 초", rank: 4, views: "1.3M", image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  { id: "105", title: "이산", genre: "사극 드라마", era: "조선 정조", rank: 5, views: "1.1M", image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  { id: "106", title: "선덕여왕", genre: "사극 드라마", era: "삼국 신라", rank: 6, views: "980K", image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  { id: "107", title: "태조 왕건", genre: "사극 드라마", era: "고려 태조", rank: 7, views: "870K", image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  { id: "108", title: "최종병기 활", genre: "사극 영화", era: "조선 인조", rank: 8, views: "820K", image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  { id: "109", title: "명량", genre: "사극 영화", era: "조선 선조", rank: 9, views: "780K", image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  { id: "110", title: "역사스페셜: 고려청자", genre: "다큐", era: "고려", rank: 10, views: "450K", image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  { id: "111", title: "정도전", genre: "사극 드라마", era: "고려 말 ~ 조선 초", rank: 11, views: "620K", image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
  { id: "112", title: "칸의 후예", genre: "다큐", era: "고려 몽골간섭기", rank: 12, views: "390K", image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600" },
];

const genreMap: Record<Genre, string> = {
  전체: "",
  드라마: "드라마",
  영화: "영화",
  다큐: "다큐",
};

const eraMap: Record<Era, string> = {
  전체: "",
  조선: "조선",
  고려: "고려",
  삼국: "삼국",
  근현대: "근현대",
};

export default function PopularContents() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<Genre>("전체");
  const [era, setEra] = useState<Era>("전체");
  const [sort, setSort] = useState<Sort>("인기순");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = allContents
    .filter((c) => {
      const matchQuery = query === "" || c.title.includes(query) || c.era.includes(query);
      const matchGenre = genreMap[genre] === "" || c.genre.includes(genreMap[genre]);
      const matchEra = eraMap[era] === "" || c.era.includes(eraMap[era]);
      return matchQuery && matchGenre && matchEra;
    })
    .sort((a, b) => {
      if (sort === "인기순") return a.rank - b.rank;
      if (sort === "최신순") return b.id.localeCompare(a.id);
      return 0;
    });

  return (
    <div className="min-h-screen pb-8">
      {/* 상단 헤더 */}
      <div className="sticky top-0 lg:top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="leading-tight">인기 콘텐츠</h1>
              <p className="text-xs text-muted-foreground">사극 팬들이 가장 많이 찾은 콘텐츠</p>
            </div>
          </div>

          {/* 검색바 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="제목·시대로 검색"
                className="pl-9 h-10 bg-input-background text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 h-10 rounded-lg border transition-colors flex items-center gap-1.5 text-sm ${
                showFilters ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              필터
            </button>
          </div>

          {/* 필터 확장 */}
          {showFilters && (
            <div className="mt-3 space-y-2 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-2">장르</p>
                <div className="flex gap-2 flex-wrap">
                  {(["전체", "드라마", "영화", "다큐"] as Genre[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenre(g)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        genre === g
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">시대</p>
                <div className="flex gap-2 flex-wrap">
                  {(["전체", "조선", "고려", "삼국", "근현대"] as Era[]).map((e) => (
                    <button
                      key={e}
                      onClick={() => setEra(e)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        era === e
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-5">
        {/* 정렬 + 결과 수 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-medium text-foreground">{filtered.length}</span>개
          </p>
          <div className="flex gap-1">
            {(["인기순", "최신순", "평점순"] as Sort[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  sort === s ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* TOP 3 하이라이트 */}
        {query === "" && genre === "전체" && era === "전체" && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">이번 주 TOP 3</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {allContents.slice(0, 3).map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/app/content/${c.id}`)}
                  className="relative cursor-pointer group rounded-xl overflow-hidden"
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={c.image}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="font-heading text-gold text-2xl leading-none mb-1">
                      {["①", "②", "③"][i]}
                    </p>
                    <p className="text-ivory text-xs font-medium line-clamp-2 leading-tight">{c.title}</p>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 bg-navy/60 rounded-full px-2 py-0.5">
                      <TrendingUp className="w-3 h-3 text-ivory" />
                      <span className="text-ivory text-[10px]">{c.views}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 전체 그리드 */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
