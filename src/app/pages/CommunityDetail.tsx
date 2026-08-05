import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Star,
  Clock,
  ChevronRight,
  ThumbsUp,
  Send,
  Share2,
  Download,
  X,
  MapPin,
  Navigation,
  Bookmark,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { isBookmarked, toggleBookmark } from "../lib/bookmarks";
import { getUserPosts, removeUserPost } from "../lib/communityPosts";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { usePlaceLookup } from "../lib/usePlaceLookup";

interface RouteStop {
  order: number;
  name: string;
  category: string;
  duration: string;
  image: string;
  description: string;
  address: string;
  hours: string;
  fee: string;
  lat: number;
  lng: number;
}

interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  likes: number;
  likedByMe: boolean;
}

interface RouteData {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  authorBio: string;
  rating: number;
  reviewCount: number;
  region: string;
  duration: string;
  placeCount: number;
  tags: string[];
  thumbnail: string;
  description: string;
  stops: RouteStop[];
  // "나머지 N개 장소 더 보기" 클릭 시 추가로 펼쳐지는 장소 (직접 채워 넣기)
  moreStops?: RouteStop[];
  reviews: Review[];
}

const routeData: Record<string, RouteData> = {
  r1: {
    id: "r1",
    title: "뿌리깊은 나무 테마 여행",
    author: "역사덕후",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
    authorBio: "사극 마니아 · 서울 역사 투어 전문",
    rating: 4.8,
    reviewCount: 24,
    region: "서울 종로구",
    duration: "당일치기",
    placeCount: 4,
    tags: ["사극", "역사", "궁궐"],
    thumbnail:
      "https://images.unsplash.com/photo-1638964663550-e2123ac8900b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description:
      "드라마 <뿌리깊은 나무>의 배경이 된 경복궁과 세종대왕 관련 유적을 하루에 모두 둘러보는 코스입니다. 훈민정음 창제 비화와 실제 역사를 비교하며 걷는 스토리텔링 투어입니다.",
    stops: [
      {
        order: 1,
        name: "경복궁 근정전",
        category: "궁궐",
        duration: "1시간 30분",
        image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "드라마 오프닝 장면의 배경. 세종이 조회를 열던 법전으로 드라마 속 밀본의 음모가 시작된 곳입니다.",
        address: "서울 종로구 사직로 161 경복궁",
        hours: "09:00 – 18:00 (월요일 휴관)",
        fee: "3,000원",
        lat: 37.5796,
        lng: 126.977,
      },
      {
        order: 2,
        name: "세종이야기 전시관",
        category: "전시관",
        duration: "1시간",
        image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "광화문 지하에 위치. 훈민정음 창제 과정과 세종 시대 과학기술을 상세히 전시합니다.",
        address: "서울 종로구 세종대로 175 지하",
        hours: "10:30 – 18:30 (월요일 휴관)",
        fee: "무료",
        lat: 37.5759,
        lng: 126.9769,
      },
      {
        order: 3,
        name: "창덕궁 선정전",
        category: "궁궐",
        duration: "1시간",
        image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "세종이 편전으로 사용한 공간. 드라마에서 채윤이 왕을 처음 알현하는 장면의 실제 배경입니다.",
        address: "서울 종로구 율곡로 99 창덕궁",
        hours: "09:00 – 17:30 (월요일 휴관)",
        fee: "3,000원",
        lat: 37.5792,
        lng: 126.991,
      },
      {
        order: 4,
        name: "종로 인사동",
        category: "문화거리",
        duration: "1시간 30분",
        image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "조선시대 서민 문화의 중심지. 드라마 속 한양 거리 분위기를 간접 체험할 수 있습니다.",
        address: "서울 종로구 인사동길 일대",
        hours: "24시간",
        fee: "무료",
        lat: 37.5741,
        lng: 126.9855,
      },
    ],
    reviews: [
      {
        id: "rv1",
        author: "궁궐탐험가",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=11",
        rating: 5,
        date: "2025-11-08",
        text: "드라마 보고 바로 따라해봤는데 진짜 감동적이에요. 근정전 앞에서 드라마 장면이 오버랩되더라고요. 세종이야기 전시관은 생각보다 알찬 내용이라 필수 코스인 것 같아요!",
        likes: 18,
        likedByMe: false,
      },
      {
        id: "rv2",
        author: "주말역사여행",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=22",
        rating: 5,
        date: "2025-10-22",
        text: "경복궁이랑 창덕궁을 하루에 다 보려면 체력이 좀 필요해요. 아침 일찍 시작하는 게 좋고, 점심은 인사동에서 먹으면 딱입니다. 루트 잘 짜여 있어서 따라가기 편했어요.",
        likes: 12,
        likedByMe: false,
      },
      {
        id: "rv3",
        author: "사극덕후_서울",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=33",
        rating: 4,
        date: "2025-09-15",
        text: "전반적으로 좋았는데 창덕궁 후원 관람이 이 루트에 빠진 게 아쉬워요. 시간 여유 있으면 후원 사전예약 하고 추가하는 걸 추천합니다. 그리고 세종이야기 전시관은 무료라서 부담 없어요.",
        likes: 7,
        likedByMe: false,
      },
    ],
  },
  r2: {
    id: "r2",
    title: "조선시대 한양 도성 순성길",
    author: "서울워커",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
    authorBio: "도보여행 애호가 · 서울 성곽길 완주",
    rating: 4.6,
    reviewCount: 18,
    region: "서울 전역",
    duration: "1박 2일",
    placeCount: 8,
    tags: ["도보", "성곽", "당일치기"],
    thumbnail:
      "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description:
      "조선 태조가 쌓은 한양 도성 18.6km를 구간별로 나눠 걷는 코스입니다. 낙산·남산·인왕산·북악산 4개 구간을 이틀에 걸쳐 완주합니다.",
    stops: [
      {
        order: 1,
        name: "흥인지문 (동대문)",
        category: "성문",
        duration: "30분",
        image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "한양 도성의 동쪽 정문. 보물 제1호로 지정된 조선 초기 성문 건축의 대표작입니다.",
        address: "서울 종로구 종로 288",
        hours: "24시간",
        fee: "무료",
        lat: 37.5711,
        lng: 127.0094,
      },
      {
        order: 2,
        name: "낙산 성곽길",
        category: "성곽",
        duration: "1시간 30분",
        image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "서울 시내를 내려다보며 걷는 성곽길. 이화마을 벽화와 함께 즐길 수 있습니다.",
        address: "서울 종로구 낙산길 일대",
        hours: "24시간",
        fee: "무료",
        lat: 37.5796,
        lng: 127.006,
      },
      {
        order: 3,
        name: "숭례문 (남대문)",
        category: "성문",
        duration: "30분",
        image:
          "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "한양 도성의 남쪽 정문이자 국보 제1호. 2008년 화재 후 복원됐습니다.",
        address: "서울 중구 세종대로 40",
        hours: "24시간",
        fee: "무료",
        lat: 37.5597,
        lng: 126.9752,
      },
    ],
    moreStops: [
      {
        order: 4,
        name: "인왕산 성곽길",
        category: "성곽",
        duration: "2시간",
        image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "인왕산 능선을 따라 이어지는 한양도성 서쪽 구간. 서울 시내 전망이 뛰어납니다.",
        address: "서울 종로구 옥인동 산1-1",
        hours: "24시간",
        fee: "무료",
        lat: 37.5809,
        lng: 126.9633,
      },
      {
        order: 5,
        name: "돈의문 터 (서대문)",
        category: "성문터",
        duration: "20분",
        image: "https://images.unsplash.com/photo-1638964663550-e2123ac8900b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "일제강점기에 철거된 한양도성 서쪽 정문 터. 표지석과 모형으로 흔적을 확인할 수 있습니다.",
        address: "서울 종로구 신문로2가 91",
        hours: "24시간",
        fee: "무료",
        lat: 37.5665,
        lng: 126.9645,
      },
      {
        order: 6,
        name: "백악산(북악산) 성곽길",
        category: "성곽",
        duration: "2시간 30분",
        image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "청와대 뒤편 북악산을 따라 이어지는 성곽길. 출입 시 신분증 지참이 필요합니다.",
        address: "서울 종로구 청운동 산1-1",
        hours: "09:00 – 15:00 (월요일 휴관)",
        fee: "무료",
        lat: 37.594,
        lng: 126.9707,
      },
      {
        order: 7,
        name: "광희문",
        category: "성문",
        duration: "20분",
        image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "한양도성의 남소문. 시신을 도성 밖으로 내보내던 문이라 '시구문'이라 불렸습니다.",
        address: "서울 중구 퇴계로 411",
        hours: "24시간",
        fee: "무료",
        lat: 37.5647,
        lng: 127.0136,
      },
      {
        order: 8,
        name: "혜화문",
        category: "성문",
        duration: "20분",
        image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "한양도성 동북쪽 문으로, 원형이 훼손됐다가 1994년 현재의 모습으로 복원됐습니다.",
        address: "서울 종로구 창경궁로 300",
        hours: "24시간",
        fee: "무료",
        lat: 37.5891,
        lng: 127.0018,
      },
    ],
    reviews: [
      {
        id: "rv4",
        author: "도보왕",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=44",
        rating: 5,
        date: "2025-11-01",
        text: "성곽길 걸으면서 서울이 이렇게 역사 깊은 도시인지 새삼 느꼈어요. 낙산 구간이 특히 예쁘고 야경도 좋아요. 체력 소모가 있으니 편한 신발 필수!",
        likes: 14,
        likedByMe: false,
      },
      {
        id: "rv5",
        author: "역사산책",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=55",
        rating: 4,
        date: "2025-10-05",
        text: "북악산 구간은 신분증 지참이 필요하다는 걸 미리 알았으면 좋았을 텐데. 루트 설명에 추가해주시면 좋겠어요. 그 외엔 완벽한 코스입니다.",
        likes: 9,
        likedByMe: false,
      },
    ],
  },
  r3: {
    id: "r3",
    title: "전주 한옥마을 1박2일 코스",
    author: "전주러버",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    authorBio: "전통문화 체험 전문가 · 전주 토박이",
    rating: 4.9,
    reviewCount: 35,
    region: "전라북도 전주",
    duration: "1박 2일",
    placeCount: 12,
    tags: ["한옥", "먹방", "체험"],
    thumbnail:
      "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description:
      "조선왕조 발상지 전주의 800년 한옥마을을 깊이 있게 탐방하는 코스입니다. 경기전·전동성당·풍남문을 중심으로 조선 건국의 역사를 느끼고, 전주비빔밥과 한옥 숙박으로 마무리합니다.",
    stops: [
      {
        order: 1,
        name: "경기전",
        category: "사적",
        duration: "1시간",
        image:
          "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "태조 이성계의 어진을 모신 곳. 조선 건국의 정통성을 상징하는 공간입니다.",
        address: "전북 전주시 완산구 태조로 44",
        hours: "09:00 – 18:00 (월요일 휴관)",
        fee: "3,000원",
        lat: 35.8151,
        lng: 127.1534,
      },
      {
        order: 2,
        name: "전주 한옥마을",
        category: "전통마을",
        duration: "2시간",
        image:
          "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "700여 채 한옥이 밀집한 국내 최대 한옥 집단 지구. 한복 대여와 전통 공예 체험이 가능합니다.",
        address: "전북 전주시 완산구 기린대로 99",
        hours: "24시간",
        fee: "무료",
        lat: 35.8165,
        lng: 127.1549,
      },
      {
        order: 3,
        name: "풍남문",
        category: "성문",
        duration: "30분",
        image:
          "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "조선시대 전주성의 남문. 보물 308호로 지정된 문화재입니다.",
      },
    ],
    moreStops: [
      {
        order: 4,
        name: "전동성당",
        category: "성당",
        duration: "40분",
        image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "한국 최초의 서양식 성당 중 하나로, 천주교 순교자를 기리기 위해 지어졌습니다.",
        address: "전북 전주시 완산구 태조로 51",
        hours: "09:00 – 18:00",
        fee: "무료",
        lat: 35.8136,
        lng: 127.1467,
      },
      {
        order: 5,
        name: "오목대",
        category: "누각",
        duration: "30분",
        image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "이성계가 승전을 자축했다고 전해지는 누각. 한옥마을 전경이 한눈에 보입니다.",
        address: "전북 전주시 완산구 기린대로 55",
        hours: "24시간",
        fee: "무료",
        lat: 35.8172,
        lng: 127.1571,
      },
      {
        order: 6,
        name: "전주향교",
        category: "향교",
        duration: "40분",
        image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "조선시대 지방 교육기관. 은행나무 고목과 고즈넉한 풍경이 인상적입니다.",
        address: "전북 전주시 완산구 향교길 139",
        hours: "09:00 – 18:00",
        fee: "무료",
        lat: 35.8127,
        lng: 127.1548,
      },
      {
        order: 7,
        name: "국립전주박물관",
        category: "박물관",
        duration: "1시간",
        image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "전북 지역의 역사와 문화재를 소개하는 국립 박물관.",
        address: "전북 전주시 완산구 쑥고개로 249",
        hours: "09:00 – 18:00 (월요일 휴관)",
        fee: "무료",
        lat: 35.8267,
        lng: 127.1364,
      },
      {
        order: 8,
        name: "전주 한벽문화관",
        category: "전시관",
        duration: "40분",
        image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "한지·판소리 등 전주의 전통문화를 체험할 수 있는 복합 문화공간.",
        address: "전북 전주시 완산구 기린대로 2",
        hours: "09:00 – 18:00 (월요일 휴관)",
        fee: "무료",
        lat: 35.8117,
        lng: 127.1591,
      },
      {
        order: 9,
        name: "남고산성",
        category: "산성",
        duration: "1시간 30분",
        image: "https://images.unsplash.com/photo-1638964663550-e2123ac8900b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "후백제 견훤이 도읍 방어를 위해 쌓았다고 전해지는 산성.",
        address: "전북 전주시 완산구 동서학동 산1",
        hours: "24시간",
        fee: "무료",
        lat: 35.7938,
        lng: 127.1547,
      },
      {
        order: 10,
        name: "전주 자만벽화마을",
        category: "벽화마을",
        duration: "40분",
        image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "오목대 뒤편 언덕에 자리한 아기자기한 벽화마을.",
        address: "전북 전주시 완산구 자만동",
        hours: "24시간",
        fee: "무료",
        lat: 35.8189,
        lng: 127.1592,
      },
      {
        order: 11,
        name: "전주 풍남문 야시장",
        category: "야시장",
        duration: "1시간",
        image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "풍남문 인근에서 열리는 야시장으로 전주의 다양한 먹거리를 즐길 수 있습니다.",
        address: "전북 전주시 완산구 풍남문3길 1",
        hours: "18:00 – 24:00 (금~일)",
        fee: "무료 입장",
        lat: 35.8145,
        lng: 127.1466,
      },
      {
        order: 12,
        name: "최명희문학관",
        category: "문학관",
        duration: "40분",
        image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "소설 『혼불』의 작가 최명희를 기리는 문학관.",
        address: "전북 전주시 완산구 최명희길 29",
        hours: "09:00 – 18:00 (월요일 휴관)",
        fee: "무료",
        lat: 35.8158,
        lng: 127.1479,
      },
    ],
    reviews: [
      {
        id: "rv6",
        author: "전국방방곡곡",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=66",
        rating: 5,
        date: "2025-11-10",
        text: "전주는 몇 번 왔었는데 이 루트 따라가니까 훨씬 알차게 봤어요. 경기전에서 해설사 투어 신청하면 더 재미있어요. 한옥 숙소 예약은 미리미리!",
        likes: 22,
        likedByMe: false,
      },
      {
        id: "rv7",
        author: "푸드트래블러",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=77",
        rating: 5,
        date: "2025-10-28",
        text: "역사도 역사지만 전주비빔밥, 콩나물국밥, 초코파이... 먹방 천국이에요. 루트에 맛집도 같이 표시해주면 더 완벽할 것 같아요. 그래도 최고의 1박2일 코스입니다.",
        likes: 19,
        likedByMe: false,
      },
      {
        id: "rv8",
        author: "한옥스테이",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=88",
        rating: 5,
        date: "2025-09-30",
        text: "아이랑 함께 갔는데 한복 입고 경기전 돌아다니니까 아이가 너무 좋아했어요. 역사교육 겸 여행으로 강추합니다!",
        likes: 16,
        likedByMe: false,
      },
    ],
  },
  r4: {
    id: "r4",
    title: "경주 신라 천년의 역사",
    author: "고대사랑",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
    authorBio: "고고학 전공 · 삼국시대 전문 해설사",
    rating: 4.7,
    reviewCount: 29,
    region: "경상북도 경주",
    duration: "1박 2일",
    placeCount: 10,
    tags: ["신라", "불교", "유적지"],
    thumbnail:
      "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description:
      "천년 신라의 수도 경주를 체계적으로 탐방하는 코스입니다. 불국사·석굴암의 석조 예술부터 대릉원의 왕릉, 국립경주박물관까지 신라 문화의 정수를 경험합니다.",
    stops: [
      {
        order: 1,
        name: "불국사",
        category: "사찰",
        duration: "2시간",
        image:
          "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "유네스코 세계문화유산. 다보탑·석가탑·청운교·백운교 등 신라 석조 예술의 걸작이 모여있습니다.",
        address: "경북 경주시 불국로 385",
        hours: "07:00 – 18:00",
        fee: "5,000원",
        lat: 35.7902,
        lng: 129.3318,
      },
      {
        order: 2,
        name: "석굴암",
        category: "석굴",
        duration: "1시간",
        image:
          "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "동해를 향해 앉은 본존불. 정밀한 비례와 과학적 공법이 세계를 놀라게 한 신라 건축의 극치입니다.",
        address: "경북 경주시 불국로 873-243",
        hours: "06:30 – 18:00",
        fee: "6,000원",
        lat: 35.7943,
        lng: 129.3462,
      },
      {
        order: 3,
        name: "대릉원",
        category: "왕릉군",
        duration: "1시간",
        image:
          "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "신라 왕·왕비의 고분 23기가 모인 유적지. 천마총에서 출토된 천마도로 유명합니다.",
        address: "경북 경주시 계림로 9",
        hours: "09:00 – 22:00",
        fee: "3,000원",
        lat: 35.8343,
        lng: 129.2197,
      },
    ],
    moreStops: [
      {
        order: 4,
        name: "첨성대",
        category: "천문대",
        duration: "30분",
        image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "동양에서 가장 오래된 천문대로 알려진 신라의 과학기술 유산.",
        address: "경북 경주시 첨성로 169-5",
        hours: "09:00 – 22:00",
        fee: "무료",
        lat: 35.8353,
        lng: 129.2192,
      },
      {
        order: 5,
        name: "동궁과 월지 (안압지)",
        category: "궁궐터",
        duration: "1시간",
        image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "신라 왕궁의 별궁 연못. 야간 조명 경관으로 유명한 경주 대표 야경 명소입니다.",
        address: "경북 경주시 원화로 102",
        hours: "09:00 – 22:00",
        fee: "3,000원",
        lat: 35.8347,
        lng: 129.2249,
      },
      {
        order: 6,
        name: "국립경주박물관",
        category: "박물관",
        duration: "1시간 30분",
        image: "https://images.unsplash.com/photo-1638964663550-e2123ac8900b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "성덕대왕신종을 비롯한 신라 유물을 총망라한 국립 박물관.",
        address: "경북 경주시 일정로 186",
        hours: "09:00 – 18:00",
        fee: "무료",
        lat: 35.8302,
        lng: 129.2274,
      },
      {
        order: 7,
        name: "분황사",
        category: "사찰",
        duration: "30분",
        image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "선덕여왕 재위 시 창건된 신라의 대표 사찰. 모전석탑이 남아있습니다.",
        address: "경북 경주시 분황로 94-11",
        hours: "08:30 – 18:00",
        fee: "2,000원",
        lat: 35.8365,
        lng: 129.2222,
      },
      {
        order: 8,
        name: "계림",
        category: "숲",
        duration: "30분",
        image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "신라 김알지 탄생 설화가 전해지는 오래된 숲.",
        address: "경북 경주시 교동 89",
        hours: "24시간",
        fee: "무료",
        lat: 35.8341,
        lng: 129.2158,
      },
      {
        order: 9,
        name: "문무대왕릉",
        category: "왕릉",
        duration: "40분",
        image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "죽어서도 나라를 지키겠다는 문무왕의 유언에 따라 조성된 수중릉.",
        address: "경북 경주시 문무대왕면 봉길리",
        hours: "24시간",
        fee: "무료",
        lat: 35.7583,
        lng: 129.4644,
      },
      {
        order: 10,
        name: "양동마을",
        category: "전통마을",
        duration: "1시간 30분",
        image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "유네스코 세계유산으로 지정된 조선시대 씨족마을.",
        address: "경북 경주시 강동면 양동마을길 91-14",
        hours: "09:00 – 18:00",
        fee: "4,000원",
        lat: 35.9236,
        lng: 129.2044,
      },
    ],
    reviews: [
      {
        id: "rv9",
        author: "신라팬",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=99",
        rating: 5,
        date: "2025-11-05",
        text: "고대사랑님 루트 덕분에 경주를 제대로 본 느낌이에요. 박물관 먼저 가서 기초 지식 쌓고 유적지 돌면 이해가 훨씬 잘 돼요. 드라마 선덕여왕 보고 온 분들은 꼭 챙기세요!",
        likes: 20,
        likedByMe: false,
      },
      {
        id: "rv10",
        author: "경주여행기",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=100",
        rating: 4,
        date: "2025-10-12",
        text: "석굴암은 이른 아침에 가야 관람객이 적어서 여유롭게 볼 수 있어요. 불국사에서 셔틀버스 이용하면 편합니다. 전체 루트는 빡빡하지 않아서 좋았어요.",
        likes: 11,
        likedByMe: false,
      },
    ],
  },
  r5: {
    id: "r5",
    title: "수원 화성 완전정복",
    author: "경기투어",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=5",
    authorBio: "경기도 역사 탐방 전문 · 화성 해설 자원봉사",
    rating: 4.5,
    reviewCount: 22,
    region: "경기도 수원",
    duration: "당일치기",
    placeCount: 6,
    tags: ["성곽", "정조", "세계유산"],
    thumbnail:
      "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description:
      "정약용이 설계하고 정조가 건설한 수원 화성 5.7km를 완주하는 코스입니다. 화성행궁·장안문·팔달문을 거치며 정조의 개혁 정치와 실학 정신을 현장에서 체험합니다.",
    stops: [
      {
        order: 1,
        name: "화성행궁",
        category: "행궁",
        duration: "1시간",
        image:
          "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "정조가 아버지 사도세자의 능을 참배하러 올 때 머문 행궁. 드라마 <이산>의 주요 배경입니다.",
        address: "경기 수원시 팔달구 정조로 825",
        hours: "09:00 – 18:00 (월요일 휴관)",
        fee: "1,500원",
        lat: 37.2787,
        lng: 127.0164,
      },
      {
        order: 2,
        name: "장안문",
        category: "성문",
        duration: "30분",
        image:
          "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "화성의 북문. 4대 성문 중 가장 크고 웅장하며 옹성이 잘 보존돼 있습니다.",
        address: "경기 수원시 팔달구 장안동 22-1",
        hours: "24시간",
        fee: "무료",
        lat: 37.2905,
        lng: 127.0148,
      },
      {
        order: 3,
        name: "화홍문·방화수류정",
        category: "누각",
        duration: "45분",
        image:
          "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "수원천 위에 세운 수문과 누각. 화성에서 가장 아름다운 포토스팟으로 꼽힙니다.",
        address: "경기 수원시 팔달구 수원천로392번길 44-6",
        hours: "24시간",
        fee: "무료",
        lat: 37.2885,
        lng: 127.0198,
      },
    ],
    moreStops: [
      {
        order: 4,
        name: "팔달문",
        category: "성문",
        duration: "20분",
        image: "https://images.unsplash.com/photo-1638964663550-e2123ac8900b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "화성의 남문으로 수원의 상징적인 랜드마크입니다.",
        address: "경기 수원시 팔달구 팔달로2가 130",
        hours: "24시간",
        fee: "무료",
        lat: 37.2755,
        lng: 127.0164,
      },
      {
        order: 5,
        name: "서장대",
        category: "장대",
        duration: "30분",
        image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "화성 전체를 조망하며 지휘하던 군사 지휘소.",
        address: "경기 수원시 팔달구 창룡대로 21-153",
        hours: "09:00 – 18:00",
        fee: "무료",
        lat: 37.2822,
        lng: 127.0117,
      },
      {
        order: 6,
        name: "수원화성박물관",
        category: "박물관",
        duration: "40분",
        image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "화성 축성 과정과 정조의 개혁 정치를 소개하는 박물관.",
        address: "경기 수원시 팔달구 정조로 825",
        hours: "09:00 – 18:00 (월요일 휴관)",
        fee: "2,000원",
        lat: 37.2791,
        lng: 127.0158,
      },
    ],
    reviews: [
      {
        id: "rv11",
        author: "수원시민",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=111",
        rating: 5,
        date: "2025-10-20",
        text: "수원 살면서 화성을 이렇게 제대로 돌아본 적이 없었어요. 루트 짜주신 덕분에 처음부터 끝까지 의미 있게 봤습니다. 화성어차보다 걷는 게 훨씬 좋아요.",
        likes: 13,
        likedByMe: false,
      },
      {
        id: "rv12",
        author: "이산팬",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=112",
        rating: 4,
        date: "2025-09-25",
        text: "드라마 이산 보고 왔는데 행궁이 드라마 속 장면 그대로라 신기했어요. 가을에 가면 단풍이랑 성곽이 너무 잘 어울립니다.",
        likes: 8,
        likedByMe: false,
      },
    ],
  },
  r6: {
    id: "r6",
    title: "제주 탐라시대 역사탐방",
    author: "제주가이드",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=6",
    authorBio: "제주 토박이 · 탐라 역사 연구자",
    rating: 4.4,
    reviewCount: 16,
    region: "제주도",
    duration: "1박 2일",
    placeCount: 7,
    tags: ["제주", "탐라", "해양문화"],
    thumbnail:
      "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    description:
      "제주도의 독립 왕국 탐라국(기원전 ~ 1402)의 역사를 추적하는 코스입니다. 삼성혈·관덕정·제주목 관아를 거치며 육지와 다른 제주 고유의 역사문화를 탐구합니다.",
    stops: [
      {
        order: 1,
        name: "삼성혈",
        category: "성지",
        duration: "45분",
        image:
          "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "탐라 건국 신화의 시작점. 고·양·부 삼신인이 솟아난 세 구멍이 지금도 남아있습니다.",
        address: "제주 제주시 삼성로 22",
        hours: "08:00 – 18:00",
        fee: "2,500원",
        lat: 33.5112,
        lng: 126.5217,
      },
      {
        order: 2,
        name: "제주목 관아",
        category: "관아",
        duration: "1시간",
        image:
          "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "조선시대 제주 행정의 중심지. 탐라 시대부터 이어진 제주 권력의 거점입니다.",
        address: "제주 제주시 관덕로 25",
        hours: "09:00 – 18:00 (월요일 휴관)",
        fee: "1,500원",
        lat: 33.5143,
        lng: 126.5218,
      },
    ],
    moreStops: [
      {
        order: 3,
        name: "국립제주박물관",
        category: "박물관",
        duration: "1시간",
        image: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "탐라국부터 이어지는 제주의 역사와 문화를 소개하는 국립 박물관.",
        address: "제주 제주시 일주동로 17",
        hours: "09:00 – 18:00 (월요일 휴관)",
        fee: "무료",
        lat: 33.4879,
        lng: 126.5602,
      },
      {
        order: 4,
        name: "항파두리 항몽 유적지",
        category: "유적지",
        duration: "1시간",
        image: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "삼별초가 몽골에 항쟁하며 쌓은 토성 유적.",
        address: "제주 제주시 애월읍 항파두리로 50",
        hours: "09:00 – 18:00",
        fee: "무료",
        lat: 33.4629,
        lng: 126.4111,
      },
      {
        order: 5,
        name: "관덕정",
        category: "누각",
        duration: "20분",
        image: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "제주 관아의 부속 건물로, 제주에 현존하는 건물 중 가장 오래됐습니다.",
        address: "제주 제주시 관덕로 19",
        hours: "24시간",
        fee: "무료",
        lat: 33.5136,
        lng: 126.5219,
      },
      {
        order: 6,
        name: "삼양동 선사유적지",
        category: "유적지",
        duration: "40분",
        image: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "청동기부터 탐라 초기까지의 생활상을 보여주는 선사시대 마을 유적.",
        address: "제주 제주시 삼양로 22",
        hours: "09:00 – 18:00 (월요일 휴관)",
        fee: "무료",
        lat: 33.5147,
        lng: 126.5758,
      },
      {
        order: 7,
        name: "제주 민속자연사박물관",
        category: "박물관",
        duration: "40분",
        image: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        description: "탐라 시대부터 이어진 제주 고유의 민속과 자연사를 전시합니다.",
        address: "제주 제주시 삼성로 40",
        hours: "08:30 – 18:00",
        fee: "2,000원",
        lat: 33.5013,
        lng: 126.5231,
      },
    ],
    reviews: [
      {
        id: "rv13",
        author: "제주여행자",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=113",
        rating: 4,
        date: "2025-10-15",
        text: "제주 역사에 대해 전혀 몰랐는데 탐라라는 독립 왕국이 있었다는 게 충격이었어요. 삼성혈은 생각보다 규모가 작지만 신화적인 분위기가 있어서 좋았습니다.",
        likes: 10,
        likedByMe: false,
      },
      {
        id: "rv14",
        author: "섬역사탐방",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=114",
        rating: 5,
        date: "2025-09-10",
        text: "제주 관광지만 다니다 이번엔 역사 여행으로 왔는데 완전히 다른 제주를 발견했어요. 가이드님 설명이 정말 알차서 계속 시간 가는 줄 몰랐습니다.",
        likes: 15,
        likedByMe: false,
      },
    ],
  },
};

