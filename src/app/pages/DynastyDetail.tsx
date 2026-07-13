import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { ContentCard } from "../components/ContentCard";
import { PlaceSheet, PlaceSheetData } from "../components/PlaceSheet";

const dynastyData: Record<
  string,
  {
    id: string;
    name: string;
    period: string;
    years: string;
    description: string;
    image: string;
    color: string;
    keyFacts: string[];
    contents: Array<{ id: string; title: string; genre: string; era: string; image: string }>;
    places: Array<{ id: string; name: string; location: string; category: string; image: string; description: string; address: string; hours: string }>;
  }
> = {
  "1": {
    id: "1",
    name: "조선",
    period: "조선왕조",
    years: "1392 – 1897",
    description:
      "태조 이성계가 개창한 왕조로, 유교를 통치 이념으로 삼아 500여 년간 한반도를 통치했습니다. 한글 창제, 경국대전 편찬 등 찬란한 문화를 꽃피웠으며, 수많은 사극 드라마와 영화의 배경이 됩니다.",
    image:
      "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    color: "primary",
    keyFacts: [
      "태조 이성계, 1392년 개국",
      "세종대왕의 훈민정음 창제 (1443)",
      "임진왜란 (1592–1598)",
      "경복궁·창덕궁·종묘 건립",
      "경국대전 완성 (1485)",
    ],
    contents: [
      {
        id: "101",
        title: "뿌리깊은 나무",
        genre: "사극 드라마",
        era: "조선 세종",
        image:
          "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      },
      {
        id: "102",
        title: "왕의 남자",
        genre: "사극 영화",
        era: "조선 연산군",
        image:
          "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      },
      {
        id: "103",
        title: "광해, 왕이 된 남자",
        genre: "사극 영화",
        era: "조선 광해군",
        image:
          "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      },
      {
        id: "105",
        title: "이산",
        genre: "사극 드라마",
        era: "조선 정조",
        image:
          "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      },
    ],
    places: [
      {
        id: "p1",
        name: "경복궁",
        location: "서울 종로구",
        category: "궁궐",
        image:
          "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "조선왕조의 정궁으로 태조 이성계가 창건. 근정전, 경회루 등 주요 전각이 복원돼 있습니다.",
        address: "서울 종로구 사직로 161",
        hours: "09:00 – 18:00 (월요일 휴관)",
      },
      {
        id: "p2",
        name: "창덕궁·후원",
        location: "서울 종로구",
        category: "궁궐",
        image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "유네스코 세계문화유산. 비원이라 불리는 후원은 왕실 휴식처였습니다.",
        address: "서울 종로구 율곡로 99",
        hours: "09:00 – 17:30 (월요일 휴관)",
      },
      {
        id: "p3",
        name: "종묘",
        location: "서울 종로구",
        category: "제례 공간",
        image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "조선 역대 왕과 왕비의 신위를 모신 사당. 유네스코 세계문화유산이자 세계무형유산.",
        address: "서울 종로구 종로 157",
        hours: "09:00 – 18:00 (화요일 휴관)",
      },
    ],
  },
  "2": {
    id: "2",
    name: "고려",
    period: "고려왕조",
    years: "918 – 1392",
    description:
      "왕건이 세운 왕조로, 불교를 국교로 삼아 화려한 고려청자와 팔만대장경 등 뛰어난 문화를 남겼습니다. 거란·몽골과의 항쟁으로 민족 저항 정신을 보여주었고, 고려사·고려도경 등 풍부한 기록을 남겼습니다.",
    image:
      "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    color: "secondary",
    keyFacts: [
      "태조 왕건, 918년 개국",
      "팔만대장경 조판 (1236–1251)",
      "고려청자 황금기 (11–12세기)",
      "거란·여진·몽골과의 항쟁",
      "공민왕의 반원 자주 정책",
    ],
    contents: [
      {
        id: "201",
        title: "태조 왕건",
        genre: "사극 드라마",
        era: "고려 태조",
        image:
          "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      },
      {
        id: "202",
        title: "무인시대",
        genre: "사극 드라마",
        era: "고려 무신정권",
        image:
          "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      },
      {
        id: "104",
        title: "육룡이 나르샤",
        genre: "사극 드라마",
        era: "고려 말 ~ 조선 초",
        image:
          "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      },
    ],
    places: [
      {
        id: "p4",
        name: "고려궁지",
        location: "강화도 강화읍",
        category: "유적지",
        image:
          "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "몽골 항쟁기 고려 임시 수도였던 강화도의 궁궐 터.",
        address: "인천 강화군 강화읍 북문길 42",
        hours: "09:00 – 18:00 (월요일 휴관)",
      },
      {
        id: "p5",
        name: "해인사 팔만대장경",
        location: "경남 합천",
        category: "문화재",
        image:
          "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "고려시대 몽골 침입 극복을 염원하며 조성한 팔만대장경 보관 사찰.",
        address: "경남 합천군 가야면 해인사길 122",
        hours: "08:30 – 18:00",
      },
    ],
  },
  "3": {
    id: "3",
    name: "삼국",
    period: "삼국시대",
    years: "기원전 57 – 668",
    description:
      "고구려·백제·신라 세 나라가 한반도를 두고 패권을 다투던 시대. 광개토대왕의 정복 전쟁, 백제의 세련된 문화, 신라의 골품제와 화랑도 등 다채로운 역사가 펼쳐집니다. 삼국통일로 한민족의 기반을 형성했습니다.",
    image:
      "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    color: "accent",
    keyFacts: [
      "고구려 광개토대왕 정복 (391–413)",
      "백제 황금문화 전성기",
      "신라 화랑도와 골품제",
      "삼국통일 (668)",
      "경주 불국사·석굴암 창건",
    ],
    contents: [
      {
        id: "301",
        title: "연개소문",
        genre: "사극 드라마",
        era: "고구려",
        image:
          "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      },
      {
        id: "302",
        title: "선덕여왕",
        genre: "사극 드라마",
        era: "신라",
        image:
          "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      },
    ],
    places: [
      {
        id: "p6",
        name: "경주 불국사",
        location: "경북 경주시",
        category: "사찰",
        image:
          "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "신라 경덕왕 때 창건된 불교 사찰. 다보탑·석가탑 등 신라 석조예술의 정수.",
        address: "경북 경주시 불국로 385",
        hours: "07:00 – 18:00",
      },
      {
        id: "p7",
        name: "석굴암",
        location: "경북 경주시",
        category: "석굴",
        image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "신라 석조 예술의 최고봉. 본존불은 동해를 향해 앉아 있어 신비로운 분위기를 자아냅니다.",
        address: "경북 경주시 불국로 873-243",
        hours: "06:30 – 18:00",
      },
      {
        id: "p8",
        name: "공주 무령왕릉",
        location: "충남 공주시",
        category: "왕릉",
        image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "백제 무령왕과 왕비의 능. 1971년 발굴로 4600여 점의 유물이 출토됐습니다.",
        address: "충남 공주시 왕릉로 37",
        hours: "09:00 – 18:00",
      },
    ],
  },
};

export default function DynastyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dynasty = dynastyData[id ?? "1"] ?? dynastyData["1"];
  const [sheetPlace, setSheetPlace] = useState<PlaceSheetData | null>(null);

  return (
    <div className="min-h-screen pb-8">
      {/* 히어로 이미지 */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        <img
          src={dynasty.image}
          alt={dynasty.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* 뒤로가기 */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* 제목 오버레이 */}
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-white/80 text-sm mb-1">{dynasty.period}</p>
          <h1 className="text-white text-3xl font-bold leading-tight">{dynasty.name}시대</h1>
          <p className="text-white/70 text-sm mt-1">{dynasty.years}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-8 mt-6">
        {/* 설명 */}
        <section>
          <p className="text-foreground leading-relaxed">{dynasty.description}</p>
        </section>

        {/* 주요 사실 */}
        <section>
          <h2 className="mb-5">주요 역사 사실</h2>
          <div className="divide-y divide-border border-t border-b border-border">
            {dynasty.keyFacts.map((fact, i) => (
              <div key={i} className="flex gap-4 py-3.5 px-1">
                <span className="text-muted-foreground/40 text-sm tabular-nums shrink-0 w-5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed">{fact}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 관련 사극 콘텐츠 */}
        <section>
          <h2 className="mb-5">관련 사극</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {dynasty.contents.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        </section>

        {/* 관련 역사 장소 */}
        <section>
          <h2 className="mb-5">관련 장소</h2>
          <div className="space-y-3">
            {dynasty.places.map((place) => (
              <button
                key={place.id}
                className="w-full bg-card border border-border rounded-2xl overflow-hidden flex gap-4 p-4 hover:shadow-sm transition-shadow text-left group"
                onClick={() => setSheetPlace({ id: `${dynasty.id}-${place.id}`, name: place.name, category: place.category, address: place.address, hours: place.hours, image: place.image, description: place.description })}
              >
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">{place.category} · {place.location}</p>
                  <p className="font-medium mb-1">{place.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{place.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="pt-2 pb-4">
          <Button onClick={() => navigate("/app/planner")} className="w-full" variant="outline">
            여행 일정 만들기
          </Button>
        </div>
      </div>

      <PlaceSheet place={sheetPlace} onClose={() => setSheetPlace(null)} />
    </div>
  );
}
