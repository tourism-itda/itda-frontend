import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  CalendarDays,
  Clock,
  DollarSign,
  Navigation,
  Shuffle,
  Save,
  X,
  Bookmark,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { MapView } from "../components/MapView";
import { isBookmarked, toggleBookmark } from "../lib/bookmarks";
import { usePlaceLookup } from "../lib/usePlaceLookup";

interface Place {
  id: string;
  order: number;
  name: string;
  category: string;
  categoryColor: string;
  description: string;
  image: string;
  hours: string;
  fee: string;
  nextDistance: string;
  nextDuration: string;
  lat: number;
  lng: number;
}

interface SlotState {
  confirmed: boolean;
  place: Place;
}

// 각 슬롯에 대한 대안 후보 풀
const alternativePool: Record<number, Place[]> = {
  1: [
    {
      id: "p1a",
      order: 1,
      name: "경복궁",
      category: "역사 관광지",
      categoryColor: "primary",
      description: "조선 왕조의 법궁이자 세종대왕이 한글을 창제한 곳",
      image: "https://images.unsplash.com/photo-1638964663550-e2123ac8900b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      hours: "09:00 - 18:00",
      fee: "3,000원",
      nextDistance: "1.2km",
      nextDuration: "도보 15분",
      lat: 37.5796,
      lng: 126.977,
    },
    {
      id: "p1b",
      order: 1,
      name: "창덕궁",
      category: "역사 관광지",
      categoryColor: "primary",
      description: "유네스코 세계문화유산, 조선의 이궁. 후원(비원)이 유명합니다.",
      image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      hours: "09:00 - 17:30",
      fee: "3,000원",
      nextDistance: "1.0km",
      nextDuration: "도보 13분",
      lat: 37.5792,
      lng: 126.991,
    },
    {
      id: "p1c",
      order: 1,
      name: "덕수궁",
      category: "역사 관광지",
      categoryColor: "primary",
      description: "대한제국기 황궁. 석조전과 정관헌이 볼 만합니다.",
      image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      hours: "09:00 - 21:00",
      fee: "1,000원",
      nextDistance: "1.5km",
      nextDuration: "도보 18분",
      lat: 37.5657,
      lng: 126.975,
    },
  ],
  2: [
    {
      id: "p2a",
      order: 2,
      name: "북촌한옥마을",
      category: "체험",
      categoryColor: "secondary",
      description: "전통 한옥과 골목길이 보존된 역사 마을",
      image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      hours: "24시간 개방",
      fee: "무료",
      nextDistance: "800m",
      nextDuration: "도보 10분",
      lat: 37.5825,
      lng: 126.983,
    },
    {
      id: "p2b",
      order: 2,
      name: "국립민속박물관",
      category: "박물관",
      categoryColor: "secondary",
      description: "한국인의 생활·풍속·문화를 전시하는 국립 박물관",
      image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      hours: "09:00 - 18:00",
      fee: "무료",
      nextDistance: "600m",
      nextDuration: "도보 8분",
      lat: 37.581,
      lng: 126.978,
    },
    {
      id: "p2c",
      order: 2,
      name: "종묘",
      category: "유적지",
      categoryColor: "secondary",
      description: "조선 역대 왕과 왕비의 신위를 모신 유네스코 세계문화유산",
      image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      hours: "09:00 - 18:00",
      fee: "1,000원",
      nextDistance: "900m",
      nextDuration: "도보 11분",
      lat: 37.5748,
      lng: 126.994,
    },
  ],
  3: [
    {
      id: "p3a",
      order: 3,
      name: "궁중요리 전문점",
      category: "식당",
      categoryColor: "accent",
      description: "조선 왕실의 음식 문화를 재현한 한정식",
      image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      hours: "11:30 - 21:00",
      fee: "25,000원~",
      nextDistance: "500m",
      nextDuration: "도보 6분",
      lat: 37.5835,
      lng: 126.985,
    },
    {
      id: "p3b",
      order: 3,
      name: "인사동 전통 식당",
      category: "식당",
      categoryColor: "accent",
      description: "인사동 골목 속 오랜 전통의 된장찌개·비빔밥 전문점",
      image: "https://images.unsplash.com/photo-1624262536362-12cbb4965721?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      hours: "11:00 - 20:00",
      fee: "12,000원~",
      nextDistance: "400m",
      nextDuration: "도보 5분",
      lat: 37.5741,
      lng: 126.985,
    },
  ],
  4: [
    {
      id: "p4a",
      order: 4,
      name: "전통 찻집",
      category: "카페",
      categoryColor: "support",
      description: "한옥에서 즐기는 전통차와 한과",
      image: "https://images.unsplash.com/photo-1624262536362-12cbb4965721?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      hours: "10:00 - 20:00",
      fee: "8,000원~",
      nextDistance: "-",
      nextDuration: "-",
      lat: 37.584,
      lng: 126.988,
    },
    {
      id: "p4b",
      order: 4,
      name: "국립고궁박물관",
      category: "박물관",
      categoryColor: "support",
      description: "조선·대한제국 왕실 문화재 6만여 점을 소장한 박물관",
      image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      hours: "10:00 - 18:00",
      fee: "무료",
      nextDistance: "-",
      nextDuration: "-",
      lat: 37.578,
      lng: 126.975,
    },
    {
      id: "p4c",
      order: 4,
      name: "청계천 역사문화관",
      category: "전시관",
      categoryColor: "support",
      description: "청계천의 역사와 복원 과정을 다루는 전시관",
      image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      hours: "09:00 - 19:00",
      fee: "무료",
      nextDistance: "-",
      nextDuration: "-",
      lat: 37.57,
      lng: 126.999,
    },
  ],
};

