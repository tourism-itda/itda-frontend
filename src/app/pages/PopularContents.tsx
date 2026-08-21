import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, SlidersHorizontal, TrendingUp, Flame, MapPinOff } from "lucide-react";
import { Input } from "../components/ui/input";
import { ContentCard } from "../components/ContentCard";
import { Skeleton } from "../components/ui/skeleton";
import { useContents } from "../lib/useContents";
import { ContentListItem, ContentMediaType, ContentSort } from "../lib/contents";

type Genre = "전체" | "드라마" | "영화" | "다큐";
type Sort = "인기순" | "최신순";

const genreToMediaType: Record<Genre, ContentMediaType | undefined> = {
  전체: undefined,
  드라마: "DRAMA",
  영화: "MOVIE",
  다큐: "DOCUMENTARY",
};

const sortToApiSort: Record<Sort, ContentSort> = {
  인기순: "popular",
  최신순: "recent",
};

const mediaTypeLabel: Record<string, string> = {
  MOVIE: "영화",
  DRAMA: "드라마",
  DOCUMENTARY: "다큐",
};

const PAGE_SIZE = 24;

export default function PopularContents() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<Genre>("전체");
  const [sort, setSort] = useState<Sort>("인기순");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  // API 호출은 q로 나가므로 매 타이핑마다 요청하지 않도록 디바운스한다.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // 필터가 바뀌면 1페이지부터 다시 본다.
  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, genre, sort]);

  const { status, data } = useContents({
    q: debouncedQuery || undefined,
    mediaType: genreToMediaType[genre],
    sort: sortToApiSort[sort],
    page,
    limit: PAGE_SIZE,
  });

  // "더 보기"로 다음 페이지를 불러오면 기존 목록 뒤에 이어 붙인다. 필터가 바뀌어 1페이지부터
  // 다시 조회될 때는(위 useEffect가 page를 0으로 되돌림) 새 결과로 교체한다.
  const [items, setItems] = useState<ContentListItem[]>([]);
  useEffect(() => {
    if (!data) return;
    setItems((prev) => (page === 0 ? data.data : [...prev, ...data.data]));
  }, [data]);

  const total = data?.total ?? 0;
  const hasMore = items.length < total;
  const showTop3 = page === 0 && query === "" && genre === "전체" && sort === "인기순" && items.length >= 3;

  return (
    <div className="min-h-screen pb-8">
      {/* 상단 헤더 */}
      <div className="sticky top-0 lg:top-16 z-40 bg-background/95 backdrop-blur-sm hanji-noise border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 -ml-1.5 rounded-full hover:bg-muted flex items-center justify-center transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="leading-tight">인기 콘텐츠</h1>
              <p className="text-sm text-muted-foreground">사극 팬들이 가장 많이 찾은 콘텐츠</p>
            </div>
          </div>

          {/* 검색바 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="제목으로 검색"
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
          {/* 카테고리(category_id) 필터는 아직 숨김: 다연 카테고리 도메인 작업 완료 전까지는
              category_id로 필터링해도 항상 빈 결과만 나온다(로컬 DB에 content_category 데이터 없음). */}
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
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-5">
        {/* 정렬 + 결과 수 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-medium text-foreground">{total}</span>개
          </p>
          <div className="flex gap-1">
            {(["인기순", "최신순"] as Sort[]).map((s) => (
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

        {status === "loading" && page === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[3/4] rounded-xl mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1.5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-16 text-muted-foreground">
            <MapPinOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">콘텐츠를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
          </div>
        )}

        {status === "done" && items.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        )}

        {items.length > 0 && (
          <>
            {/* TOP 3 하이라이트 */}
            {showTop3 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">이번 주 TOP 3</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {items.slice(0, 3).map((c, i) => (
                    <div
                      key={c.content_id}
                      onClick={() => navigate(`/app/content/${c.content_id}`)}
                      className="relative cursor-pointer group rounded-xl overflow-hidden"
                    >
                      <div className="aspect-[3/4] overflow-hidden bg-muted">
                        <img
                          src={c.thumbnail_url ?? "/images/tiger.png"}
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
                          <span className="text-ivory text-xs">{c.view_count.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 전체 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((content) => (
                <ContentCard
                  key={content.content_id}
                  content={{
                    id: String(content.content_id),
                    title: content.title,
                    genre: content.media ? mediaTypeLabel[content.media.type] ?? content.media.type : "",
                    era: content.media?.release_year ? String(content.media.release_year) : "",
                    image: content.thumbnail_url ?? "/images/tiger.png",
                  }}
                />
              ))}
            </div>

            {status === "loading" && page > 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">불러오는 중...</p>
            )}

            {hasMore && status !== "loading" && (
              <button
                onClick={() => setPage((p) => p + 1)}
                className="w-full mt-5 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                더 보기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
