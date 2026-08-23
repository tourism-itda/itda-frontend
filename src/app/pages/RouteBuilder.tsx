import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  MapPin,
  MapPinOff,
  Moon,
  Save,
  Sparkles,
  TriangleAlert,
  User,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { ApiError } from "../lib/api";
import { ItinerarySavePlace, saveItinerary } from "../lib/itineraryRecommend";
import {
  ContentPlaceListItem,
  RouteCandidate,
  RouteFillableType,
  RoutePlace,
  RoutePlanResult,
  RouteSlot,
  createRoute,
  getContentPlaces,
  getRouteCandidates,
  importPlace,
} from "../lib/routeBuilder";

/**
 * "하루 루트 만들기" 1~4단계 — 촬영지 선택 → 루트 생성 미리보기 → 빈 슬롯(식당/카페) 후보 조회 →
 * 후보를 place로 확정 → 플래너에 저장. 명세서 v4에 없는 신규 흐름이라 기존 No.27 기반
 * ItineraryRecommendation.tsx(콘텐츠 자동 추천)와는 완전히 별개 화면/라우트다. 저장은 그 화면의
 * handleSave()와 동일하게 기존 No.28 POST /api/itineraries(saveItinerary, lib/itineraryRecommend.ts)를
 * 그대로 재사용한다 — 새 저장 API는 없다.
 */

const ALLOWANCE_OPTIONS = [2000, 3000, 5000] as const;

const MAX_SPOTS = 3;

type SelectStatus = "loading" | "done" | "not-found" | "error";

type Step = "select" | "preview";

const filledByBadge: Record<string, { label: string; icon: typeof User; className: string }> = {
  USER: { label: "직접 선택", icon: User, className: "bg-primary/10 text-primary" },
  CURATED: { label: "AI 추천", icon: Sparkles, className: "bg-accent/10 text-accent" },
  SCORED: { label: "자동 선택", icon: Sparkles, className: "bg-muted text-muted-foreground" },
};

const slotTypeLabelFallback: Record<string, string> = {
  SPOT: "촬영지",
  RESTAURANT: "식당",
  CAFE: "카페",
};

