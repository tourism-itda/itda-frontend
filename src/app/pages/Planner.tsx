import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { CalendarX, Loader2, LogIn, MapPin, Share2, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { PageTitle } from "../components/PageTitle";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { ApiError, isLoginRequiredError } from "../lib/api";
import { ItinerarySummary, deleteItinerary, getMyItineraries } from "../lib/itineraries";
import { unshareItinerary } from "../lib/community";
import { getProxiedImageUrl } from "../lib/imageProxy";

type Status = "loading" | "done" | "unauthenticated" | "error";

export default function Planner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<Status>("loading");
  const [itineraries, setItineraries] = useState<ItinerarySummary[]>([]);
  const [pendingShareIds, setPendingShareIds] = useState<Set<number>>(new Set());
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getMyItineraries()
      .then((result) => {
        if (cancelled) return;
        setItineraries(result);
        setStatus("done");
      })
      .catch((err) => {
        if (cancelled) return;
        // 토큰이 없으면 401이 아니라 403으로 내려올 수 있다 (Spring Security 기본 동작,
        // bookmarksApi.ts/Bookmarks.tsx와 동일한 처리).
        if (isLoginRequiredError(err)) {
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggleShare(e: React.MouseEvent, item: ItinerarySummary) {
    e.stopPropagation();

    // 공유는 바로 처리하지 않고 소개/지역/태그를 입력하는 공유 페이지로 넘긴다.
    if (!item.is_shared) {
      navigate(`/app/community/write?itinerary=${item.itinerary_id}`);
      return;
    }

    if (pendingShareIds.has(item.itinerary_id)) return;

    setPendingShareIds((ids) => new Set(ids).add(item.itinerary_id));
    setItineraries((prev) =>
      prev.map((it) =>
        it.itinerary_id === item.itinerary_id ? { ...it, is_shared: false } : it
      )
    );

    try {
      const result = await unshareItinerary(item.itinerary_id);
      setItineraries((prev) =>
        prev.map((it) =>
          it.itinerary_id === item.itinerary_id ? { ...it, is_shared: result.is_shared } : it
        )
      );
      toast("공유가 해제되었습니다.");
    } catch (err) {
      setItineraries((prev) =>
        prev.map((it) =>
          it.itinerary_id === item.itinerary_id ? { ...it, is_shared: true } : it
        )
      );
      if (isLoginRequiredError(err)) {
        toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
        navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
      } else {
        toast(err instanceof ApiError ? err.message : "공유 해제에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setPendingShareIds((ids) => {
        const next = new Set(ids);
        next.delete(item.itinerary_id);
        return next;
      });
    }
  }

  function handleDeleteClick(e: React.MouseEvent, itineraryId: number) {
    e.stopPropagation();
    setDeleteTargetId(itineraryId);
  }

  async function handleConfirmDelete() {
    if (deleteTargetId === null || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteItinerary(deleteTargetId);
      setItineraries((prev) => prev.filter((it) => it.itinerary_id !== deleteTargetId));
      setDeleteTargetId(null);
      toast("일정이 삭제되었습니다.");
    } catch (err) {
      if (isLoginRequiredError(err)) {
        toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
        navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
      } else {
        toast(err instanceof ApiError ? err.message : "삭제에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* 헤더: 내 플래너 + 일정 수 한 줄 */}
      <div className="border-b border-border bg-card/70 backdrop-blur-md hanji-noise sticky top-0 lg:top-16 z-40">
        <div className="max-w-7xl mx-auto px-5 py-4">
          <PageTitle
            title="내 플래너"
            suffix={
              status === "done" ? (
                <span className="text-sm text-muted-foreground">일정 {itineraries.length}개</span>
              ) : undefined
            }
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-7">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">플래너를 불러오는 중이에요...</p>
          </div>
        )}

        {status === "unauthenticated" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <LogIn className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">로그인이 필요한 기능이에요</p>
            <p className="text-sm text-muted-foreground/70 mb-5">로그인하고 저장한 일정을 확인해보세요</p>
            <Button onClick={() => navigate("/login", { replace: true, state: { from: location.pathname + location.search } })}>로그인하기</Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground mb-1">플래너를 불러오지 못했어요</p>
            <p className="text-sm text-muted-foreground/70">잠시 후 다시 시도해주세요</p>
          </div>
        )}

        {status === "done" && itineraries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <CalendarX className="w-10 h-10 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-6">저장된 일정이 없습니다</p>
            <Button variant="outline" onClick={() => navigate("/app")}>탐색하기</Button>
          </div>
        )}

        {status === "done" && itineraries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {itineraries.map((item) => (
              <div
                key={item.itinerary_id}
                onClick={() => navigate(`/app/planner/${item.itinerary_id}`)}
                className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
              >
                {/* 썸네일 + 오버레이 텍스트 */}
                <div className="aspect-[4/3] rounded-sm border border-border overflow-hidden relative mb-3">
                  {item.thumbnail_url ? (
                    <img
                      src={getProxiedImageUrl(item.thumbnail_url)}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* 공유 토글 + 삭제 */}
                  <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    <button
                      onClick={(e) => handleToggleShare(e, item)}
                      disabled={pendingShareIds.has(item.itinerary_id)}
                      title={item.is_shared ? "공유 해제" : "커뮤니티에 공유"}
                      className={`w-11 h-11 rounded-full backdrop-blur-sm hanji-noise flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-navy disabled:opacity-60 ${
                        item.is_shared ? "bg-primary/80 hover:bg-primary text-ivory" : "bg-navy/60 hover:bg-navy/80 text-ivory"
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, item.itinerary_id)}
                      title="삭제"
                      className="w-11 h-11 rounded-full bg-navy/60 backdrop-blur-sm hanji-noise flex items-center justify-center text-ivory hover:bg-navy/80 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 콘텐츠명 + 제목 오버레이 */}
                  <div className="absolute bottom-3 left-3 right-3">
                    {/* 영화 제목은 부제로 작고 흐리게, 루트 제목이 먼저 눈에 들어오도록 크고 굵게 둔다. */}
                    {item.content_title && (
                      <p className="text-ivory/70 text-xs mb-1 line-clamp-1">{item.content_title}</p>
                    )}
                    <p className="font-heading text-ivory text-lg font-black leading-snug line-clamp-2">{item.title}</p>
                  </div>
                </div>

                {/* 하단 메타 */}
                <p className="text-sm text-muted-foreground">
                  {[item.travel_date, item.region, `${item.place_count}곳`].filter(Boolean).join(" · ")}
                  {item.is_shared && <span className="ml-2 text-primary font-medium">공유중</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={deleteTargetId !== null}
        title="이 일정을 삭제하시겠습니까?"
        description="삭제한 일정은 복구할 수 없습니다."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
