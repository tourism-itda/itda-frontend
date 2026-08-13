import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Bookmark } from "lucide-react";
import { Button } from "../components/ui/button";
import { isBookmarked, toggleBookmark } from "../lib/bookmarks";

interface HistoryStory {
  keyword: string;
  text: string;
}

interface ContentData {
  id: string | undefined;
  title: string;
  genre: string;
  era: string;
  image: string;
  plot: string;
  characters: Array<{ name: string; actor: string; historical: boolean }>;
  historyStory: {
    intro: string;
    sections: HistoryStory[];
  };
  factCheck: Array<{ topic: string; fact: string; fiction: string }>;
  relatedPlaces: Array<{ name: string; city: string }>;
}

const contentDatabase: Record<string, Omit<ContentData, "id">> = {
  "101": {
    title: "뿌리깊은 나무",
    genre: "사극 드라마",
    era: "조선 세종",
    image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    plot: "조선 세종, 한글이 탄생하던 해. 집현전 학사들이 연쇄 살인 사건의 비밀을 파헤치면서 새로운 문자를 둘러싼 권력의 음모가 드러난다.",
    characters: [
      { name: "세종대왕", actor: "한석규", historical: true },
      { name: "강채윤", actor: "장혁", historical: false },
      { name: "소이", actor: "신세경", historical: false },
    ],
    historyStory: {
      intro: "세종 · 한글 · 집현전, 실제로는 어떤 이야기였을까",
      sections: [
        {
          keyword: "억울해도 글로 쓸 수 없었던 시대",
          text: "누군가 억울한 일을 당했다. 고을 원님에게 하소연하고 싶지만, 한자를 모르니 글을 쓸 수 없다. 대신 써줄 사람을 찾아가면 돈이 든다. 그게 1443년 조선의 현실이었다. 세종은 이걸 바꾸고 싶었다. 그는 훗날 훈민정음 서문에 직접 썼다 — \"백성이 말하고자 하는 바 있어도 마침내 뜻을 펴지 못하는 자가 많다.\" 문자를 새로 만든다는 건, 세상의 질서를 다시 쓰겠다는 선언이었다.",
        },
        {
          keyword: "젊은 천재들을 모아놓은 방",
          text: "경복궁 안 집현전. 세종은 이 작은 기관을 조선 최고의 두뇌들로 채웠다. 정인지, 신숙주, 성삼문 — 대부분 20·30대였다. 세종은 그들에게 산속에서 한 달씩 책만 읽는 휴가를 줬다. 그게 '사가독서제'다. 뭔가를 시키려면 먼저 잘 먹이고 잘 쉬게 해야 한다는 걸, 600년 전 왕이 이미 알고 있었다.",
        },
        {
          keyword: "아무도 몰랐던 8년",
          text: "한글 창제는 극비였다. 반포 직전, 집현전 학사 최만리가 알아채고 상소를 올렸다. \"중국과 다른 문자를 만드는 건 스스로 오랑캐가 되는 것.\" 세종은 그를 하루 옥에 가뒀다가 풀어줬다. 그게 유일한 처벌이었다. 그리고 1446년, 훈민정음이 세상에 나왔다. 자음은 혀와 입술의 모양을, 모음은 하늘·땅·사람을 본땄다. 지금도 언어학자들은 이 문자를 '가장 과학적으로 설계된 문자'라고 부른다.",
        },
        {
          keyword: "양반은 무시했고, 백성은 받아들였다",
          text: "양반들은 한글을 '언문(상말 글자)'이라 부르며 쓰지 않았다. 그러나 궁중 여성들이 편지를 한글로 썼고, 상인들이 장부를 한글로 적었다. 임진왜란이 지난 뒤, 민간에서 한글 소설이 폭발적으로 유행했다. 세종이 심은 씨앗은 200년에 걸쳐 아래에서부터 조선을 바꿨다.",
        },
      ],
    },
    factCheck: [
      {
        topic: "한글 창제",
        fact: "세종은 1443년 훈민정음을 창제하고 1446년 반포했다. 이는 역사적 사실이다.",
        fiction: "드라마의 살인 사건과 한글 창제를 연결하는 서사는 극적 허구다.",
      },
      {
        topic: "집현전 학사들의 역할",
        fact: "정인지·신숙주·성삼문 등이 실제로 훈민정음 해례본 집필에 참여했다.",
        fiction: "드라마 속 학사들 간의 갈등과 음모 구도는 픽션이다.",
      },
      {
        topic: "경복궁",
        fact: "세종 재위 시 근정전·사정전 등에서 주요 정무가 이루어졌다.",
        fiction: "드라마 속 일부 공간 구조와 동선은 극적 효과를 위해 재구성됐다.",
      },
    ],
    relatedPlaces: [
      { name: "경복궁", city: "서울" },
      { name: "세종대왕 기념관", city: "서울" },
      { name: "광화문 세종이야기 전시관", city: "서울" },
    ],
  },

  "102": {
    title: "왕의 남자",
    genre: "사극 영화",
    era: "조선 연산군",
    image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    plot: "조선 최악의 폭군으로 기록된 연산군 시대. 광대 두 명이 왕 앞에서 세상을 풍자하다 권력의 소용돌이 속에 휘말린다.",
    characters: [
      { name: "연산군", actor: "정진영", historical: true },
      { name: "장생", actor: "감우성", historical: false },
      { name: "공길", actor: "이준기", historical: false },
    ],
    historyStory: {
      intro: "연산군 · 광대 · 폭정, 실제로는 어떤 이야기였을까",
      sections: [
        {
          keyword: "폭군인가, 오해받은 왕인가",
          text: "연산군은 조선 왕 중 가장 많은 신하를 죽인 왕이다. 그런데 그가 단순히 미쳤던 걸까. 역사학자들은 다르게 본다 — 성종 때 극도로 커진 사림파의 언론 권력에 맞선 왕권 강화였다고. 그는 시를 잘 짓고 총명했다. 다만 수단이 극단적이었을 뿐이다.",
        },
        {
          keyword: "어머니를 죽인 건 신하들이었다",
          text: "연산군의 생모 폐비 윤씨는 왕의 얼굴을 할퀴었다는 이유로 사약을 받았다. 1482년의 일이다. 연산군은 어른이 되어서야 이 사실을 알았다. 어머니가 어떻게 죽었는지 알게 된 순간부터, 그는 달라졌다. 관여한 신하들을 처형했고, 이미 죽은 자는 무덤을 파헤쳤다. 갑자사화는 폭정이기 이전에, 아들의 복수였다.",
        },
        {
          keyword: "광대만이 왕 앞에서 진실을 말할 수 있었다",
          text: "조선에서 광대는 천민이었다. 그러나 그들에겐 하나의 특권이 있었다 — 웃음 뒤에 진실을 숨길 수 있다는 것. 연산군이 궁중 공연에 광대를 자주 불러들인 건 실록에도 나온다. 신하들은 말 한마디에 목이 달아났지만, 광대의 농담은 웃음으로 넘어갔다. 영화는 바로 그 틈을 파고든다.",
        },
      ],
    },
    factCheck: [
      {
        topic: "연산군의 광대 사랑",
        fact: "연산군이 궁중에 광대를 불러 공연을 즐긴 기록이 실록에 존재한다.",
        fiction: "영화의 두 주인공 장생과 공길은 가상 인물이다.",
      },
      {
        topic: "중종반정",
        fact: "1506년 반정으로 연산군이 폐위된 것은 역사적 사실이다.",
        fiction: "반정의 세부 묘사와 광대들의 역할은 극적 허구다.",
      },
    ],
    relatedPlaces: [
      { name: "경복궁", city: "서울" },
      { name: "창경궁", city: "서울" },
      { name: "강화도 유배지 터", city: "인천" },
    ],
  },

  "103": {
    title: "광해, 왕이 된 남자",
    genre: "사극 영화",
    era: "조선 광해군",
    image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    plot: "왕의 목숨을 노리는 암살 위협 속에서, 광해군의 완벽한 대역이 15일간 왕 노릇을 하게 된다.",
    characters: [
      { name: "광해군 / 하선", actor: "이병헌", historical: true },
      { name: "도승지 허균", actor: "류승룡", historical: true },
      { name: "중전", actor: "한효주", historical: false },
    ],
    historyStory: {
      intro: "광해군 · 허균 · 중립 외교, 실제로는 어떤 이야기였을까",
      sections: [
        {
          keyword: "두 강대국 사이에서 줄타기한 왕",
          text: "임진왜란이 끝난 뒤, 동아시아에 새 패자가 등장했다 — 후금(훗날 청)이다. 명은 광해군에게 원군을 요청했다. 광해군은 군대를 보냈다. 그러나 조용히 명령을 내렸다 — \"상황 보고 알아서 해라.\" 결국 조선군은 전투 없이 후금에 항복했다. 겉으론 명을 도왔고, 실은 후금과 싸우지 않았다. 완벽한 실용 외교였다.",
        },
        {
          keyword: "허균, 반란인가 함정인가",
          text: "영화 속 허균은 실제 인물이다. 최초의 한글 소설 『홍길동전』을 쓴 그는, 광해군 시대 권력의 핵심에 있었다. 그리고 1618년, 역모 혐의로 처형됐다. 그가 진짜 반란을 꿈꿨는지 — 아직도 모른다. 정적들의 함정이었다는 설도 있다. 홍길동을 쓴 사람이 혁명을 꿈꿨을 수도, 혁명가처럼 죽음을 당했을 수도 있다.",
        },
        {
          keyword: "반정 이후, 역사가 증명했다",
          text: "1623년 서인들이 광해군을 몰아냈다. 명분은 명나라에 불충했다는 것. 새 왕 인조는 친명 정책을 밀어붙였다. 그 결과는 — 1627년 정묘호란, 1636년 병자호란. 인조는 남한산성에서 47일을 버티다 삼전도에서 무릎을 꿇었다. 광해군의 외교가 옳았는지는, 반정 이후 14년이 답을 냈다.",
        },
      ],
    },
    factCheck: [
      {
        topic: "광해군의 중립 외교",
        fact: "광해군이 명·후금 사이에서 실용적 중립 외교를 펼친 것은 역사적 사실이다.",
        fiction: "대역 광대의 존재는 완전한 픽션이다.",
      },
      {
        topic: "허균",
        fact: "허균은 실제로 광해군 시대 고위 관료였으며 역모죄로 처형됐다.",
        fiction: "영화 속 허균의 역할과 대역 사건 연루는 창작이다.",
      },
    ],
    relatedPlaces: [
      { name: "창덕궁", city: "서울" },
      { name: "남한산성", city: "경기 광주" },
      { name: "삼전도비", city: "서울 송파" },
    ],
  },

  "104": {
    title: "육룡이 나르샤",
    genre: "사극 드라마",
    era: "고려 말 ~ 조선 초",
    image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    plot: "고려 말, 이성계와 정도전을 비롯한 신흥 세력이 새 왕조 건국을 향해 나아가는 과정을 그린 이야기. 실존 인물들 사이에 가상의 무사 분이가 뒤섞여 역성혁명의 이면을 보여준다.",
    characters: [
      { name: "이성계", actor: "천호진", historical: true },
      { name: "정도전", actor: "김명민", historical: true },
      { name: "분이", actor: "신세경", historical: false },
    ],
    historyStory: {
      intro: "이성계 · 정도전 · 위화도 회군, 실제로는 어떤 이야기였을까",
      sections: [
        {
          keyword: "역성혁명의 설계자",
          text: "정도전은 삼봉이라는 호를 가진 신진사대부였다. 그는 고려의 낡은 체제로는 나라를 구할 수 없다고 봤다. 이성계라는 무장의 힘을 빌려, 새로운 왕조의 밑그림을 그렸다. 왕이 아니라 재상이 중심이 되는 나라 — 그것이 정도전이 꿈꾼 조선이었다.",
        },
        {
          keyword: "위화도에서 말머리를 돌리다",
          text: "1388년, 요동을 정벌하라는 왕명을 받은 이성계는 압록강 위화도에서 진군을 멈췄다. 그리고 말머리를 돌려 개경으로 향했다. 4대 불가론을 앞세운 이 회군으로 이성계는 군권과 정권을 동시에 장악했다. 4년 뒤, 그는 새 왕조의 태조가 된다.",
        },
        {
          keyword: "형제의 난, 아버지를 등지다",
          text: "1398년, 이방원은 정도전을 제거하고 이복 형제들을 죽였다 — 1차 왕자의 난이다. 아버지 이성계는 이 소식에 왕위를 내려놓고 함흥으로 떠났다. 새 나라를 함께 세운 아버지와 아들은, 그렇게 등을 돌렸다.",
        },
      ],
    },
    factCheck: [
      {
        topic: "위화도 회군",
        fact: "1388년 이성계가 요동 정벌군을 돌려 고려 정권을 장악한 것은 역사적 사실이다.",
        fiction: "드라마 속 이방지, 분이 등 가상 인물들의 활약은 창작이다.",
      },
      {
        topic: "정도전과 이방원의 대립",
        fact: "정도전이 재상 중심의 정치를 추구하며 이방원과 갈등한 것은 실록과 여러 사료에 기반한다.",
        fiction: "두 사람 간의 개인적 애증 서사는 극적으로 각색됐다.",
      },
    ],
    relatedPlaces: [
      { name: "경복궁", city: "서울" },
      { name: "전주 경기전", city: "전주" },
      { name: "도담삼봉", city: "충북 단양" },
    ],
  },

  "105": {
    title: "이산",
    genre: "사극 드라마",
    era: "조선 정조",
    image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    plot: "어린 시절 아버지 사도세자의 죽음을 목격한 세손 이산이, 노론 벽파의 위협 속에서 성장해 조선의 개혁 군주 정조로 즉위하기까지의 이야기.",
    characters: [
      { name: "정조 / 이산", actor: "이서진", historical: true },
      { name: "정순왕후", actor: "김여진", historical: true },
      { name: "성송연", actor: "한지민", historical: false },
    ],
    historyStory: {
      intro: "사도세자 · 정조 · 규장각, 실제로는 어떤 이야기였을까",
      sections: [
        {
          keyword: "8일간 뒤주에 갇힌 아버지",
          text: "1762년, 영조는 아들 사도세자를 뒤주에 가두라 명했다. 사도세자는 8일 만에 뒤주 안에서 세상을 떠났다 — 임오화변이다. 그의 아들 세손 이산은 이 비극을 곁에서 지켜보며 자랐다.",
        },
        {
          keyword: "세손, 죽음의 위협 속에서 자라다",
          text: "노론 벽파에게 세손은 죄인의 아들이었다. 정조 즉위 이듬해인 1777년, 자객이 창덕궁 존현각까지 침입한 사건이 실록에 기록돼 있다. 정조는 밤새 책을 읽으며 스스로를 지켰다고 전해진다.",
        },
        {
          keyword: "규장각과 친위 정치",
          text: "즉위 후 정조는 규장각을 설치해 젊은 인재들을 친위 세력으로 길렀다. 정약용을 비롯한 실학자들이 이곳에서 개혁을 설계했다. 아버지의 죽음을 지켜본 소년은, 그렇게 학문으로 왕권을 다졌다.",
        },
      ],
    },
    factCheck: [
      {
        topic: "사도세자의 죽음",
        fact: "1762년 영조가 사도세자를 뒤주에 가둬 죽게 한 임오화변은 역사적 사실이다.",
        fiction: "드라마 속 세손 이산이 그 장면을 직접 목격했는지는 명확히 기록돼 있지 않다.",
      },
      {
        topic: "존현각 자객 사건",
        fact: "1777년 정조 즉위 직후 자객이 존현각에 침입한 사건이 실록에 기록돼 있다.",
        fiction: "드라마 속 구체적인 인물과 액션 장면은 창작이다.",
      },
    ],
    relatedPlaces: [
      { name: "화성행궁", city: "수원" },
      { name: "규장각(창덕궁)", city: "서울" },
      { name: "융릉(사도세자릉)", city: "화성" },
    ],
  },
};