function RouteSlotCard({ slot, onOpenCandidates }: { slot: RouteSlot; onOpenCandidates: (slot: RouteSlot) => void }) {
  if (slot.filled_by === "EMPTY" || !slot.place) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 flex items-center justify-between gap-3 bg-muted/30">
        <div>
          <p className="text-sm font-semibold">{slot.label || slotTypeLabelFallback[slot.slot_type]}</p>
          <p className="text-sm text-muted-foreground mt-0.5">여기에 {slotTypeLabelFallback[slot.slot_type]}을(를) 골라주세요</p>
        </div>
        <button
          onClick={() => onOpenCandidates(slot)}
          className="shrink-0 h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          후보 보기
        </button>
      </div>
    );
  }

  const place = slot.place;
  const badge = filledByBadge[slot.filled_by];

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold shrink-0">{slot.label}</span>
          {slot.estimated_time && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="w-3 h-3" />
              {slot.estimated_time}
            </span>
          )}
        </div>
        {badge && (
          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0 ${badge.className}`}>
            <badge.icon className="w-3 h-3" />
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex gap-3 p-4">
        {place.image_url ? (
          <img src={place.image_url} alt={place.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-muted shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-1.5 bg-muted text-foreground">
            {place.category}
          </span>
          <h3 className="font-medium mb-1 leading-tight">{place.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mb-1">{place.address}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {place.opening_hours && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {place.opening_hours}
              </span>
            )}
            {place.night_open && (
              <span className="flex items-center gap-1 text-accent">
                <Moon className="w-3 h-3" />
                야간 영업
              </span>
            )}
          </div>
        </div>
      </div>

      {slot.reason && (
        <p className="text-xs text-muted-foreground px-4 pb-3 italic">"{slot.reason}"</p>
      )}
    </div>
  );
}

function formatMeters(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

interface CandidateSheetState {
  visitOrder: number;
  slotLabel: string;
  slotType: RouteFillableType;
  startPlaceId: number;
  endPlaceId?: number;
}

type CandidateStatus = "loading" | "done" | "error";

function CandidateSheet({
  sheet,
  status,
  candidates,
  partialCoverage,
  allowanceMeters,
  onChangeAllowance,
  onRefreshMore,
  importingExternalId,
  onSelect,
  onClose,
}: {
  sheet: CandidateSheetState;
  status: CandidateStatus;
  candidates: RouteCandidate[];
  partialCoverage: boolean;
  allowanceMeters: number;
  onChangeAllowance: (m: number) => void;
  onRefreshMore: () => void;
  importingExternalId: string | null;
  onSelect: (candidate: RouteCandidate) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm hanji-noise" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-t-2xl lg:rounded-2xl w-full max-w-md max-h-[85vh] shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg">{sheet.slotLabel} 후보</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 허용거리 선택 */}
        <div className="px-5 pb-3 flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground shrink-0">허용거리</span>
          <div className="flex bg-muted rounded-full p-0.5">
            {ALLOWANCE_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChangeAllowance(m)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  allowanceMeters === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {formatMeters(m)}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 overflow-y-auto">
          {partialCoverage && (
            <div className="flex items-start gap-2 rounded-xl bg-accent/10 text-accent text-sm p-3 mb-3">
              <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>두 촬영지가 멀리 떨어져 있어 중간 지역의 후보는 찾지 못했어요.</p>
            </div>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-sm">후보를 불러오는 중이에요...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <MapPinOff className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">후보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
            </div>
          )}

          {status === "done" && candidates.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <MapPin className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">이 구간엔 등록된 곳이 없어요.</p>
            </div>
          )}

          {status === "done" && candidates.length > 0 && (
            <div className="space-y-2">
              {candidates.map((candidate) => (
                <button
                  key={candidate.external_id}
                  onClick={() => onSelect(candidate)}
                  disabled={importingExternalId !== null}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border text-left hover:bg-muted/30 transition-colors disabled:opacity-60"
                >
                  {candidate.image_url ? (
                    <img src={candidate.image_url} alt={candidate.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-1 bg-muted text-foreground">
                      {candidate.category}
                    </span>
                    <p className="font-medium text-sm leading-tight line-clamp-1">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{candidate.address}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {candidate.detour_known ? `동선 +${formatMeters(candidate.detour_meters)}` : "가까운 순"}
                    </p>
                  </div>
                  {importingExternalId === candidate.external_id && (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  )}
                </button>
              ))}
              <button
                onClick={onRefreshMore}
                disabled={importingExternalId !== null}
                className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
              >
                다른 곳 보기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RouteBuilder() {
  const navigate = useNavigate();
  const { contentId: contentIdParam } = useParams<{ contentId: string }>();
  const contentId =
    contentIdParam !== undefined && !Number.isNaN(Number(contentIdParam)) ? Number(contentIdParam) : undefined;

  const [step, setStep] = useState<Step>("select");

  const [selectStatus, setSelectStatus] = useState<SelectStatus>("loading");
  const [places, setPlaces] = useState<ContentPlaceListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [route, setRoute] = useState<RoutePlanResult | null>(null);

  useEffect(() => {
    if (contentId === undefined) return;
    let cancelled = false;
    setSelectStatus("loading");

    getContentPlaces(contentId)
      .then((result) => {
        if (cancelled) return;
        setPlaces(result);
        setSelectStatus("done");
      })
      .catch((err) => {
        if (cancelled) return;
        setSelectStatus(err instanceof ApiError && err.status === 404 ? "not-found" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [contentId]);

  function toggleSelect(placeId: number) {
    setSelectedIds((prev) => {
      if (prev.includes(placeId)) return prev.filter((id) => id !== placeId);
      if (prev.length >= MAX_SPOTS) return prev;
      return [...prev, placeId];
    });
  }

  async function handleCreateRoute(spotPlaceIds: number[]) {
    if (contentId === undefined || isCreating) return;
    setIsCreating(true);
    try {
      const result = await createRoute({
        content_id: contentId,
        spot_place_ids: spotPlaceIds.length > 0 ? spotPlaceIds : undefined,
      });
      setRoute(result);
      setStep("preview");
    } catch (err) {
      toast(
        err instanceof ApiError
          ? err.message
          : "루트를 만들지 못했어요. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsCreating(false);
    }
  }

  const hasPartialCoverage = route?.segments.some((s) => s.partial_coverage) ?? false;

  // ─── 3~4단계: 빈 슬롯 후보 조회 → place로 확정 ───
  const [candidateSheet, setCandidateSheet] = useState<CandidateSheetState | null>(null);
  const [candidateStatus, setCandidateStatus] = useState<CandidateStatus>("loading");
  const [candidates, setCandidates] = useState<RouteCandidate[]>([]);
  const [candidatePartialCoverage, setCandidatePartialCoverage] = useState(false);
  const [candidateAllowance, setCandidateAllowance] = useState<number>(ALLOWANCE_OPTIONS[1]);
  const [excludedExternalIds, setExcludedExternalIds] = useState<string[]>([]);
  const [importingExternalId, setImportingExternalId] = useState<string | null>(null);

  function fetchCandidates(sheet: CandidateSheetState, allowance: number, exclude: string[]) {
    setCandidateStatus("loading");
    getRouteCandidates({
      startPlaceId: sheet.startPlaceId,
      endPlaceId: sheet.endPlaceId,
      slotType: sheet.slotType,
      allowanceMeters: allowance,
      excludeExternalIds: exclude,
    })
      .then((result) => {
        setCandidates(result.candidates);
        setCandidatePartialCoverage(result.partial_coverage);
        setCandidateAllowance(result.allowance_meters);
        setCandidateStatus("done");
      })
      .catch(() => {
        setCandidateStatus("error");
      });
  }

  function openCandidates(slot: RouteSlot) {
    if (!route || slot.segment_index === undefined) return;
    // 후보 조회 대상은 RESTAURANT/CAFE뿐이다 — SPOT을 보내면 400이라 여기서 미리 막는다.
    if (slot.slot_type !== "RESTAURANT" && slot.slot_type !== "CAFE") return;
    const segment = route.segments.find((s) => s.segment_index === slot.segment_index);
    if (!segment) return;

    const sheet: CandidateSheetState = {
      visitOrder: slot.visit_order,
      slotLabel: slot.label || slotTypeLabelFallback[slot.slot_type],
      slotType: slot.slot_type,
      startPlaceId: segment.start_place_id,
      endPlaceId: segment.end_place_id,
    };
    setCandidateSheet(sheet);
    setExcludedExternalIds([]);
    fetchCandidates(sheet, candidateAllowance, []);
  }

  function handleChangeAllowance(m: number) {
    if (!candidateSheet) return;
    setCandidateAllowance(m);
    // 허용거리를 바꾸면 후보 구성 자체가 달라지므로 "이미 보여준 곳" 목록도 리셋한다.
    setExcludedExternalIds([]);
    fetchCandidates(candidateSheet, m, []);
  }

  function handleRefreshMore() {
    if (!candidateSheet) return;
    const nextExcluded = [...excludedExternalIds, ...candidates.map((c) => c.external_id)];
    setExcludedExternalIds(nextExcluded);
    fetchCandidates(candidateSheet, candidateAllowance, nextExcluded);
  }

  async function handleSelectCandidate(candidate: RouteCandidate) {
    if (!candidateSheet || importingExternalId) return;
    setImportingExternalId(candidate.external_id);
    try {
      const imported = await importPlace({
        external_id: candidate.external_id,
        place_type: candidateSheet.slotType,
      });
      // import 응답엔 image_url이 없다 — 후보 카드에서 이미 갖고 있던 값을 재사용한다.
      const place: RoutePlace = {
        place_id: imported.place_id,
        place_type: imported.place_type,
        name: imported.name,
        category: imported.category,
        address: imported.address,
        image_url: candidate.image_url,
        opening_hours: imported.opening_hours,
        night_open: imported.night_open,
        latitude: imported.latitude,
        longitude: imported.longitude,
      };

      setRoute((prev) =>
        prev
          ? {
              ...prev,
              slots: prev.slots.map((s) =>
                s.visit_order === candidateSheet.visitOrder
                  ? { ...s, place, filled_by: "USER", segment_index: undefined }
                  : s
              ),
            }
          : prev
      );
      toast(`${place.name}(으)로 채웠어요.`);
      setCandidateSheet(null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "장소를 확정하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setImportingExternalId(null);
    }
  }

  // ─── 저장 (POST /api/itineraries, 기존 No.28 — ItineraryRecommendation.tsx의 handleSave와 동일) ───
  const hasEmptySlot = route ? route.slots.some((s) => s.filled_by === "EMPTY") : true;

  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveTravelDate, setSaveTravelDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!route || !saveTravelDate || hasEmptySlot || isSaving) return;

    const places: ItinerarySavePlace[] = route.slots.map((s) => ({
      // hasEmptySlot이 false일 때만 호출되므로 이 시점엔 모든 슬롯에 place가 채워져 있다.
      place_id: s.place!.place_id,
      visit_order: s.visit_order,
      // 신규 저장이라 전 슬롯 PENDING으로 시작한다(ItineraryRecommendation.tsx와 동일 컨벤션).
      status: "PENDING",
    }));

    setIsSaving(true);
    try {
      const result = await saveItinerary({
        content_id: route.content_id,
        title: saveTitle.trim() || `${route.content_title} 루트`,
        travel_date: saveTravelDate,
        region: route.region,
        // 하루 루트 만들기는 항상 단일 일자 코스라 기간 선택 UI 자체가 없다(추천 화면과 다른 점).
        duration_label: "당일치기",
        places,
      });
      toast("일정이 저장되었습니다.");
      setShowSaveSheet(false);
      navigate("/app/planner", { state: { itineraryId: result.itinerary_id } });
    } catch (err) {
      // itda-backend는 인증 필요 라우트에 토큰이 없으면 401이 아니라 403(Forbidden)을 반환할 수 있다
      // (Spring Security 기본 동작, ItineraryRecommendation.tsx와 동일한 처리).
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

  return (
    <div className="min-h-screen pb-10">
      {/* 헤더 */}
      <div className="sticky top-0 lg:top-16 z-40 bg-card border-b border-border">
        <div className="px-4 lg:px-8 py-3 flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => (step === "preview" ? setStep("select") : navigate(-1))}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base leading-tight">
              {step === "select" ? "촬영지 선택" : "루트 미리보기"}
            </h1>
            {route && step === "preview" && (
              <p className="text-sm text-muted-foreground truncate">
                {route.content_title} · {route.region}
              </p>
            )}
          </div>
        </div>
      </div>

      {step === "select" && (
        <div className="max-w-2xl mx-auto px-4 pt-5">
          {selectStatus === "loading" && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">촬영지를 불러오는 중이에요...</p>
            </div>
          )}

          {selectStatus === "not-found" && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
              <MapPinOff className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">콘텐츠를 찾을 수 없어요.</p>
              <Button variant="outline" onClick={() => navigate(-1)}>돌아가기</Button>
            </div>
          )}

          {selectStatus === "error" && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
              <MapPinOff className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">촬영지를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
            </div>
          )}

          {selectStatus === "done" && places.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
              <MapPinOff className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">이 콘텐츠에 등록된 촬영지가 없어요.</p>
            </div>
          )}

          {selectStatus === "done" && places.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                꼭 가고 싶은 촬영지를 최대 {MAX_SPOTS}곳까지 골라주세요. 고르지 않으면 자동으로 추천해드려요.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-24">
                {places.map((place) => {
                  const selected = selectedIds.includes(place.place_id);
                  const disabled = !selected && selectedIds.length >= MAX_SPOTS;
                  return (
                    <button
                      key={place.place_id}
                      onClick={() => toggleSelect(place.place_id)}
                      disabled={disabled}
                      className={`text-left rounded-xl border overflow-hidden transition-all relative ${
                        selected
                          ? "border-primary bg-primary/[0.03]"
                          : disabled
                          ? "border-border opacity-40 cursor-not-allowed"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10">
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="aspect-[4/3] bg-muted">
                        {place.image_url && (
                          <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-3">
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-1.5 bg-muted text-foreground">
                          {place.category}
                        </span>
                        <p className="font-medium text-sm leading-tight line-clamp-1">{place.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 하단 고정 액션 */}
              <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm hanji-noise border-t border-border">
                <div className="max-w-2xl mx-auto space-y-2">
                  <Button
                    onClick={() => handleCreateRoute(selectedIds)}
                    disabled={isCreating}
                    className="w-full h-12"
                  >
                    {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    루트 만들기{selectedIds.length > 0 ? ` (${selectedIds.length}곳 선택됨)` : ""}
                  </Button>
                  {selectedIds.length === 0 && (
                    <button
                      onClick={() => handleCreateRoute([])}
                      disabled={isCreating}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                    >
                      선택 없이 자동 추천으로 진행할게요
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {step === "preview" && route && (
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-28 space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground pb-2 border-b border-border">
            <span>촬영지 {route.spot_count}곳</span>
            <span>·</span>
            <span>허용거리 {(route.allowance_meters / 1000).toFixed(1)}km</span>
          </div>

          {hasPartialCoverage && (
            <div className="flex items-start gap-2 rounded-xl bg-accent/10 text-accent text-sm p-3">
              <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>두 촬영지가 멀리 떨어져 있어 일부 구간은 중간 지역의 식당·카페를 찾지 못했어요.</p>
            </div>
          )}

          <div className="space-y-3">
            {route.slots.map((slot) => (
              <RouteSlotCard key={slot.visit_order} slot={slot} onOpenCandidates={openCandidates} />
            ))}
          </div>

          {/* 하단 고정 액션 */}
          <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm hanji-noise border-t border-border">
            <div className="max-w-2xl mx-auto">
              <Button
                onClick={() => {
                  setSaveTitle("");
                  setSaveTravelDate("");
                  setShowSaveSheet(true);
                }}
                disabled={hasEmptySlot}
                className="w-full h-12"
              >
                저장하기
              </Button>
              {hasEmptySlot && (
                <p className="text-xs text-muted-foreground text-center mt-1.5">
                  아직 다 채우지 않은 칸이 있어요. 식당·카페 후보를 모두 골라주세요.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 저장 바텀시트 — ItineraryRecommendation.tsx의 저장 바텀시트와 동일 패턴 */}
      {showSaveSheet && route && (
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
                <p className="text-sm text-muted-foreground pb-1">당일치기 · 장소 {route.slots.length}곳</p>
                {route.slots.map((s) => (
                  <div key={s.visit_order} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-primary text-primary-foreground">
                      {s.visit_order}
                    </span>
                    <span className="text-foreground">{s.place?.name ?? "-"}</span>
                  </div>
                ))}
              </div>

              {/* 제목 */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2">일정 제목</label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder={`${route.content_title} 루트`}
                  className="w-full h-11 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* 날짜 선택 */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2">여행 날짜</label>
                <input
                  type="date"
                  value={saveTravelDate}
                  onChange={(e) => setSaveTravelDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full h-11 px-3 rounded-lg border border-border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <Button onClick={handleSave} disabled={!saveTravelDate || isSaving} className="w-full h-11">
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

      {candidateSheet && (
        <CandidateSheet
          sheet={candidateSheet}
          status={candidateStatus}
          candidates={candidates}
          partialCoverage={candidatePartialCoverage}
          allowanceMeters={candidateAllowance}
          onChangeAllowance={handleChangeAllowance}
          onRefreshMore={handleRefreshMore}
          importingExternalId={importingExternalId}
          onSelect={handleSelectCandidate}
          onClose={() => setCandidateSheet(null)}
        />
      )}
    </div>
  );
}
