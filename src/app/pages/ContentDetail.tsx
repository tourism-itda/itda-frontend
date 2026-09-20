import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPinOff, Film, Sparkles, MapPin, BookOpen, Plus, Check, Bookmark } from "lucide-react";
import { Button } from "../components/ui/button";
import { StorySourceBadge } from "../components/StorySourceBadge";
import { PlaceImage } from "../components/PlaceImage";
import { PosterImage } from "../components/PosterImage";
import { ApiError, isLoginRequiredError } from "../lib/api";
import { useContentDetail } from "../lib/useContentDetail";
import { useContentPlaces } from "../lib/useContentPlaces";
import { createBookmark, deleteBookmark, getMyBookmarks } from "../lib/bookmarksApi";
import { getProxiedImageUrl } from "../lib/imageProxy";
import type { ContentPlaceListItem } from "../lib/contents";

const mediaTypeLabel: Record<string, string> = {
  MOVIE: "영화",
  DRAMA: "드라마",
  DOCUMENTARY: "다큐멘터리",
};

// 백엔드가 한 덩어리로 주는 긴 본문을, 읽기 편하게 2문장씩 묶어 문단으로 나눈다.
function toParagraphs(text: string, perGroup = 2): string[] {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return [text.trim()];
  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += perGroup) {
    groups.push(sentences.slice(i, i + perGroup).join(" "));
  }
  return groups;
}

