import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, LogIn, MapPin, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { ApiError } from "../lib/api";
import { ItinerarySummary, getMyItineraries } from "../lib/itineraries";
import { shareItinerary } from "../lib/community";

/**
 * itda-backend에는 "글 자유 작성" API가 없다 — 커뮤니티 공유는 항상 "이미 내 플래너에 있는 일정을
 * 공유 처리"하는 방식(POST /api/itineraries/:id/share)이다. 그래서 이 화면은 제목/썸네일을 새로
 * 입력받는 대신, 내 플래너에서 하나를 골라 지역/태그만 다듬어 공유하는 흐름으로 바꿨다.
 *
 * (정정) 이전 버전 주석에 "region을 생략하면 null로 덮어써진다"고 적었는데, 실제
 * Itinerary.updateRegion(region)은 null 가드가 있어(if (region != null) this.region = region)
 * 생략해도 기존 값이 유지된다 — region input을 항상 채워두는 건 안전장치일 뿐 필수는 아니다.
 */

type Status = "loading" | "done" | "unauthenticated" | "error";

export default function CommunityWrite() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [itineraries, setItineraries] = useState<ItinerarySummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [region, setRegion] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelect(item: ItinerarySummary) {
    setSelectedId(item.itinerary_id);
    setRegion(item.region ?? "");
    setTags([]);
    setTagInput("");
  }

  function addTag(raw: string) {
    const value = raw.trim();
    if (!value || tags.includes(value)) return;
    setTags((prev) => [...prev, value]);
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  async function handleSubmit() {
    if (selectedId === null || submitting) return;
    setSubmitting(true);

    try {
      const result = await shareItinerary(selectedId, {
        region: region.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      toast("커뮤니티에 공유되었습니다!");
      navigate(`/app/community/${result.itinerary_id}`);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
        navigate("/login");
      } else {
        toast(err instanceof ApiError ? err.message : "공유에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const selectedItem = itineraries.find((it) => it.itinerary_id === selectedId) ?? null;

  return (
    <div className="min-h-screen pb-10">
      {/* 헤더 */}
      <div className="border-b border-border bg-card sticky top-0 lg:top-16 z-40">
        <div className="max-w-2xl mx-auto relative h-14 flex items-center px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 -ml-2.5 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="mx-auto text-[15px] font-medium">루트 공유하기</h1>
          <button
            onClick={handleSubmit}
            disabled={selectedId === null || submitting}
            className="text-sm font-semibold text-primary disabled:text-muted-foreground/50 transition-colors px-1 shrink-0"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "공유"}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">내 플래너를 불러오는 중이에요...</p>
          </div>
        )}

        {status === "unauthenticated" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <LogIn className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">로그인이 필요한 기능이에요</p>
            <p className="text-sm text-muted-foreground/70 mb-5">로그인하고 내 플래너를 공유해보세요</p>
            <Button onClick={() => navigate("/login")}>로그인하기</Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground mb-1">내 플래너를 불러오지 못했어요</p>
            <p className="text-sm text-muted-foreground/70">잠시 후 다시 시도해주세요</p>
          </div>
        )}

        {status === "done" && itineraries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground mb-1">공유할 수 있는 일정이 없습니다</p>
            <p className="text-sm text-muted-foreground/70 mb-5">먼저 플래너에 일정을 저장해주세요</p>
            <Button variant="outline" onClick={() => navigate("/app")}>탐색하기</Button>
          </div>
        )}

        {status === "done" && itineraries.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-2">공유할 일정 선택</p>
            <div className="space-y-2 mb-6">
              {itineraries.map((item) => {
                const selected = item.itinerary_id === selectedId;
                return (
                  <button
                    key={item.itinerary_id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                    }`}
                  >
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[item.region, `${item.place_count}곳`].filter(Boolean).join(" · ")}
                        {item.is_shared && " · 공유중"}
                      </p>
                    </div>
                    {selected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedItem && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">지역</p>
                  <div className="flex items-center gap-2 h-12 px-3 rounded-xl border border-border bg-input-background">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="지역 (예: 서울 종로구)"
                      className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">태그</p>
                  <div className="flex flex-wrap items-center gap-1.5 min-h-11 px-3 py-2 rounded-xl border border-border bg-input-background">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        #{tag}
                        <button
                          onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                          className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary/20 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={() => {
                        addTag(tagInput);
                        setTagInput("");
                      }}
                      placeholder={tags.length === 0 ? "태그 입력 후 Enter (예: 사극, 궁궐)" : "추가"}
                      className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-1.5">비워두면 기존 태그가 그대로 유지됩니다</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
