import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check } from "lucide-react";

const fonts = [
  {
    id: "do-hyeon",
    name: "Do Hyeon",
    label: "도현",
    family: '"Do Hyeon", sans-serif',
    desc: "얇고 깔끔한 현대적인 느낌",
  },
  {
    id: "sunflower-300",
    name: "Sunflower 300",
    label: "선플라워 라이트",
    family: '"Sunflower", sans-serif',
    weight: 300,
    desc: "가늘고 가벼운, 에어리한 느낌",
  },
  {
    id: "sunflower-500",
    name: "Sunflower 500",
    label: "선플라워 미디엄",
    family: '"Sunflower", sans-serif',
    weight: 500,
    desc: "부드럽고 적당한 굵기",
  },
  {
    id: "nanum-myeongjo",
    name: "Nanum Myeongjo",
    label: "나눔명조",
    family: '"Nanum Myeongjo", serif',
    weight: 400,
    desc: "섬세한 세리프, 고급스럽지 않고 담백한",
  },
  {
    id: "black-han-sans",
    name: "Black Han Sans",
    label: "검은고딕",
    family: '"Black Han Sans", sans-serif',
    desc: "강렬하고 임팩트 있는 굵은 고딕",
  },
  {
    id: "gaegu",
    name: "Gaegu",
    label: "개구",
    family: '"Gaegu", cursive',
    weight: 400,
    desc: "손글씨 느낌, 친근하고 캐주얼한",
  },
  {
    id: "song-myung",
    name: "Song Myung",
    label: "송명",
    family: '"Song Myung", serif',
    desc: "얇은 명조, 심플하고 깨끗한 세리프",
  },
];

const sampleTitle = "역사 여행 플래너";
const sampleSection = "왕조별 탐색";
const sampleCard = "뿌리깊은 나무";
const sampleSub = "조선 세종 · 사극 드라마";

export default function FontPicker() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string | null>(null);

  function applyFont(fontId: string, family: string, weight?: number) {
    setPicked(fontId);
    const root = document.documentElement;
    root.style.setProperty("--font-display", family);
    // h1, h2에 적용
    const styleId = "font-picker-override";
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = `h1, h2 { font-family: ${family} !important; font-weight: ${weight ?? 400} !important; }`;
  }

  return (
    <div className="min-h-screen pb-10">
      {/* 헤더 */}
      <div className="sticky top-0 lg:top-16 z-40 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base leading-tight">폰트 고르기</h1>
            <p className="text-xs text-muted-foreground">h1·h2 제목에 적용될 폰트 미리보기</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-4">
        {/* 안내 */}
        <div className="bg-muted/50 rounded-xl px-4 py-3 text-sm text-muted-foreground">
          카드를 누르면 앱 전체 제목에 즉시 적용됩니다. 뒤로 가서 다른 화면에서도 확인해보세요.
        </div>

        {fonts.map((font) => (
          <button
            key={font.id}
            onClick={() => applyFont(font.id, font.family, font.weight)}
            className={`w-full text-left bg-card border rounded-2xl overflow-hidden transition-all ${
              picked === font.id
                ? "border-primary shadow-md ring-2 ring-primary/20"
                : "border-border hover:border-muted-foreground/40 hover:shadow-sm"
            }`}
          >
            {/* 폰트 미리보기 영역 */}
            <div className="px-5 pt-5 pb-4 bg-background/50">
              {/* 큰 제목 */}
              <p
                style={{ fontFamily: font.family, fontWeight: font.weight ?? 400 }}
                className="text-2xl mb-1 text-foreground leading-tight"
              >
                {sampleTitle}
              </p>
              {/* 섹션 헤딩 */}
              <p
                style={{ fontFamily: font.family, fontWeight: font.weight ?? 400 }}
                className="text-xl text-foreground/80"
              >
                {sampleSection}
              </p>
            </div>

            {/* 카드 안 샘플 (산세리프는 그대로) */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  카드 제목은 기존 폰트 유지 →
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{sampleCard}</span>
                  <span className="text-xs text-muted-foreground">{sampleSub}</span>
                </div>
              </div>
              {picked === font.id && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* 폰트 정보 */}
            <div className="px-5 py-3 border-t border-border/50 bg-muted/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">{font.label}</p>
                <p className="text-xs text-muted-foreground">{font.desc}</p>
              </div>
              <p className="text-[10px] text-muted-foreground/60 font-mono">{font.name}</p>
            </div>
          </button>
        ))}

        {/* 선택 완료 후 안내 */}
        {picked && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 text-sm text-primary text-center">
            <strong>{fonts.find((f) => f.id === picked)?.label}</strong> 적용 중 —
            뒤로 가서 다른 화면에서 확인해보세요
          </div>
        )}
      </div>
    </div>
  );
}
