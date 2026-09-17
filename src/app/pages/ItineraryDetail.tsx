import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Loader2, LogIn, MapPinOff, Pencil, Save, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { MapView } from "../components/MapView";
import { PlaceSheet, PlaceSheetData } from "../components/PlaceSheet";
import { PlaceSlotCard } from "../components/PlaceSlotCard";
import { ApiError, isLoginRequiredError } from "../lib/api";
import {
  ItineraryDetail as ItineraryDetailData,
  ItineraryDetailPlace,
  ItineraryPlaceStatus,
  UpdateItineraryPlacePayload,
  getItineraryDetail,
  updateItinerary,
} from "../lib/itineraries";

/**
 * 저장된 일정 상세(No.30 GET /api/itineraries/:id). 스펙상 추천 미리보기 화면
 * (ItineraryRecommendation)과 레이아웃을 공유하도록 되어 있어, 슬롯 카드는
 * components/PlaceSlotCard.tsx를 그대로 재사용한다.
 *
 * 수정 범위: 제목/날짜 + 장소별 일자 이동·같은 날 안에서의 순서 이동.
 * 장소 추가/삭제 UI는 범위 밖. PATCH로 places를 보내면 전체 교체되는 API라
 * (UpdateItineraryPayload.places 참고) 수정 저장 시 항상 전체 장소 목록을 다시 보낸다.
 */

type Status = "loading" | "done" | "not-found" | "unauthenticated" | "error";

const statusLabels: Record<ItineraryPlaceStatus, string> = {
  PENDING: "확인 필요",
  CONFIRMED: "확정",
  CHANGED: "변경됨",
};

// 수정 바텀시트 안에서만 쓰는 로컬 편집용 타입 — day_number/visit_order만 건드린다.
interface EditPlace {
  itinerary_place_id: number;
  place_id: number;
  name: string | null;
  day_number: number;
  visit_order: number;
  status: ItineraryPlaceStatus;
  memo: string | null;
}

// 같은 day_number끼리 묶어 visit_order를 1부터 다시 매긴다(값 자체는 GET에서 온 그대로
// 써도 정렬만 맞으면 되지만, 편집 중 일자를 옮기고 나면 겹치거나 비는 값이 생기므로 정리해준다).
function renumberPlaces(list: EditPlace[]): EditPlace[] {
  const byDay = new Map<number, EditPlace[]>();
  for (const p of list) {
    const group = byDay.get(p.day_number) ?? [];
    group.push(p);
    byDay.set(p.day_number, group);
  }
  const result: EditPlace[] = [];
  Array.from(byDay.keys())
    .sort((a, b) => a - b)
    .forEach((day) => {
      const group = [...byDay.get(day)!].sort((a, b) => a.visit_order - b.visit_order);
      group.forEach((p, i) => result.push({ ...p, visit_order: i + 1 }));
    });
  return result;
}

