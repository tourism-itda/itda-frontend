import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Bookmark, Loader2, MapPinOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { ApiError } from "../lib/api";
import { useContentDetail } from "../lib/useContentDetail";
import { useContentPlaces } from "../lib/useContentPlaces";
import { createBookmark, deleteBookmark, getMyBookmarks } from "../lib/bookmarksApi";

const mediaTypeLabel: Record<string, string> = {
  MOVIE: "영화",
  DRAMA: "드라마",
  DOCUMENTARY: "다큐멘터리",
};

export default function ContentDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const contentId = id !== undefined && !Number.isNaN(Number(id)) ? Number(id) : undefined;

  const { status, data } = useContentDetail(contentId);
  const places = useContentPlaces(contentId);

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  // place_id -> bookmark_id. 서버가 관련 장소 목록에서 is_bookmarked만 내려주고
  // bookmark_id는 주지 않으므로, 직접 북마크했을 때만 채워지고 그 외엔 해제 시점에 조회해서 채운다.
  const [bookmarkIds, setBookmarkIds] = useState<Map<number, number>>(new Map());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (places.data) {
      setBookmarkedIds(new Set(places.data.filter((p) => p.is_bookmarked).map((p) => p.place_id)));
    }
  }, [places.data]);

  async function handleToggleBookmark(placeId: number) {
    if (pendingIds.has(placeId)) return;
    const wasBookmarked = bookmarkedIds.has(placeId);

    setPendingIds((prev) => new Set(prev).add(placeId));
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(placeId);
      else next.add(placeId);
      return next;
    });

    try {
      if (wasBookmarked) {
        let bookmarkId = bookmarkIds.get(placeId);
        if (bookmarkId === undefined) {
          const mine = await getMyBookmarks();
          bookmarkId = mine.find((b) => b.place_id === placeId)?.bookmark_id;
        }
        if (bookmarkId !== undefined) {
          await deleteBookmark(bookmarkId);
        }
        setBookmarkIds((prev) => {
          const next = new Map(prev);
          next.delete(placeId);
          return next;
        });
      } else {
        const result = await createBookmark(placeId);
        setBookmarkIds((prev) => new Map(prev).set(placeId, result.bookmark_id));
      }
    } catch (err) {
      // 실패했으니 낙관적으로 바꿨던 상태를 되돌린다.
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(placeId);
        else next.delete(placeId);
        return next;
      });
      // itda-backend는 인증 필요 라우트에 토큰이 없으면 401이 아니라 403(Forbidden)을 반환할 수 있다
      // (Spring Security 기본 동작, ItineraryRecommendation.tsx와 동일한 처리).
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
        navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
      } else {
        toast(err instanceof ApiError ? err.message : "북마크 처리에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(placeId);
        return next;
      });
    }
  }

  if (status === "loading" || status === "idle") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">콘텐츠를 불러오는 중이에요...</p>
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
        <MapPinOff className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">콘텐츠를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          돌아가기
        </Button>
      </div>
    );
  }

  const mediaLabel = data.media ? mediaTypeLabel[data.media.type] ?? data.media.type : null;
  const relatedPlaces = places.data;

  return (
    <div className="min-h-screen">
      {/* 히어로 */}
      <div
        className={`relative h-72 md:h-96 overflow-hidden ${
          data.thumbnail_url ? "" : "bg-gradient-to-br from-navy to-navy/70"
        }`}
      >
        {data.thumbnail_url && (
          <img src={data.thumbnail_url} alt="" className="w-full h-full object-cover object-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-11 h-11 rounded-full bg-navy/50 backdrop-blur-sm hanji-noise flex items-center justify-center text-ivory hover:bg-navy/70 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 본문: 좌우 여백 px-6 */}
      <div className="max-w-2xl mx-auto px-6 -mt-24 lg:-mt-16 relative z-10 pb-44">
        {/* 타이틀 */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">
            {[mediaLabel, data.media?.release_year, ...data.categories.map((c) => c.name)]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1 className="text-[24px] font-extrabold mb-4">{data.title}</h1>
          <p className="text-foreground/80 leading-relaxed">
            {data.summary ?? "콘텐츠 소개가 아직 준비되지 않았어요."}
          </p>
        </div>

        {/* 등장인물 */}
        {/* 콘텐츠 스토리텔링 데이터(캐릭터·역사 이야기·사실 vs 각색)가 아직 채워지지 않은 경우가 많아
            (예: TMDB에서 막 가져온 콘텐츠), 섹션 자체를 숨기지 않고 관련 장소 섹션과 동일하게
            "준비중" 안내를 보여준다. */}
        <div className="mb-10">
          <h2 className="text-[16px] font-extrabold mb-4">등장인물</h2>
          {data.characters.length > 0 ? (
            <div className="space-y-0">
              {data.characters.map((c) => (
                <div
                  key={c.content_character_id}
                  className="flex items-center justify-between py-3.5 border-b border-border last:border-0"
                >
                  <div>
                    <span className="font-medium">{c.character_name}</span>
                    <span className="text-muted-foreground text-sm ml-2">{c.actor_name}</span>
                  </div>
                  {c.is_historical && <span className="text-xs text-muted-foreground">실존 인물</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">등장인물 정보를 준비 중이에요.</p>
          )}
        </div>

        {/* 역사 스토리텔링 */}
        {/* story_sections(구조화된 절)이 비어 있어도 story_intro/story_body(원문 프롬프트 그대로의
            생성 텍스트)는 채워져 있는 콘텐츠가 있어, 그 경우 원문 텍스트를 대신 보여준다. */}
        <div className="mb-10">
          <h2 className="text-[16px] font-extrabold mb-4">역사 이야기</h2>
          {data.story_sections.length > 0 ? (
            <div className="rounded-[28px] bg-card border border-border/60 shadow-[var(--shadow-md)] p-6 sm:p-8">
              <p className="text-muted-foreground text-xs text-center tracking-widest uppercase mb-7 font-semibold">
                {data.story_intro}
              </p>

              <div className="space-y-7">
                {data.story_sections.map((section, i) => (
                  <div key={section.content_story_section_id}>
                    {i > 0 && <div className="h-px bg-border mb-7" />}
                    <div className="pl-4 border-l-2 border-primary">
                      <p className="text-primary font-bold text-sm mb-2 tracking-tight">{section.keyword}</p>
                      <p className="text-foreground/80 text-sm leading-[1.9]">{section.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : data.story_body ? (
            <div className="rounded-[28px] bg-card border border-border/60 shadow-[var(--shadow-md)] p-6 sm:p-8">
              <p className="text-foreground/80 text-sm leading-[1.9]">{data.story_body}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">역사 이야기를 준비 중이에요.</p>
          )}
        </div>

        {/* 사실 vs 각색 */}
        {data.fact_checks.length > 0 && (
          <div className="mb-12">
            <div className="bg-muted/60 rounded-[28px] p-5">
              <h2 className="text-[16px] font-extrabold mb-1">사실 vs 각색</h2>
              <p className="text-sm text-muted-foreground mb-5">드라마가 역사를 어떻게 바꿨는지 확인해보세요</p>
              <div className="space-y-6">
                {data.fact_checks.map((item) => (
                  <div key={item.content_fact_check_id}>
                    <p className="font-medium text-sm mb-3">{item.topic}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-card rounded-xl p-3">
                        <p className="text-xs font-semibold text-success mb-1.5 uppercase tracking-wide">
                          사실
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/80">{item.fact}</p>
                      </div>
                      <div className="bg-card rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5 uppercase tracking-wide">
                          각색
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/80">{item.fiction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 관련 장소 */}
        {/* place 도메인 PR 병합 전까지 목록이 비어 있거나 null로 올 수 있어, 에러가 아니라
            "준비중" 안내로 처리한다. */}
        <div className="mb-10">
          <h2 className="text-[16px] font-extrabold mb-4">관련 장소</h2>
          {places.status === "loading" && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              관련 장소를 불러오는 중이에요...
            </div>
          )}
          {places.status === "done" && (!relatedPlaces || relatedPlaces.length === 0) && (
            <p className="text-sm text-muted-foreground">관련 장소 정보를 준비 중이에요.</p>
          )}
          {places.status === "done" && relatedPlaces && relatedPlaces.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {relatedPlaces.map((p) => {
                const saved = bookmarkedIds.has(p.place_id);
                return (
                  <button
                    key={p.place_id}
                    onClick={() => handleToggleBookmark(p.place_id)}
                    disabled={pendingIds.has(p.place_id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors disabled:opacity-60 ${
                      saved ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted hover:bg-muted/70"
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-primary" : ""}`} />
                    {p.name}
                    {p.category !== "미분류" && ` · ${p.category}`}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3 bg-background border-t border-border space-y-2">
        <div className="max-w-2xl mx-auto space-y-2">
          <Button onClick={() => navigate(`/app/itinerary/${data.content_id}`)} className="w-full h-12 text-[14px] font-black">
            여행 일정 보기
          </Button>
          {/* 신규 흐름(하루 루트 만들기, No.27과 별개) — 촬영지를 직접 골라 루트를 짜고 싶을 때 */}
          <Button
            variant="outline"
            onClick={() => navigate(`/app/route-builder/${data.content_id}`)}
            className="w-full h-11 text-[13px]"
          >
            촬영지 직접 골라 루트 만들기
          </Button>
        </div>
      </div>
    </div>
  );
}