const defaultContent = contentDatabase["101"];

export default function ContentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const raw = contentDatabase[id ?? ""] ?? defaultContent;
  const content: ContentData = { id, ...raw };

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const ids = content.relatedPlaces.map((_, i) => `${content.id}-related-${i}`);
    setSavedIds(new Set(ids.filter((bid) => isBookmarked(bid))));
  }, [content.id]);

  function handleToggleRelated(idx: number, place: { name: string; city: string }) {
    const bid = `${content.id}-related-${idx}`;
    const nowSaved = toggleBookmark({
      id: bid,
      name: place.name,
      category: content.title,
      image: content.image,
      address: place.city,
    });
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (nowSaved) next.add(bid);
      else next.delete(bid);
      return next;
    });
  }

  return (
    <div className="min-h-screen">
      {/* 히어로 */}
      <div className="relative h-64 lg:h-[420px]">
        <img src={content.image} alt={content.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-11 h-11 rounded-full bg-navy/50 backdrop-blur-sm hanji-noise flex items-center justify-center text-ivory hover:bg-navy/70 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 본문: 좌우 여백 px-6 */}
      <div className="max-w-2xl mx-auto px-6 -mt-24 lg:-mt-16 relative z-10 pb-28">
        {/* 타이틀 */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">{content.genre} · {content.era}</p>
          <h1 className="text-[24px] font-extrabold mb-4">{content.title}</h1>
          <p className="text-foreground/80 leading-relaxed">{content.plot}</p>
        </div>

        {/* 등장인물 */}
        <div className="mb-10">
          <h2 className="text-[16px] font-extrabold mb-4">등장인물</h2>
          <div className="space-y-0">
            {content.characters.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
                <div>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground text-sm ml-2">{c.actor}</span>
                </div>
                {c.historical && (
                  <span className="text-xs text-muted-foreground">실존 인물</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 역사 스토리텔링 */}
        <div className="mb-10">
          <h2 className="text-[16px] font-extrabold mb-4">역사 이야기</h2>
          <div className="rounded-[28px] bg-card border border-border/60 shadow-[var(--shadow-md)] p-6 sm:p-8">
            <p className="text-muted-foreground text-xs text-center tracking-widest uppercase mb-7 font-semibold">
              {content.historyStory.intro}
            </p>

            <div className="space-y-7">
              {content.historyStory.sections.map((section, i) => (
                <div key={i}>
                  {i > 0 && <div className="h-px bg-border mb-7" />}
                  <div className="pl-4 border-l-2 border-primary">
                    <p className="text-primary font-bold text-sm mb-2 tracking-tight">
                      {section.keyword}
                    </p>
                    <p className="text-foreground/80 text-sm leading-[1.9]">
                      {section.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 사실 vs 각색 — 이전 "팩트체크" */}
        <div className="mb-12">
          {/* 섹션 구분 강조: 배경색으로 완전히 다른 느낌 */}
          <div className="bg-muted/60 rounded-[28px] p-5">
            <h2 className="text-[16px] font-extrabold mb-1">사실 vs 각색</h2>
            <p className="text-sm text-muted-foreground mb-5">드라마가 역사를 어떻게 바꿨는지 확인해보세요</p>
            <div className="space-y-6">
              {content.factCheck.map((item, i) => (
                <div key={i}>
                  <p className="font-medium text-sm mb-3">{item.topic}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-card rounded-xl p-3">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1.5 uppercase tracking-wide">사실</p>
                      <p className="text-sm leading-relaxed text-foreground/80">{item.fact}</p>
                    </div>
                    <div className="bg-card rounded-xl p-3">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5 uppercase tracking-wide">각색</p>
                      <p className="text-sm leading-relaxed text-foreground/80">{item.fiction}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 관련 장소 */}
        <div className="mb-10">
          <h2 className="text-[16px] font-extrabold mb-4">관련 장소</h2>
          <div className="flex flex-wrap gap-2">
            {content.relatedPlaces.map((p, i) => {
              const bid = `${content.id}-related-${i}`;
              const saved = savedIds.has(bid);
              return (
                <button
                  key={i}
                  onClick={() => handleToggleRelated(i, p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    saved ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted hover:bg-muted/70"
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-primary" : ""}`} />
                  {p.name} · {p.city}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3 bg-background border-t border-border">
        <div className="max-w-2xl mx-auto">
          <Button onClick={() => navigate(`/app/itinerary/${content.id}`)} className="w-full h-12 text-[14px] font-black">
            여행 일정 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