export default function ItineraryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState<Status>("loading");
  const [detail, setDetail] = useState<ItineraryDetailData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetPlace, setSheetPlace] = useState<PlaceSheetData | null>(null);

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTravelDate, setEditTravelDate] = useState("");
  const [editPlaces, setEditPlaces] = useState<EditPlace[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setStatus("loading");

    getItineraryDetail(id)
      .then((result) => {
        if (cancelled) return;
        setDetail(result);
        setStatus("done");
      })
      .catch((err) => {
        if (cancelled) return;
        // itda-backend는 인증 필요 라우트에 토큰이 없으면 401이 아니라 403(Forbidden)을 반환할 수 있다
        // (Spring Security 기본 동작, ItineraryRecommendation.tsx와 동일한 처리).
        if (isLoginRequiredError(err)) {
          setStatus("unauthenticated");
        } else if (err instanceof ApiError && err.status === 404) {
          setStatus("not-found");
        } else {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function openEditSheet() {
    if (!detail) return;
    setEditTitle(detail.title);
    setEditTravelDate(detail.travel_date ?? "");
    setEditPlaces(
      renumberPlaces(
        detail.places.map((p) => ({
          itinerary_place_id: p.itinerary_place_id,
          place_id: p.place_id,
          name: p.name,
          day_number: p.day_number,
          visit_order: p.visit_order,
          status: p.status,
          memo: p.memo,
        }))
      )
    );
    setShowEditSheet(true);
  }

  // 편집 중인 일자 목록(오름차순) — 새 날짜를 추가할 수 있게 드롭다운 옵션도 여기서 계산한다.
  const editDayNumbers = Array.from(new Set(editPlaces.map((p) => p.day_number))).sort((a, b) => a - b);
  const maxSelectableDay = Math.min(14, Math.max(...editDayNumbers, 0) + 1);
  const dayOptions = Array.from({ length: maxSelectableDay }, (_, i) => i + 1);

  function changePlaceDay(itineraryPlaceId: number, newDay: number) {
    setEditPlaces((prev) =>
      renumberPlaces(
        prev.map((p) =>
          p.itinerary_place_id === itineraryPlaceId
            ? { ...p, day_number: newDay, visit_order: Number.MAX_SAFE_INTEGER }
            : p
        )
      )
    );
  }

  function movePlace(itineraryPlaceId: number, direction: "up" | "down") {
    setEditPlaces((prev) => {
      const target = prev.find((p) => p.itinerary_place_id === itineraryPlaceId);
      if (!target) return prev;
      const sameDay = prev.filter((p) => p.day_number === target.day_number).sort((a, b) => a.visit_order - b.visit_order);
      const idx = sameDay.findIndex((p) => p.itinerary_place_id === itineraryPlaceId);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sameDay.length) return prev;
      const other = sameDay[swapIdx];
      return prev.map((p) => {
        if (p.itinerary_place_id === target.itinerary_place_id) return { ...p, visit_order: other.visit_order };
        if (p.itinerary_place_id === other.itinerary_place_id) return { ...p, visit_order: target.visit_order };
        return p;
      });
    });
  }

  async function handleSaveEdit() {
    if (!id || !detail || !editTitle.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const places: UpdateItineraryPlacePayload[] = editPlaces.map((p) => ({
        place_id: p.place_id,
        day_number: p.day_number,
        visit_order: p.visit_order,
        status: p.status,
        memo: p.memo ?? undefined,
      }));
      await updateItinerary(id, {
        title: editTitle.trim(),
        travel_date: editTravelDate || undefined,
        places,
      });
      const refreshed = await getItineraryDetail(id);
      setDetail(refreshed);
      toast("일정이 수정되었습니다.");
      setShowEditSheet(false);
    } catch (err) {
      if (isLoginRequiredError(err)) {
        toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
        navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
      } else {
        toast(err instanceof ApiError ? err.message : "일정을 수정하지 못했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function openPlaceDetail(place: ItineraryDetailPlace) {
    setSheetPlace({
      id: String(place.place_id),
      placeId: place.place_id,
      name: place.name ?? "이름 미상",
      category: place.category ?? "",
      address: "",
      hours: place.opening_hours ?? "",
      image: place.image_url ?? "",
      description: place.description ?? "",
    });
  }

  const places = detail?.places ?? [];
  // day_number 오름차순으로 이미 정렬돼서 오지만(백엔드 buildDetail), 일차별로 묶어서 보여준다.
  const dayNumbers = Array.from(new Set(places.map((p) => p.day_number))).sort((a, b) => a - b);

  const mapPlaces = places.map((p) => ({
    id: String(p.place_id),
    order: p.visit_order,
    name: p.name ?? "",
    lat: p.latitude,
    lng: p.longitude,
    image: p.image_url ?? "",
  }));

  const subtitle = detail ? [detail.content_title, detail.region].filter(Boolean).join(" · ") : "";

  function renderPlaceList() {
    if (places.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-10">저장된 장소가 없어요.</p>;
    }
    return dayNumbers.map((dayNumber) => {
      const dayPlaces = places.filter((p) => p.day_number === dayNumber);
      return (
        <div key={dayNumber} className="space-y-3">
          {dayNumbers.length > 1 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm font-semibold text-primary shrink-0">{dayNumber}일차</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}
          {dayPlaces.map((p) => (
            <PlaceSlotCard
              key={p.itinerary_place_id}
              place={p}
              visitOrder={p.visit_order}
              isSelected={selectedId === String(p.place_id)}
              onSelect={() => setSelectedId(String(p.place_id))}
              onOpenDetail={() => openPlaceDetail(p)}
              statusLabel={statusLabels[p.status]}
            />
          ))}
        </div>
      );
    });
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="sticky top-0 lg:top-16 z-40 bg-card border-b border-border">
        <div className="px-4 lg:px-8 py-3 flex items-center gap-3 max-w-2xl lg:max-w-none mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base leading-tight truncate">{detail?.title ?? "저장된 일정"}</h1>
            {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
          </div>
          {status === "done" && (
            <button
              onClick={openEditSheet}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors shrink-0"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">일정을 불러오는 중이에요...</p>
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

      {status === "not-found" && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
          <MapPinOff className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">일정을 찾을 수 없어요. 삭제되었거나 본인 소유가 아닐 수 있어요.</p>
          <Button variant="outline" onClick={() => navigate("/app/planner")}>플래너로 돌아가기</Button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
          <MapPinOff className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">일정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
        </div>
      )}

      {status === "done" && detail && (
        <>
          {/* 모바일 */}
          <div className="lg:hidden max-w-2xl mx-auto">
            <div className="h-52 border-b border-border">
              <MapView places={mapPlaces} selectedPlace={selectedId} onSelectPlace={setSelectedId} />
            </div>
            <div className="p-4 space-y-5 pb-10">{renderPlaceList()}</div>
          </div>

          {/* 데스크탑 2분할 */}
          <div className="hidden lg:flex h-[calc(100vh-101px)]">
            <div className="w-[520px] border-r border-border overflow-y-auto flex flex-col">
              <div className="flex-1 p-5 space-y-5">{renderPlaceList()}</div>
            </div>
            <div className="flex-1">
              <MapView places={mapPlaces} selectedPlace={selectedId} onSelectPlace={setSelectedId} />
            </div>
          </div>
        </>
      )}

      {/* 수정 바텀시트 — 제목/날짜 + 장소별 일자·순서 편집 */}
      {showEditSheet && (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm hanji-noise"
            onClick={() => setShowEditSheet(false)}
          />
          <div className="relative bg-card border border-border rounded-t-2xl lg:rounded-2xl w-full max-w-md max-h-[85vh] shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-5 shrink-0">
              <h2 className="text-lg">일정 수정</h2>
              <button
                onClick={() => setShowEditSheet(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6 overflow-y-auto">
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2">일정 제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium mb-2">여행 날짜</label>
                <input
                  type="date"
                  value={editTravelDate}
                  onChange={(e) => setEditTravelDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {editPlaces.length > 0 && (
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2">장소 일정</label>
                  <div className="space-y-4">
                    {editDayNumbers.map((day) => {
                      const dayPlaces = editPlaces
                        .filter((p) => p.day_number === day)
                        .sort((a, b) => a.visit_order - b.visit_order);
                      return (
                        <div key={day} className="space-y-2">
                          {editDayNumbers.length > 1 && (
                            <p className="text-xs font-semibold text-primary">{day}일차</p>
                          )}
                          {dayPlaces.map((p, i) => (
                            <div
                              key={p.itinerary_place_id}
                              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                            >
                              <span className="flex-1 min-w-0 text-sm truncate">
                                {p.name ?? "이름 미상"}
                              </span>
                              <select
                                value={p.day_number}
                                onChange={(e) => changePlaceDay(p.itinerary_place_id, Number(e.target.value))}
                                className="h-8 px-2 rounded-md border border-border bg-input text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >
                                {dayOptions.map((d) => (
                                  <option key={d} value={d}>
                                    {d}일차
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => movePlace(p.itinerary_place_id, "up")}
                                disabled={i === 0}
                                className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => movePlace(p.itinerary_place_id, "down")}
                                disabled={i === dayPlaces.length - 1}
                                className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button onClick={handleSaveEdit} disabled={!editTitle.trim() || isSaving} className="w-full h-11">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      <PlaceSheet place={sheetPlace} onClose={() => setSheetPlace(null)} />
    </div>
  );
}