function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${sz} ${n <= Math.round(value) ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const userPost = id?.startsWith("u-") ? getUserPosts().find((p) => p.id === id) : undefined;
  const route: RouteData = userPost
    ? {
        id: userPost.id,
        title: userPost.title,
        author: userPost.author,
        authorAvatar: userPost.authorAvatar,
        authorBio: "커뮤니티 작성자",
        rating: userPost.rating,
        reviewCount: userPost.reviewCount,
        region: userPost.region,
        duration: "정보 없음",
        placeCount: userPost.placeCount,
        tags: userPost.tags,
        thumbnail: userPost.thumbnail,
        description: userPost.description || "아직 등록된 소개가 없습니다.",
        stops: [],
        reviews: [],
      }
    : routeData[id ?? "r1"] ?? routeData["r1"];

  const [reviews, setReviews] = useState<Review[]>(route.reviews);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [activeTab, setActiveTab] = useState<"route" | "review">("route");
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [showAllStops, setShowAllStops] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stopSaved, setStopSaved] = useState(false);

  const stopBookmarkId = selectedStop ? `${route.id}-stop-${selectedStop.order}` : null;
  // selectedStop은 큐레이션된 루트 데이터(이름/카테고리/순서)이고, 실제 주소·운영시간·이미지·
  // 설명은 이름으로 관광정보 API를 조회해 보강한다. 조회 실패 시 큐레이션 데이터로 대체된다.
  const { status: stopLookupStatus, data: stopDetail } = usePlaceLookup(selectedStop?.name);

  useEffect(() => {
    setStopSaved(stopBookmarkId ? isBookmarked(stopBookmarkId) : false);
  }, [stopBookmarkId]);

  const visibleStops = showAllStops
    ? [...route.stops, ...(route.moreStops ?? [])]
    : route.stops;

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  function handleLike(reviewId: string) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, likedByMe: !r.likedByMe, likes: r.likedByMe ? r.likes - 1 : r.likes + 1 }
          : r
      )
    );
  }

  function handleImport() {
    setShowImportModal(true);
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href);
    toast("링크가 복사되었습니다.");
  }

  function handleSubmitReview() {
    if (!myComment.trim() || myRating === 0) return;
    const newReview: Review = {
      id: `rv-${Date.now()}`,
      author: "나",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=me",
      rating: myRating,
      date: new Date().toISOString().slice(0, 10),
      text: myComment.trim(),
      likes: 0,
      likedByMe: false,
    };
    setReviews((prev) => [newReview, ...prev]);
    setMyComment("");
    setMyRating(0);
  }

  return (
    <div className="min-h-screen pb-8">
      {/* 히어로 */}
      <div className="relative h-52 md:h-64 overflow-hidden">
        <img src={route.thumbnail} alt={route.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-navy/50 backdrop-blur-sm flex items-center justify-center text-ivory hover:bg-navy/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        {userPost && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-navy/50 backdrop-blur-sm flex items-center justify-center text-ivory hover:bg-navy/70 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <div className="absolute bottom-5 left-5 right-5">
          <div className="flex items-center gap-1.5 mb-1">
            {route.tags.map((t) => (
              <span key={t} className="text-xs text-ivory/70 bg-ivory/15 rounded-full px-2 py-0.5">
                #{t}
              </span>
            ))}
          </div>
          <h1 className="font-heading text-ivory text-2xl leading-tight">{route.title}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-5 space-y-6">
        {/* 작성자 + 메타 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={route.authorAvatar} alt={route.author} className="w-10 h-10 rounded-full bg-muted shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm">{route.author}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{route.authorBio}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={handleImport}>
            <Download className="w-4 h-4 mr-1.5" />
            가져오기
          </Button>
        </div>

        {/* 요약 스탯 */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>장소 {route.placeCount}곳</span>
          <span>·</span>
          <span>{route.duration}</span>
          <span>·</span>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
            <span className="text-foreground font-medium">{avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews.length})</span>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-border">
          {(["route", "review"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "route" ? "루트 경로" : `리뷰 ${reviews.length}`}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* 루트 탭 */}
        {activeTab === "route" && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground mb-4">{route.description}</p>
            {visibleStops.map((stop, idx) => (
              <div key={stop.order}>
                <button
                  onClick={() => setSelectedStop(stop)}
                  className="w-full bg-card border border-border rounded-xl overflow-hidden flex gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <img src={stop.image} alt={stop.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">{stop.category} · {stop.duration}</span>
                    <p className="font-medium text-sm mt-0.5 mb-1">{stop.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{stop.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center" />
                </button>
                {idx < visibleStops.length - 1 && (
                  <div className="flex items-center justify-center gap-2 py-1.5">
                    <div className="h-px w-8 bg-border" />
                    <span className="text-muted-foreground/50 text-xs">↓</span>
                    <div className="h-px w-8 bg-border" />
                  </div>
                )}
              </div>
            ))}
            {!showAllStops && (route.moreStops?.length ?? 0) > 0 && (
              <button
                onClick={() => setShowAllStops(true)}
                className="w-full mt-3 py-3 text-sm text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors"
              >
                나머지 {route.placeCount - visibleStops.length}개 장소 더 보기
              </button>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleImport} className="flex-1">가져오기</Button>
              <Button variant="outline" onClick={handleShare}><Share2 className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {/* 리뷰 탭 */}
        {activeTab === "review" && (
          <div className="space-y-5">
            {/* 별점 분포 요약 */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-6">
              <div className="text-center shrink-0">
                <p className="text-4xl font-bold">{avgRating.toFixed(1)}</p>
                <StarRating value={avgRating} size="sm" />
                <p className="text-xs text-muted-foreground mt-1">{reviews.length}개 리뷰</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length;
                  const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-3">{star}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 리뷰 작성 */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium">리뷰 남기기</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setMyRating(n)}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        n <= (hoverRating || myRating)
                          ? "fill-accent text-accent"
                          : "text-muted-foreground/30 hover:text-accent/50"
                      }`}
                    />
                  </button>
                ))}
                {myRating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {["", "별로예요", "아쉬워요", "괜찮아요", "좋아요", "최고예요"][myRating]}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  placeholder="이 루트를 다녀온 후기를 남겨주세요"
                  className="flex-1 text-sm h-10 bg-input-background"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitReview()}
                />
                <Button
                  size="sm"
                  onClick={handleSubmitReview}
                  disabled={!myComment.trim() || myRating === 0}
                  className="h-10 px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {myRating === 0 && myComment.trim() && (
                <p className="text-xs text-destructive">별점을 선택해주세요</p>
              )}
            </div>

            {/* 리뷰 목록 */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <img
                      src={review.avatar}
                      alt={review.author}
                      className="w-8 h-8 rounded-full bg-muted shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{review.author}</p>
                        <StarRating value={review.rating} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-3">{review.text}</p>
                  <button
                    onClick={() => handleLike(review.id)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      review.likedByMe ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${review.likedByMe ? "fill-current" : ""}`} />
                    <span>도움이 됐어요 {review.likes}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 장소 정보 바텀시트 */}
      {selectedStop && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* 딤 배경 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedStop(null)}
          />

          <div className="relative bg-card w-full max-w-lg max-h-[85vh] rounded-t-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* 핸들 */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* 북마크 + 닫기 */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={() => {
                  if (!selectedStop || !stopBookmarkId) return;
                  setStopSaved(
                    toggleBookmark({
                      id: stopBookmarkId,
                      name: selectedStop.name,
                      category: selectedStop.category,
                      image: stopDetail?.image ?? selectedStop.image,
                      address: stopDetail?.address ?? selectedStop.address,
                      hours: stopDetail?.hours ?? selectedStop.hours,
                    })
                  );
                }}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <Bookmark className={`w-4 h-4 ${stopSaved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
              <button
                onClick={() => setSelectedStop(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* 지도 플레이스홀더 */}
            <div
              className="relative h-44 bg-muted overflow-hidden shrink-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                backgroundColor: "#e8e4d8",
              }}
            >
              {/* 중심 핀 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5 text-background fill-background" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-foreground/30 mt-1 blur-sm" />
                </div>
              </div>
              {/* 장소명 말풍선 */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card rounded-xl px-3 py-1.5 shadow-md border border-border whitespace-nowrap">
                <p className="text-xs font-medium">{selectedStop.name}</p>
              </div>
            </div>

            {/* 장소 정보 */}
            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{selectedStop.category} · {selectedStop.duration}</p>
                <h3 className="text-lg font-semibold">{selectedStop.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{stopDetail?.description ?? selectedStop.description}</p>
              </div>

              {stopLookupStatus === "loading" && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  실시간 정보를 불러오는 중...
                </div>
              )}
              {(stopLookupStatus === "error" || stopLookupStatus === "not-found") && (
                <p className="text-xs text-muted-foreground">
                  실시간 정보를 불러오지 못해 안내된 정보로 표시하고 있어요.
                </p>
              )}

              <div className="divide-y divide-border">
                <div className="flex items-start gap-3 py-3">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm">{stopDetail?.address ?? selectedStop.address}</p>
                </div>
                <div className="flex items-center gap-3 py-3">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-sm">{stopDetail?.hours ?? selectedStop.hours}</p>
                </div>
              </div>

              {/* 지도 앱 열기 */}
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(stopDetail?.address ?? selectedStop.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                지도 앱에서 열기
              </a>

              {/* 하단 safe area */}
              <div className="h-2" />
            </div>
          </div>
        </div>
      )}

      {/* 가져오기 완료 배너 */}
      {showImportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowImportModal(false)}
          />
          <div className="relative bg-card w-full max-w-xs rounded-2xl shadow-2xl p-6 text-center">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <p className="text-base font-medium mt-2">플래너에 저장되었습니다</p>
            <p className="text-sm text-muted-foreground mt-1.5 mb-5">플래너에서 확인하세요</p>
            <Button
              className="w-full"
              onClick={() => {
                setShowImportModal(false);
                navigate("/app/planner");
              }}
            >
              플래너로 이동하기
            </Button>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={showDeleteConfirm}
        title="이 글을 삭제하시겠습니까?"
        description="삭제한 글은 복구할 수 없습니다."
        onConfirm={() => {
          removeUserPost(route.id);
          navigate("/app/community");
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
