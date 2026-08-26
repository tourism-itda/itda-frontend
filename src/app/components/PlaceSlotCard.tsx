import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Bookmark, Clock, Info, Loader2, Navigation, Shuffle } from "lucide-react";
import { ApiError } from "../lib/api";
import { createBookmark, deleteBookmark, findBookmarkId } from "../lib/bookmarksApi";

/**
 * ItineraryRecommendation(추천 미리보기)과 ItineraryDetail(저장된 일정 상세)이 함께 쓰는
 * 슬롯 카드. 두 화면의 place 응답(ItineraryRecommendPlace / ItineraryDetailPlace)은 필드명이
 * 겹치는 부분만 뽑아 쓰므로 별도 어댑터 없이 그대로 넘길 수 있다.
 */
export interface SlotCardPlace {
  place_id: number;
  name: string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  opening_hours: string | null;
  to_next_distance_m?: number | null;
  to_next_duration_min?: number | null;
}

const categoryVariantCycle = ["primary", "secondary", "accent", "support"] as const;
const categoryVariantStyles: Record<(typeof categoryVariantCycle)[number], string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-muted text-foreground",
  accent: "bg-accent/10 text-accent",
  support: "bg-muted text-foreground",
};
function categoryStyleFor(visitOrder: number): string {
  return categoryVariantStyles[categoryVariantCycle[(visitOrder - 1) % categoryVariantCycle.length]];
}

function formatDistance(m: number | null | undefined): string | null {
  if (m === null || m === undefined) return null;
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

function formatDuration(min: number | null | undefined): string | null {
  if (min === null || min === undefined) return null;
  return `도보 ${min}분`;
}

interface PlaceSlotCardProps {
  place: SlotCardPlace;
  visitOrder: number;
  isSelected: boolean;
  onSelect: () => void;
  onOpenDetail: () => void;
  /** 추천 미리보기(저장 전) 전용 — "확정" 토글. 저장된 일정 상세에서는 생략한다. */
  confirmed?: boolean;
  onConfirm?: () => void;
  /**
   * 추천 미리보기 전용 — "다른 곳 추천"(GET /api/places/alternative). 저장된 일정 상세는
   * 이미 확정된 일정이라 넣지 않는다. confirmed 상태에서는 비활성화한다.
   */
  onSwap?: () => void;
  swapping?: boolean;
  /** 저장된 일정 상세 전용 — 서버에 저장된 status를 읽기 전용 배지로 보여준다. */
  statusLabel?: string;
}

export function PlaceSlotCard({
  place,
  visitOrder,
  isSelected,
  onSelect,
  onOpenDetail,
  confirmed,
  onConfirm,
  onSwap,
  swapping,
  statusLabel,
}: PlaceSlotCardProps) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<number | undefined>(undefined);
  const [bookmarkPending, setBookmarkPending] = useState(false);

  const distance = formatDistance(place.to_next_distance_m);
  const duration = formatDuration(place.to_next_duration_min);
  const showConfirmToggle = onConfirm !== undefined;

  async function handleToggleBookmark() {
    if (bookmarkPending) return;
    const placeId = place.place_id;
    const wasSaved = saved;

    setBookmarkPending(true);
    setSaved(!wasSaved);
    try {
      if (wasSaved) {
        let id = bookmarkId;
        if (id === undefined) {
          id = await findBookmarkId(placeId);
        }
        if (id !== undefined) {
          await deleteBookmark(id);
        }
        setBookmarkId(undefined);
      } else {
        const result = await createBookmark(placeId);
        setBookmarkId(result.bookmark_id);
      }
    } catch (err) {
      // 실패했으니 낙관적으로 바꿨던 상태를 되돌린다.
      setSaved(wasSaved);
      // itda-backend는 인증 필요 라우트에 토큰이 없으면 401이 아니라 403(Forbidden)을 반환할 수 있다
      // (Spring Security 기본 동작, ItineraryRecommendation.tsx와 동일한 처리).
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
        navigate("/login");
      } else {
        toast(err instanceof ApiError ? err.message : "북마크 처리에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setBookmarkPending(false);
    }
  }

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border overflow-hidden transition-all cursor-pointer ${
        confirmed
          ? "border-primary/40 bg-primary/[0.03] shadow-sm"
          : isSelected
          ? "border-border shadow-sm"
          : "border-border hover:border-muted-foreground/40"
      }`}
    >
      {/* 확정 상태 배너(추천 화면) / 저장 상태 배지(상세 화면) */}
      {showConfirmToggle && confirmed && (
        <div className="bg-muted/50 px-4 py-1.5">
          <span className="text-sm text-muted-foreground">확정됨</span>
        </div>
      )}
      {!showConfirmToggle && statusLabel && (
        <div className="bg-muted/50 px-4 py-1.5">
          <span className="text-sm text-muted-foreground">{statusLabel}</span>
        </div>
      )}

      <div className="flex gap-3 p-4">
        {/* 순서 번호 */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
            confirmed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {visitOrder}
        </div>

        {/* 이미지 */}
        {place.image_url ? (
          <img
            src={place.image_url}
            alt={place.name ?? ""}
            className="w-20 h-20 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-muted shrink-0" />
        )}

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          {place.category && (
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded-full mb-1.5 ${categoryStyleFor(visitOrder)}`}
            >
              {place.category}
            </span>
          )}
          <h3 className="font-medium mb-1 leading-tight">{place.name ?? "이름 미상"}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{place.description}</p>
          {place.opening_hours && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {place.opening_hours}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 이동 정보 */}
      {distance && duration && (
        <div className="px-4 pb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Navigation className="w-3.5 h-3.5" />
          다음 장소까지 {distance} · {duration}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2 px-4 pb-4 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
        {showConfirmToggle && (
          <button
            onClick={onConfirm}
            className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium transition-colors ${
              confirmed
                ? "bg-muted text-muted-foreground hover:bg-muted/80"
                : "bg-foreground text-background hover:bg-foreground/90"
            }`}
          >
            {confirmed ? "확정 취소" : "확정"}
          </button>
        )}
        <button
          onClick={onOpenDetail}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          상세보기
        </button>
        {onSwap && (
          <button
            onClick={onSwap}
            disabled={confirmed || swapping}
            title="다른 곳 추천"
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {swapping ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Shuffle className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        )}
        <button
          onClick={handleToggleBookmark}
          disabled={bookmarkPending}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
      </div>
    </div>
  );
}