function pickAlternative(slotIndex: number, excludeId: string): Place {
  const pool = alternativePool[slotIndex] ?? alternativePool[1];
  const others = pool.filter((p) => p.id !== excludeId);
  return others[Math.floor(Math.random() * others.length)] ?? pool[0];
}

const categoryVariants: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  support: "bg-[#5C7A5E]/10 text-[#5C7A5E] border-[#5C7A5E]/20",
};

const itinerarySubtitles: Record<string, string> = {
  "101": "뿌리깊은 나무 테마 · 서울",
  "102": "왕의 남자 테마 · 경기 수원",
  "103": "광해, 왕이 된 남자 테마 · 서울",
  "104": "육룡이 나르샤 테마 · 서울",
  "105": "이산 테마 · 경기 수원",
  i1: "뿌리깊은 나무 테마 여행 · 서울 종로구",
  i2: "왕의 남자 촬영지 투어 · 경기도 수원",
  i3: "육룡이 나르샤 역사탐방 · 전라북도 전주",
};

export default function ItineraryRecommendation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const subtitle = itinerarySubtitles[id ?? ""] ?? "뿌리깊은 나무 테마 · 서울";

  const [slots, setSlots] = useState<SlotState[]>([
    { confirmed: false, place: alternativePool[1][0] },
    { confirmed: false, place: alternativePool[2][0] },
    { confirmed: false, place: alternativePool[3][0] },
    { confirmed: false, place: alternativePool[4][0] },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [travelDate, setTravelDate] = useState("");
  const [tripDuration, setTripDuration] = useState("당일치기");

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

  const confirmedCount = slots.filter((s) => s.confirmed).length;

  function toggleConfirm(idx: number) {
    setSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, confirmed: !s.confirmed } : s))
    );
  }

  function swapPlace(idx: number) {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === idx
          ? { ...s, place: pickAlternative(idx + 1, s.place.id) }
          : s
      )
    );
  }

  function handleSave() {
    if (!travelDate) return;
    // 실제 저장 로직은 Supabase 연동 시 추가
    setShowSaveSheet(false);
    navigate("/app/planner");
  }

  const mapPlaces = slots.map((s) => ({ ...s.place }));

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base leading-tight">추천 여행 일정</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* 확정 현황 + 여행 기간 */}
      <div className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex gap-1.5 shrink-0">
              {slots.map((s, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${s.confirmed ? "bg-foreground" : "bg-border"}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {confirmedCount === slots.length ? "모두 확정" : confirmedCount === 0 ? "장소를 확정해주세요" : `${confirmedCount}/${slots.length} 확정`}
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
                  key={slots[idx].place.id + idx}
                  slot={slots[idx]}
                  onSelect={() => setSelectedId(slots[idx].place.id)}
                  isSelected={selectedId === slots[idx].place.id}
                  onConfirm={() => toggleConfirm(idx)}
                  onSwap={() => swapPlace(idx)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* 하단 고정 액션 */}
        <div className="fixed bottom-16 left-0 right-0 lg:hidden z-40 px-4 pb-3 pt-2 bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-2xl mx-auto">
            <Button onClick={() => setShowSaveSheet(true)} className="w-full">저장하기</Button>
          </div>
        </div>
      </div>

      {/* 데스크탑 2분할 */}
      <div className="hidden lg:flex h-[calc(100vh-105px)]">
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
                    key={slots[idx].place.id + idx}
                    slot={slots[idx]}
                    onSelect={() => setSelectedId(slots[idx].place.id)}
                    isSelected={selectedId === slots[idx].place.id}
                    onConfirm={() => toggleConfirm(idx)}
                    onSwap={() => swapPlace(idx)}
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

      {/* 날짜 선택 바텀시트 */}
      {showSaveSheet && (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
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
                <p className="text-xs text-muted-foreground pb-1">{tripDuration} · 장소 {slots.length}곳</p>
                {slots.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        s.confirmed
                          ? "bg-primary text-primary-foreground"
                          : "bg-border text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={s.confirmed ? "text-foreground" : "text-muted-foreground"}>
                      {s.place.name}
                    </span>
                    {s.confirmed && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />
                    )}
                  </div>
                ))}
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
                disabled={!travelDate}
                className="w-full h-11"
              >
                <Save className="w-4 h-4 mr-2" />
                저장하고 플래너로 이동
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 장소 슬롯 카드 컴포넌트 ────────────────────────────────────────────────

interface PlaceSlotCardProps {
  slot: SlotState;
  isSelected: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  onSwap: () => void;
}

const categoryVariantsLocal: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  support: "bg-[#5C7A5E]/10 text-[#5C7A5E]",
};

function PlaceSlotCard({ slot, isSelected, onSelect, onConfirm, onSwap }: PlaceSlotCardProps) {
  const { place, confirmed } = slot;
  const [saved, setSaved] = useState(false);
  // place는 큐레이션된 후보(이름/카테고리/좌표)이고, 실제 설명·이미지·운영시간은 이름으로
  // 관광정보 API를 조회해 보강한다. 입장료·좌표는 API가 일관되게 제공하지 않아 큐레이션 값을 유지한다.
  const { status: lookupStatus, data: lookup } = usePlaceLookup(place.name);

  useEffect(() => {
    setSaved(isBookmarked(place.id));
  }, [place.id]);

  const description = lookup?.description ?? place.description;
  const image = lookup?.image ?? place.image;
  const hours = lookup?.hours ?? place.hours;

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
      {/* 확정 상태 배너 */}
      {confirmed && (
        <div className="bg-muted/50 px-4 py-1.5">
          <span className="text-xs text-muted-foreground">확정됨</span>
        </div>
      )}

      <div className="flex gap-3 p-4">
        {/* 순서 번호 */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
            confirmed
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {place.order}
        </div>

        {/* 이미지 */}
        <img
          src={image}
          alt={place.name}
          className="w-20 h-20 rounded-lg object-cover shrink-0"
        />

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded-full mb-1.5 ${
              categoryVariantsLocal[place.categoryColor] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {place.category}
          </span>
          <h3 className="font-medium mb-1 leading-tight">{place.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{description}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{hours}
              {lookupStatus === "loading" && <Loader2 className="w-3 h-3 animate-spin" />}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />{place.fee}
            </span>
            {(lookupStatus === "error" || lookupStatus === "not-found") && (
              <span className="text-muted-foreground/60">안내 정보 기준</span>
            )}
          </div>
        </div>
      </div>

      {/* 이동 정보 */}
      {place.nextDistance !== "-" && (
        <div className="px-4 pb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Navigation className="w-3.5 h-3.5" />
          다음 장소까지 {place.nextDistance} · {place.nextDuration}
        </div>
      )}

      {/* 액션 버튼 */}
      <div
        className="flex gap-2 px-4 pb-4 pt-2 border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onSwap}
          disabled={confirmed}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border border-border text-sm hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Shuffle className="w-3.5 h-3.5" />
          다른 곳 추천
        </button>
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
        <button
          onClick={() =>
            setSaved(
              toggleBookmark({
                id: place.id,
                name: place.name,
                category: place.category,
                image,
                hours,
              })
            )
          }
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
      </div>
    </div>
  );
}
