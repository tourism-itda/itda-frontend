import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { ContentCard } from "../components/ContentCard";
import { PlaceSheet, PlaceSheetData } from "../components/PlaceSheet";

const personData: Record<
  string,
  {
    id: string;
    name: string;
    role: string;
    years: string;
    description: string;
    image: string;
    achievements: string[];
    contents: Array<{ id: string; title: string; genre: string; era: string; image: string }>;
    places: Array<{ id: string; name: string; location: string; category: string; image: string; description: string; address: string; hours: string }>;
  }
> = {
  "1": {
    id: "1",
    name: "세종대왕",
    role: "조선 4대 왕",
    years: "1397 – 1450",
    description:
      "훈민정음을 창제하고 과학기술과 문화를 꽃피운 조선의 성군입니다. 집현전 학사들과 함께 백성을 위한 정치를 고민했으며, 재위 기간 동안 조선의 정치·문화·과학이 크게 발전했습니다.",
    image:
      "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    achievements: [
      "훈민정음 창제 및 반포 (1443–1446)",
      "집현전 설치로 학문 진흥",
      "측우기·해시계 등 과학기구 발명",
      "4군 6진 개척으로 북방 국경 확립",
      "아악 정비 등 궁중 음악 진흥",
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
    ],
    places: [
      {
        id: "p1",
        name: "경복궁 근정전",
        location: "서울 종로구",
        category: "궁궐",
        image:
          "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "세종이 조회를 열던 법전으로, 훈민정음 반포를 비롯한 국가 대사가 이루어진 공간입니다.",
        address: "서울 종로구 사직로 161 경복궁",
        hours: "09:00 – 18:00 (월요일 휴관)",
      },
      {
        id: "p2",
        name: "세종이야기 전시관",
        location: "서울 종로구",
        category: "전시관",
        image:
          "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "광화문 지하에 위치. 훈민정음 창제 과정과 세종 시대 과학기술을 상세히 전시합니다.",
        address: "서울 종로구 세종대로 175 지하",
        hours: "10:30 – 18:30 (월요일 휴관)",
      },
    ],
  },
  "2": {
    id: "2",
    name: "이순신",
    role: "조선 명장",
    years: "1545 – 1598",
    description:
      "임진왜란 당시 23전 23승의 신화를 남긴 조선의 명장입니다. 거북선과 학익진 전술로 열세의 전력을 극복하며 나라를 구했습니다.",
    image:
      "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    achievements: [
      "한산도대첩 대승 (1592)",
      "명량대첩, 12척으로 133척 격파 (1597)",
      "『난중일기』 저술",
      "노량해전에서 전사 (1598)",
    ],
    contents: [],
    places: [
      {
        id: "p1",
        name: "진남관",
        location: "전남 여수시",
        category: "유적지",
        image:
          "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "임진왜란 당시 수군 지휘소가 있던 자리에 세워진 국내 최대 목조 건물.",
        address: "전남 여수시 동문로 11",
        hours: "09:00 – 18:00",
      },
      {
        id: "p2",
        name: "통영 한산도 이순신 유적",
        location: "경남 통영시",
        category: "유적지",
        image:
          "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "한산도대첩의 무대이자 이순신이 삼도수군통제영을 두었던 섬.",
        address: "경남 통영시 한산면 한산일주로",
        hours: "09:00 – 18:00",
      },
    ],
  },
  "3": {
    id: "3",
    name: "정조",
    role: "조선 22대 왕",
    years: "1752 – 1800",
    description:
      "수원 화성을 축성하고 실학을 장려한 조선 후기의 개혁 군주입니다. 정약용 등 실학자를 등용해 조선의 근대적 개혁을 추진했습니다.",
    image:
      "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    achievements: [
      "규장각 설치 (1776)",
      "수원 화성 축성 (1794–1796)",
      "정약용 등 실학자 등용",
      "신해통공으로 상업 자유화 (1791)",
    ],
    contents: [
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
        name: "화성행궁",
        location: "경기 수원시",
        category: "행궁",
        image:
          "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "정조가 아버지 사도세자의 능을 참배하러 올 때 머문 행궁.",
        address: "경기 수원시 팔달구 정조로 825",
        hours: "09:00 – 18:00 (월요일 휴관)",
      },
      {
        id: "p2",
        name: "장안문",
        location: "경기 수원시",
        category: "성문",
        image:
          "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "수원 화성의 북문으로, 4대 성문 중 가장 크고 웅장합니다.",
        address: "경기 수원시 팔달구 장안동 22-1",
        hours: "24시간",
      },
    ],
  },
  "4": {
    id: "4",
    name: "연산군",
    role: "조선 10대 왕",
    years: "1476 – 1506",
    description:
      "생모 폐비 윤씨의 죽음을 알게 된 뒤 폭정을 거듭하다 결국 반정으로 폐위된 조선의 왕입니다. 시문에 능하고 총명했으나 극단적인 통치로 기억됩니다.",
    image:
      "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    achievements: [
      "무오사화 (1498)",
      "갑자사화 (1504)",
      "언론 탄압과 사간원 폐지",
      "중종반정으로 폐위 (1506)",
    ],
    contents: [
      {
        id: "102",
        title: "왕의 남자",
        genre: "사극 영화",
        era: "조선 연산군",
        image:
          "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
      },
    ],
    places: [
      {
        id: "p1",
        name: "창경궁",
        location: "서울 종로구",
        category: "궁궐",
        image:
          "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "연산군이 자주 거처했던 궁궐 중 하나로, 성종과 폐비 윤씨의 사연이 얽혀 있습니다.",
        address: "서울 종로구 창경궁로 185",
        hours: "09:00 – 18:00 (월요일 휴관)",
      },
      {
        id: "p2",
        name: "강화도 유배지 터",
        location: "인천 강화군",
        category: "유적지",
        image:
          "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "중종반정으로 폐위된 연산군이 유배되어 생을 마감한 곳으로 전해지는 터.",
        address: "인천 강화군 강화읍",
        hours: "24시간",
      },
    ],
  },
};

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const person = personData[id ?? "1"] ?? personData["1"];
  const [sheetPlace, setSheetPlace] = useState<PlaceSheetData | null>(null);

  return (
    <div className="min-h-screen pb-8">
      {/* 히어로 이미지 */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-white/80 text-sm mb-1">{person.role}</p>
          <h1 className="text-white text-3xl font-bold leading-tight">{person.name}</h1>
          <p className="text-white/70 text-sm mt-1">{person.years}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-8 mt-6">
        {/* 설명 */}
        <section>
          <p className="text-foreground leading-relaxed">{person.description}</p>
        </section>

        {/* 주요 업적 */}
        <section>
          <h2 className="mb-5">주요 업적</h2>
          <div className="divide-y divide-border border-t border-b border-border">
            {person.achievements.map((fact, i) => (
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
        {person.contents.length > 0 && (
          <section>
            <h2 className="mb-5">관련 사극</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {person.contents.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          </section>
        )}

        {/* 관련 역사 장소 */}
        <section>
          <h2 className="mb-5">관련 장소</h2>
          <div className="space-y-3">
            {person.places.map((place) => (
              <button
                key={place.id}
                className="w-full bg-card border border-border rounded-2xl overflow-hidden flex gap-4 p-4 hover:shadow-sm transition-shadow text-left group"
                onClick={() =>
                  setSheetPlace({
                    id: `${person.id}-${place.id}`,
                    name: place.name,
                    category: place.category,
                    address: place.address,
                    hours: place.hours,
                    image: place.image,
                    description: place.description,
                  })
                }
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