export default function ContentDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const contentId = id !== undefined && !Number.isNaN(Number(id)) ? Number(id) : undefined;

  const { status, data } = useContentDetail(contentId);
  const places = useContentPlaces(contentId);

  // "루트에 담기"로 고른 관련 명소 — 루트 만들기로 넘길 때 초기 선택값으로 전달한다(최대 3곳).
  // 북마크와는 별개의 상태다(담기=이번 루트 구성, 북마크=내 저장).
  const MAX_ROUTE_SPOTS = 3;
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<number[]>([]);

  function toggleSelectPlace(placeId: number) {
    setSelectedPlaceIds((prev) =>
      prev.includes(placeId)
        ? prev.filter((pid) => pid !== placeId)
        : prev.length >= MAX_ROUTE_SPOTS
          ? prev
          : [...prev, placeId],
    );
  }

  // 북마크 — 관련 명소를 내 북마크에 저장/해제한다.
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  // place_id -> bookmark_id. 서버가 목록에서 is_bookmarked만 주고 bookmark_id는 안 주므로,
  // 직접 북마크했을 때만 채워지고 그 외엔 해제 시점에 조회해서 채운다.
  const [bookmarkIds, setBookmarkIds] = useState<Map<number, number>>(new Map());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  // 로그인이 필요한 동작을 만났을 때, 사용자를 조용히 다른 화면으로 보내지 않고 "왜 필요한지"를
  // 설명하는 안내를 띄운다. 로그인 이동은 사용자가 버튼을 눌러 직접 선택할 때만 일어난다.
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);

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
      // 실패 시 낙관적 변경을 되돌린다.
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(placeId);
        else next.delete(placeId);
        return next;
      });
      // 토큰이 없으면 401 대신 403이 올 수 있다(Spring Security 기본 동작).
      // 화면을 바로 떠나보내지 않고, 왜 로그인이 필요한지 안내만 띄운다.
      if (isLoginRequiredError(err)) {
        setAuthPrompt("장소를 북마크에 저장하려면 로그인이 필요해요.");
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

  const goRouteBuilder = () =>
    navigate(`/app/route-builder/${data.content_id}`, { state: { selectedPlaceIds } });

  // 긴 본문을 2문장씩 문단으로 끊어 렌더한다(밀도 완화).
  const renderProse = (text: string, className: string) =>
    toParagraphs(text).map((para, i) => (
      <p key={i} className={`${className} mb-3 last:mb-0`}>
        {para}
      </p>
    ));

  // 관련 장소 카드. horizontal=true면 1곳만 있을 때 쓰는 가로형. 사진(3:2)은 텍스트보다 튀지 않게 둔다.
  // 북마크(이미지 위 버튼)와 "루트에 담기"(하단 버튼)는 별개의 동작이다.
  const renderPlaceCard = (p: ContentPlaceListItem, horizontal: boolean) => {
    const selected = selectedPlaceIds.includes(p.place_id);
    const atLimit = !selected && selectedPlaceIds.length >= MAX_ROUTE_SPOTS;
    const bookmarked = bookmarkedIds.has(p.place_id);
    return (
      <div
        key={p.place_id}
        className={`rounded-[16px] border overflow-hidden transition-all ${
          selected ? "border-primary ring-1 ring-primary" : "border-border"
        } ${horizontal ? "flex items-stretch gap-4" : ""}`}
      >
        <div className={`relative bg-muted overflow-hidden aspect-[3/2] ${horizontal ? "w-44 shrink-0" : ""}`}>
          <PlaceImage src={p.image_url} alt={p.name} category={p.category} className="w-full h-full object-cover" />
          {/* 북마크 — 루트에 담기와 별개로 내 북마크에 저장/해제 */}
          <button
            onClick={() => handleToggleBookmark(p.place_id)}
            disabled={pendingIds.has(p.place_id)}
            title={bookmarked ? "북마크 해제" : "북마크"}
            className={`absolute top-2 right-2 w-9 h-9 rounded-full backdrop-blur-sm hanji-noise flex items-center justify-center transition-colors disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-ivory ${
              bookmarked ? "bg-primary text-primary-foreground" : "bg-navy/50 text-ivory hover:bg-navy/70"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
          </button>
        </div>
        <div className="p-3 flex-1 min-w-0">
          <p className="font-bold text-sm line-clamp-1">{p.name}</p>
          {p.category !== "미분류" && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.category}</p>
          )}
          {/* 작품과의 연결 한 줄 — 설명이 있으면 그걸, 없으면 일반 문구를 쓴다. */}
          <p className="text-xs text-muted-foreground mt-1.5 leading-[1.6] line-clamp-2">
            {p.description ?? "작품 속 배경과 이어지는 장소"}
          </p>
          {/* 루트에 담기 — 이번 루트 구성용 선택(최대 3곳) */}
          <button
            onClick={() => toggleSelectPlace(p.place_id)}
            disabled={atLimit}
            className={`mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors disabled:opacity-50 ${
              selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
            }`}
          >
            {selected ? (
              <>
                <Check className="w-3 h-3" /> 담김
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" /> 루트에 담기
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // 역사 이야기(story) 렌더링 조각.
  const storyBadge =
    data.story_sections.length > 0 || data.story_body ? (
      <StorySourceBadge source={data.story_source ?? null} />
    ) : null;
  const storySectionsList = (
    <div className="space-y-8">
      {data.story_sections.map((section, i) => (
        <div key={section.content_story_section_id} className="flex items-start gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-bold text-primary">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-primary font-bold text-base mb-2 tracking-tight">{section.keyword}</p>
            <p className="text-foreground/90 text-[15px] leading-[1.8]">{section.body}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-[1120px] mx-auto px-4 lg:px-8">
        {/* 뒤로가기 — 스크롤해도 계속 보이도록 sticky 글라스 바. 데스크톱은 상단 헤더(h-16) 아래에 붙는다. */}
        <div className="sticky top-0 lg:top-16 z-30 -mx-4 lg:-mx-8 px-4 lg:px-8 pt-3 pb-2 bg-background/80 backdrop-blur-md hanji-noise">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 h-9 -ml-2 px-2 rounded-[8px] text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </button>
        </div>

        {/* 태그라인 — 포스터 위, 좌측정렬로 크게 강조한다. */}
        {data.tagline && (
          <p className="text-primary font-black text-3xl lg:text-4xl leading-tight tracking-[-0.02em] text-center [text-wrap:balance] pt-3 pb-8 lg:pt-4 lg:pb-10">
            “{data.tagline}”
          </p>
        )}

        <div className="lg:grid lg:grid-cols-[300px_1fr] lg:gap-12 lg:items-start mt-3">
          {/* 좌측: 작품 정보 — 정체성만 담아 컴팩트하게, 데스크톱에서 sticky */}
          <aside className="lg:sticky lg:top-32">
            <div className="flex flex-col items-center gap-4 lg:block">
              {/* 포스터 — 이미지가 없거나 깨지면 잇다 로고 플레이스홀더로 대체된다. */}
              <div className="w-40 sm:w-48 lg:w-full shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-[var(--shadow-md)] ring-1 ring-black/5 bg-muted">
                <PosterImage src={data.thumbnail_url} alt={data.title} className="w-full h-full object-cover" />
              </div>
              <div className="w-full flex-1 min-w-0 lg:mt-4 [text-wrap:pretty]">
                <p className="text-sm text-muted-foreground mb-1.5 text-center lg:text-left">
                  {[mediaLabel, data.media?.release_year, ...data.categories.map((c) => c.name)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <h1 className="text-[22px] lg:text-[24px] font-black leading-tight text-center lg:text-left">{data.title}</h1>
              </div>
            </div>
          </aside>

          {/* 우측: 콘텐츠 섹션 (읽기 편한 폭으로 제한). 좌측과 같은 상단 baseline에서 시작한다. */}
          <div className="mt-8 lg:mt-0 lg:max-w-[720px]">
            {/* 줄거리 — TMDB 원본 overview. 역사 이야기(주인공)보다 낮은 보조 위계로 작고 옅게 둔다. */}
            {data.overview && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4 text-primary" />
                  <h2 className="text-[17px] font-bold tracking-tight">작품 줄거리</h2>
                </div>
                {renderProse(data.overview, "text-muted-foreground text-[14px] leading-[1.7]")}
              </div>
            )}

            {/* 역사 이야기 — 이 페이지의 주인공. 훅 한 줄로 시작해 챕터를 여백으로 잇는다(카드 없음). */}
            <div className="mb-16 mt-14 pt-2">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-[11px] font-bold tracking-[0.18em] text-primary">HISTORY</p>
                  <h2 className="text-[20px] lg:text-[22px] font-bold tracking-tight">작품 속 실제 역사</h2>
                </div>
              </div>
              {/* 출처 배지 — 제목 아래 한 줄 */}
              {storyBadge}
              {data.story_sections.length > 0 ? (
                <div>
                  {/* 훅 한 줄 */}
                  {data.story_intro && (
                    <p className="text-[21px] lg:text-[24px] leading-[1.55] font-semibold text-foreground mb-10 max-w-[640px]">
                      {data.story_intro}
                    </p>
                  )}
                  {/* 챕터 — 흰 카드 없이 여백으로 구분 */}
                  {storySectionsList}
                </div>
              ) : data.story_body ? (
                <div className="border-l-2 border-primary/35 pl-6">
                  {renderProse(data.story_body, "text-foreground/90 text-[15px] leading-[1.8]")}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">역사 이야기를 준비 중입니다.</p>
              )}
            </div>

        {/* 사실 vs 각색 */}
        {data.fact_checks.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-[17px] font-black tracking-tight">사실 vs 각색</h2>
            </div>
            <div className="space-y-4">
              {data.fact_checks.map((item) => (
                <div key={item.content_fact_check_id} className="rounded-[16px] border border-border bg-card p-4 sm:p-5">
                  <p className="font-bold text-sm mb-3">{item.topic}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[12px] bg-success-50 dark:bg-success/10 border-l-2 border-success p-3">
                      <p className="text-xs font-bold text-success mb-1.5 tracking-wide">사실</p>
                      <p className="text-sm leading-[1.7] text-foreground/90">{item.fact}</p>
                    </div>
                    <div className="rounded-[12px] bg-amber-50 dark:bg-amber-400/10 border-l-2 border-amber-500 p-3">
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5 tracking-wide">각색</p>
                      <p className="text-sm leading-[1.7] text-foreground/90">{item.fiction}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 관련 장소 */}
        {/* place 도메인 PR 병합 전까지 목록이 비어 있거나 null로 올 수 있어, 에러가 아니라
            "준비중" 안내로 처리한다. */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-[17px] font-black tracking-tight">작품의 배경이 된 장소</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">가보고 싶은 곳을 담아 하루 루트로 이어보세요.</p>
          {places.status === "loading" && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              관련 장소를 불러오는 중입니다.
            </div>
          )}
          {/* 0곳: 빈 상태 */}
          {places.status === "done" && (!relatedPlaces || relatedPlaces.length === 0) && (
            <p className="text-sm text-muted-foreground">아직 연결된 관련 장소가 없습니다.</p>
          )}
          {/* 1곳: 가로형 카드 */}
          {places.status === "done" && relatedPlaces && relatedPlaces.length === 1 && (
            <div>{renderPlaceCard(relatedPlaces[0], true)}</div>
          )}
          {/* 2곳 이상: 그리드 */}
          {places.status === "done" && relatedPlaces && relatedPlaces.length > 1 && (
            <div className="grid grid-cols-2 gap-3">
              {relatedPlaces.map((p) => renderPlaceCard(p, false))}
            </div>
          )}

          {/* 탐색 다음 단계 — 담은 장소로 루트 만들기. 장소를 이해·선택한 뒤에 오도록 이 위치에 둔다. */}
          {places.status === "done" && relatedPlaces && relatedPlaces.length > 0 && (
            <div className="mt-8 flex flex-col items-start border-t border-border/60 pt-6">
              <Button
                onClick={goRouteBuilder}
                className="
                  h-11
                  rounded-lg
                  border border-primary
                  bg-transparent
                  px-5
                  text-sm font-semibold
                  text-primary
                  shadow-none
                  transition-all
                  hover:bg-primary
                  hover:text-white
                "
              >
                {selectedPlaceIds.length > 0
                  ? `담은 ${selectedPlaceIds.length}곳으로 루트 만들기`
                  : "이 콘텐츠로 루트 만들기"}
                <span className="ml-3 text-base font-normal">→</span>
              </Button>

              {selectedPlaceIds.length === 0 && (
                <p className="mt-2.5 text-xs leading-5 text-muted-foreground">
                  장소를 선택하지 않아도 잇다가 어울리는 여행지를 골라드려요.
                </p>
              )}
            </div>
          )}
        </div>
          </div>
        </div>
      </div>

      {/* 로그인 안내 — 자동으로 화면을 떠나지 않고, 왜 필요한지 설명한 뒤 사용자가 직접 선택하게 한다 */}
      {authPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm hanji-noise"
            onClick={() => setAuthPrompt(null)}
          />
          <div className="relative bg-card w-full max-w-xs rounded-2xl shadow-2xl p-6 text-center">
            <p className="text-base font-bold mb-1.5">로그인이 필요해요</p>
            <p className="text-sm text-muted-foreground mb-5">{authPrompt}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setAuthPrompt(null)}>
                닫기
              </Button>
              <Button
                className="flex-1"
                onClick={() =>
                  navigate("/login", { state: { from: location.pathname + location.search } })
                }
              >
                로그인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
