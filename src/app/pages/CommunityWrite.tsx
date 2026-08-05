import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ImagePlus, MapPin, Minus, Plus, X } from "lucide-react";
import { Textarea } from "../components/ui/textarea";
import { addUserPost } from "../lib/communityPosts";

const DEFAULT_THUMBNAIL =
  "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

const TITLE_MAX = 40;

export default function CommunityWrite() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [placeCount, setPlaceCount] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [showThumbnailInput, setShowThumbnailInput] = useState(false);

  const canSubmit = title.trim() !== "" && region.trim() !== "";

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

  function handleSubmit() {
    if (!canSubmit) return;

    addUserPost({
      id: `u-${Date.now()}`,
      title: title.trim(),
      author: "나",
      authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=me",
      rating: 0,
      reviewCount: 0,
      placeCount,
      region: region.trim(),
      thumbnail: thumbnail.trim() || DEFAULT_THUMBNAIL,
      tags,
      description: description.trim(),
    });

    navigate("/app/community");
  }

  return (
    <div className="min-h-screen pb-10">
      {/* 헤더 */}
      <div className="border-b border-border bg-card sticky top-0 lg:top-16 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 -ml-1.5 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[15px] font-medium">루트 공유하기</h1>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="text-sm font-semibold text-primary disabled:text-muted-foreground/50 transition-colors px-1"
          >
            등록
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* 대표 이미지 */}
        <div className="pt-5">
          {thumbnail ? (
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
              <img src={thumbnail} alt="대표 이미지" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <button
                onClick={() => {
                  setThumbnail("");
                  setShowThumbnailInput(false);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowThumbnailInput((v) => !v)}
                className="absolute bottom-3 right-3 h-8 px-3 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/70 transition-colors"
              >
                이미지 변경
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowThumbnailInput((v) => !v)}
              className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <ImagePlus className="w-7 h-7" />
              <span className="text-sm">대표 이미지 추가</span>
            </button>
          )}

          {showThumbnailInput && (
            <input
              autoFocus
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              onBlur={() => setShowThumbnailInput(false)}
              placeholder="이미지 URL을 입력하세요"
              className="mt-2 w-full h-10 px-3 rounded-lg border border-border bg-input-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
        </div>

        {/* 제목 */}
        <div className="pt-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            placeholder="제목을 입력하세요"
            className="w-full text-xl font-semibold placeholder:text-muted-foreground placeholder:font-normal bg-transparent outline-none border-b border-border pb-3 focus:border-foreground/40 transition-colors"
          />
          <div className="flex justify-end pt-1.5">
            <span className="text-xs text-muted-foreground/60">{title.length}/{TITLE_MAX}</span>
          </div>
        </div>

        {/* 지역 + 장소 수 */}
        <div className="flex gap-3 pt-2">
          <div className="flex-1 flex items-center gap-2 h-12 px-3 rounded-xl border border-border bg-input-background">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="지역 (예: 서울 종로구)"
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-1 h-12 px-2 rounded-xl border border-border bg-input-background shrink-0">
            <button
              onClick={() => setPlaceCount((n) => Math.max(1, n - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center text-sm tabular-nums">{placeCount}곳</span>
            <button
              onClick={() => setPlaceCount((n) => Math.min(99, n + 1))}
              className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 태그 */}
        <div className="pt-5">
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
        </div>

        {/* 내용 */}
        <div className="pt-5">
          <p className="text-xs text-muted-foreground mb-2">내용</p>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="다녀온 루트를 자유롭게 소개해주세요. 어떤 장소를 방문했고, 어떤 점이 좋았나요?"
            className="min-h-40 rounded-xl bg-input-background text-sm leading-relaxed"
          />
        </div>

        <p className="text-xs text-muted-foreground/60 pt-4">* 제목과 지역은 필수 입력 항목입니다</p>
      </div>
    </div>
  );
}
