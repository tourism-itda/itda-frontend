import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Save, X, Loader2, MapPinOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { MapView } from "../components/MapView";
import { useItineraryRecommendation } from "../lib/useItineraryRecommendation";
import {
  ItineraryRecommendPlace,
  ItineraryRecommendSlot,
  ItinerarySavePlace,
  getAlternativePlace,
  saveItinerary,
} from "../lib/itineraryRecommend";
import { PlaceSheet, PlaceSheetData } from "../components/PlaceSheet";
import { PlaceSlotCard } from "../components/PlaceSlotCard";
import { ApiError } from "../lib/api";

export default function ItineraryRecommendation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const contentId = id !== undefined && !Number.isNaN(Number(id)) ? Number(id) : undefined;

  const { status, data } = useItineraryRecommendation(contentId);
  // "다른 곳 추천"으로 바뀐 슬롯은 visit_order를 키로 로컬에서만 덮어쓴다(서버 저장 아님 —
  // 저장은 기존 "저장하기" 버튼에서). 콘텐츠가 바뀌면(=data 갱신) 초기화한다.
  const [placeOverrides, setPlaceOverrides] = useState<Record<number, ItineraryRecommendPlace>>({});
  const [swappingOrders, setSwappingOrders] = useState<Set<number>>(new Set());
  const slots: ItineraryRecommendSlot[] = (data?.slots ?? []).map((s) => ({
    visit_order: s.visit_order,
    place: placeOverrides[s.visit_order] ?? s.place,
  }));

  useEffect(() => {
    setPlaceOverrides({});
    setSwappingOrders(new Set());
  }, [data]);

  const [confirmedIds, setConfirmedIds] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetPlace, setSheetPlace] = useState<PlaceSheetData | null>(null);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [travelDate, setTravelDate] = useState("");
  const [tripDuration, setTripDuration] = useState("당일치기");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const durationOptions = ["당일치기", "1박 2일", "2박 3일"];
  const dayCounts: Record<string, number> = { "당일치기": 1, "1박 2일": 2, "2박 3일": 3 };
  const dayCount = dayCounts[tripDuration] ?? 1;

  // 슬롯을 선택된 여행 기간만큼 일자별로 묶기 (앞에서부터 순서대로 배분)
  const dayGroups: number[][] = Array.from({ length: dayCount }, () => []);
  {
    const base = Math.floor(slots.length / dayCount);
    let remainder = slots.length % dayCount;
    let idx = 0;
    for (let d = 0; d < dayCount; d++) {
      const size = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      for (let i = 0; i < size; i++) dayGroups[d].push(idx++);
    }
  }

  const confirmedCount = slots.filter((s) => confirmedIds.has(s.place.place_id)).length;

  function toggleConfirm(placeId: number) {
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }

  async function handleSwap(slot: ItineraryRecommendSlot) {
    if (!data || swappingOrders.has(slot.visit_order)) return;

    setSwappingOrders((prev) => new Set(prev).add(slot.visit_order));
    try {
      const result = await getAlternativePlace({
        contentId: data.content_id,
        visitOrder: slot.visit_order,
        excludePlaceId: slot.place.place_id,
      });
      const alt = result.place;
      setPlaceOverrides((prev) => ({
        ...prev,
        [slot.visit_order]: {
          place_id: alt.place_id,
          name: alt.name,
          category: alt.category,
          description: alt.description,
          image_url: alt.image_url ?? "",
          opening_hours: alt.opening_hours,
          // 대안 장소는 서버가 다음 슬롯까지의 거리/시간을 다시 계산해주지 않는다 —
          // 바뀐 위치 기준으로는 더 이상 유효하지 않은 값이라 비워둔다.
          to_next_distance_m: null,
          to_next_duration_min: null,
          latitude: alt.latitude,
          longitude: alt.longitude,
        },
      }));
    } catch (err) {
      // 대안이 더 없으면 404("더 이상 추천할 대안 장소가 없습니다") — 에러가 아니라 정상적인
      // "마지막 후보" 신호이므로 그대로 메시지를 보여준다.
      toast(err instanceof ApiError ? err.message : "다른 장소를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSwappingOrders((prev) => {
        const next = new Set(prev);
        next.delete(slot.visit_order);
        return next;
      });
    }
  }

  function openDetail(place: ItineraryRecommendPlace) {
    setSheetPlace({
      id: String(place.place_id),
      placeId: place.place_id,
      name: place.name,
      category: place.category,
      address: "",
      hours: place.opening_hours,
      image: place.image_url,
      description: place.description,
    });
  }

  async function handleSave() {
    if (!travelDate || !data || slots.length === 0) return;

    const places: ItinerarySavePlace[] = slots.map((s) => ({
      place_id: s.place.place_id,
      visit_order: s.visit_order,
      // 신규 저장이라 전 슬롯 PENDING으로 시작한다. 화면의 "확정" 토글은 저장 여부를 가르는
      // 로컬 UI 상태일 뿐, 서버 status와는 별개다.
      status: "PENDING",
    }));

    setIsSaving(true);
    try {
      const result = await saveItinerary({
        content_id: data.content_id,
        title: title.trim() || data.content_title,
        travel_date: travelDate,
        region: data.region,
        duration_label: tripDuration,
        places,
      });
      toast("일정이 저장되었습니다.");
      setShowSaveSheet(false);
      navigate("/app/planner", { state: { itineraryId: result.itinerary_id } });
    } catch (err) {
      // itda-backend는 인증 필요 라우트에 토큰이 없으면 401이 아니라 403(Forbidden)을 반환한다
      // (Spring Security 기본 동작, 실제 로컬 테스트로 확인함).
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
        navigate("/login");
      } else {
        toast(err instanceof ApiError ? err.message : "일정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const mapPlaces = slots.map((s) => ({
    id: String(s.place.place_id),
    order: s.visit_order,
    name: s.place.name,
    lat: s.place.latitude,
    lng: s.place.longitude,
    image: s.place.image_url,
    confirmed: confirmedIds.has(s.place.place_id),
  }));

  const subtitle =
    status === "loading"
      ? "불러오는 중..."
      : data
      ? `${data.content_title} · ${data.region}`
      : "";

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
            <h1 className="text-base leading-tight">추천 여행 일정</h1>
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
      </div>

      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">추천 일정을 불러오는 중이에요...</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
          <MapPinOff className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            추천 일정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            돌아가기
          </Button>
        </div>
      )}

      {status === "done" && slots.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
          <MapPinOff className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            이 콘텐츠와 연관된 추천 장소가 아직 없어요.
          </p>
        </div>
      )}

      {status === "done" && slots.length > 0 && (
        <>
          {/* 확정 현황 + 여행 기간 */}
          <div className="border-b border-border">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex gap-1.5 shrink-0">
                  {slots.map((s) => (
                    <div
                      key={s.place.place_id}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        confirmedIds.has(s.place.place_id) ? "bg-foreground" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground truncate">
                  {confirmedCount === slots.length
                    ? "모두 확정"
                    : confirmedCount === 0
                    ? "장소를 확정해주세요"
                    : `${confirmedCount}/${slots.length} 확정`}
                </span>
              </div>

              <div className="flex bg-muted rounded-full p-0.5 shrink-0">
                {durationOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTripDuration(option)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                      tripDuration === option
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 모바일 */}
          <div className="lg:hidden max-w-2xl mx-auto">
            {/* 지도 */}
            <div className="h-52 border-b border-border">
              <MapView places={mapPlaces} selectedPlace={selectedId} />
            </div>

            {/* 장소 카드 리스트 */}
            <div className="p-4 space-y-5 pb-36">
              {dayGroups.map((indices, dayIdx) => (
                <div key={dayIdx} className="space-y-3">
                  {dayCount > 1 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-sm font-semibold text-primary shrink-0">{dayIdx + 1}일차</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  {indices.map((idx) => (
                    <PlaceSlotCard
                      key={slots[idx].place.place_id}
                      place={slots[idx].place}
                      visitOrder={slots[idx].visit_order}
                      confirmed={confirmedIds.has(slots[idx].place.place_id)}
                      isSelected={selectedId === String(slots[idx].place.place_id)}
                      onSelect={() => setSelectedId(String(slots[idx].place.place_id))}
                      onConfirm={() => toggleConfirm(slots[idx].place.place_id)}
                      onOpenDetail={() => openDetail(slots[idx].place)}
                      onSwap={() => handleSwap(slots[idx])}
                      swapping={swappingOrders.has(slots[idx].visit_order)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* 하단 고정 액션 */}
            <div className="fixed bottom-16 left-0 right-0 lg:hidden z-40 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm hanji-noise border-t border-border">
              <div className="max-w-2xl mx-auto">
                <Button onClick={() => setShowSaveSheet(true)} className="w-full">저장하기</Button>
              </div>
            </div>
          </div>

          {/* 데스크탑 2분할 */}
          <div className="hidden lg:flex h-[calc(100vh-101px)]">
            <div className="w-[520px] border-r border-border overflow-y-auto flex flex-col">
              <div className="flex-1 p-5 space-y-5">
                {dayGroups.map((indices, dayIdx) => (
                  <div key={dayIdx} className="space-y-3">
                    {dayCount > 1 && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-sm font-semibold text-primary shrink-0">{dayIdx + 1}일차</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                    {indices.map((idx) => (
                      <PlaceSlotCard
                        key={slots[idx].place.place_id}
                        place={slots[idx].place}
                        visitOrder={slots[idx].visit_order}
                        confirmed={confirmedIds.has(slots[idx].place.place_id)}
                        isSelected={selectedId === String(slots[idx].place.place_id)}
                        onSelect={() => setSelectedId(String(slots[idx].place.place_id))}
                        onConfirm={() => toggleConfirm(slots[idx].place.place_id)}
                        onOpenDetail={() => openDetail(slots[idx].place)}
                        onSwap={() => handleSwap(slots[idx])}
                        swapping={swappingOrders.has(slots[idx].visit_order)}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="p-5 border-t border-border">
                <Button onClick={() => setShowSaveSheet(true)} className="w-full">저장하기</Button>
              </div>
            </div>
            <div className="flex-1">
              <MapView places={mapPlaces} selectedPlace={selectedId} />
            </div>
          </div>
        </>
      )}

      {/* 날짜 선택 바텀시트 */}
      {showSaveSheet && (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm hanji-noise"
            onClick={() => setShowSaveSheet(false)}
          />
          <div className="relative bg-card border border-border rounded-t-2xl lg:rounded-2xl w-full max-w-md max-h-[85vh] shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-5 shrink-0">
              <h2 className="text-lg">플래너에 저장</h2>
              <button
                onClick={() => setShowSaveSheet(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6 overflow-y-auto">
              {/* 일정 요약 */}
              <div className="bg-muted/50 rounded-xl p-3 mb-5 space-y-1.5">
                <p className="text-sm text-muted-foreground pb-1">{tripDuration} · 장소 {slots.length}곳</p>
                {slots.map((s) => (
                  <div key={s.place.place_id} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        confirmedIds.has(s.place.place_id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-border text-muted-foreground"
                      }`}
                    >
                      {s.visit_order}
                    </span>
                    <span
                      className={
                        confirmedIds.has(s.place.place_id) ? "text-foreground" : "text-muted-foreground"
                      }
                    >
                      {s.place.name}
                    </span>
                    {confirmedIds.has(s.place.place_id) && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* 제목 */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2">일정 제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={data?.content_title ?? "일정 제목을 입력하세요"}
                  className="w-full h-11 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* 날짜 선택 */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2">여행 날짜</label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full h-11 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={!travelDate || isSaving}
                className="w-full h-11"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                저장하고 플래너로 이동
              </Button>
            </div>
          </div>
        </div>
      )}

      <PlaceSheet place={sheetPlace} onClose={() => setSheetPlace(null)} />
    </div>
  );
}
