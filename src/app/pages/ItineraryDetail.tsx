import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Loader2, LogIn, MapPinOff, Pencil, Save, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { MapView } from "../components/MapView";
import { PlaceSheet, PlaceSheetData } from "../components/PlaceSheet";
import { PlaceSlotCard } from "../components/PlaceSlotCard";
import { ApiError } from "../lib/api";
import {
  ItineraryDetail as ItineraryDetailData,
  ItineraryDetailPlace,
  ItineraryPlaceStatus,
  getItineraryDetail,
  updateItinerary,
} from "../lib/itineraries";

/**
 * 저장된 일정 상세(No.30 GET /api/itineraries/:id). 스펙상 추천 미리보기 화면
 * (ItineraryRecommendation)과 레이아웃을 공유하도록 되어 있어, 슬롯 카드는
 * components/PlaceSlotCard.tsx를 그대로 재사용한다.
 *
 * 이번 범위는 제목/날짜 수정까지다 — 장소 순서 재배치·추가/삭제 UI는 범위 밖.
 * PATCH로 places를 보내면 전체 교체되는 API라 잘못 건드리면 데이터가 날아가므로,
 * places 재배치가 필요해지면 lib/itineraries.ts의 UpdateItineraryPayload.places를 참고해서
 * 별도로 구현해야 한다(TODO).
 */

type Status = "loading" | "done" | "not-found" | "unauthenticated" | "error";

const statusLabels: Record<ItineraryPlaceStatus, string> = {
  PENDING: "확인 필요",
  CONFIRMED: "확정",
  CHANGED: "변경됨",
};

export default function ItineraryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>("loading");
  const [detail, setDetail] = useState<ItineraryDetailData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetPlace, setSheetPlace] = useState<PlaceSheetData | null>(null);

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTravelDate, setEditTravelDate] = useState("");
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
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
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
    setShowEditSheet(true);
  }

  async function handleSaveEdit() {
    if (!id || !detail || !editTitle.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await updateItinerary(id, {
        title: editTitle.trim(),
        travel_date: editTravelDate || undefined,
      });
      const savedTitle = editTitle.trim();
      const savedDate = editTravelDate || detail.travel_date;
      setDetail((prev) => (prev ? { ...prev, title: savedTitle, travel_date: savedDate } : prev));
      toast("일정이 수정되었습니다.");
      setShowEditSheet(false);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
        navigate("/login");
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
          <Button onClick={() => navigate("/login")}>로그인하기</Button>
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
              <MapView places={mapPlaces} selectedPlace={selectedId} />
            </div>
            <div className="p-4 space-y-5 pb-10">{renderPlaceList()}</div>
          </div>

          {/* 데스크탑 2분할 */}
          <div className="hidden lg:flex h-[calc(100vh-101px)]">
            <div className="w-[520px] border-r border-border overflow-y-auto flex flex-col">
              <div className="flex-1 p-5 space-y-5">{renderPlaceList()}</div>
            </div>
            <div className="flex-1">
              <MapView places={mapPlaces} selectedPlace={selectedId} />
            </div>
          </div>
        </>
      )}

      {/* 수정 바텀시트 — 제목/날짜만. 장소 재배치는 범위 밖(TODO) */}
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
