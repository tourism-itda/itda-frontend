import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Star, PenLine } from "lucide-react";
import { Input } from "../components/ui/input";
import { CommunityPost, getUserPosts } from "../lib/communityPosts";

interface RouteCardData {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  rating: number;
  region: string;
  placeCount: number;
  thumbnail: string;
}

function RouteCard({ route, onOpen }: { route: RouteCardData; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group text-left">
      {/* 썸네일 + 오버레이 텍스트 */}
      <div className="aspect-[4/3] border border-border overflow-hidden relative mb-3">
        <img
          src={route.thumbnail}
          alt={route.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-terracotta/85 via-terracotta/10 to-transparent" />
        {/* 별점 */}
        <div className="absolute top-2.5 right-2.5 bg-navy text-gold text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3 fill-gold" />
          {route.rating}
        </div>
        {/* 지역 + 제목 오버레이 */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-ivory/60 text-[11px] mb-0.5">{route.region}</p>
          <p className="font-heading text-ivory text-sm leading-snug line-clamp-2">{route.title}</p>
        </div>
      </div>

      {/* 하단 메타 */}
      <div className="flex items-center gap-2">
        <img src={route.authorAvatar} className="w-4 h-4 rounded-full shrink-0" />
        <span className="text-xs text-muted-foreground truncate">{route.author}</span>
        <span className="text-xs text-muted-foreground/40 shrink-0">·</span>
        <span className="text-xs text-muted-foreground shrink-0">장소 {route.placeCount}곳</span>
      </div>
    </button>
  );
}

export default function Community() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    setUserPosts(getUserPosts());
  }, []);

  const demoRoutes = [
    {
      id: "r1",
      title: "뿌리깊은 나무 테마 여행",
      author: "역사덕후",
      authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
      rating: 4.8,
      reviewCount: 24,
      placeCount: 4,
      region: "서울 종로구",
      thumbnail: "https://images.unsplash.com/photo-1638964663550-e2123ac8900b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
      tags: ["사극", "역사", "궁궐"],
    },
    {
      id: "r2",
      title: "조선시대 한양 도성 순성길",
      author: "서울워커",
      authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
      rating: 4.6,
      reviewCount: 18,
      placeCount: 8,
      region: "서울 전역",
      thumbnail: "https://images.unsplash.com/photo-1591025788510-163f73e9abca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
      tags: ["도보", "성곽", "당일치기"],
    },
    {
      id: "r3",
      title: "전주 한옥마을 1박2일 코스",
      author: "전주러버",
      authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
      rating: 4.9,
      reviewCount: 35,
      placeCount: 12,
      region: "전라북도 전주",
      thumbnail: "https://images.unsplash.com/photo-1703825864792-5880081beaaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
      tags: ["한옥", "먹방", "체험"],
    },
    {
      id: "r4",
      title: "경주 신라 천년의 역사",
      author: "고대사랑",
      authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
      rating: 4.7,
      reviewCount: 29,
      placeCount: 10,
      region: "경상북도 경주",
      thumbnail: "https://images.unsplash.com/photo-1599033769063-fcd3ef816810?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
      tags: ["신라", "불교", "유적지"],
    },
    {
      id: "r5",
      title: "수원 화성 완전정복",
      author: "경기투어",
      authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=5",
      rating: 4.5,
      reviewCount: 22,
      placeCount: 6,
      region: "경기도 수원",
      thumbnail: "https://images.unsplash.com/photo-1602479185195-32f5cd203559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
      tags: ["성곽", "정조", "세계유산"],
    },
    {
      id: "r6",
      title: "제주 탐라시대 역사탐방",
      author: "제주가이드",
      authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=6",
      rating: 4.4,
      reviewCount: 16,
      placeCount: 7,
      region: "제주도",
      thumbnail: "https://images.unsplash.com/photo-1766662538511-650430a2fa6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
      tags: ["제주", "탐라", "해양문화"],
    },
  ];

  function matchesSearch(r: { title: string; region: string; author: string }) {
    return (
      searchQuery === "" ||
      r.title.includes(searchQuery) ||
      r.region.includes(searchQuery) ||
      r.author.includes(searchQuery)
    );
  }

  const filteredUserPosts = userPosts.filter(matchesSearch);
  const filteredDemoRoutes = demoRoutes.filter(matchesSearch);
  const isEmpty = filteredUserPosts.length === 0 && filteredDemoRoutes.length === 0;

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-gold font-medium uppercase mb-1">Community</p>
              <h1 className="font-heading text-2xl">커뮤니티</h1>
            </div>
            <button
              onClick={() => navigate("/app/community/write")}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              글쓰기
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="지역, 테마, 작성자"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-input-background text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground mb-6">등록된 루트가 없습니다</p>
            <button
              onClick={() => navigate("/app/community/write")}
              className="text-sm text-primary hover:underline"
            >
              첫 루트를 공유해보세요
            </button>
          </div>
        ) : (
          <>
            {filteredUserPosts.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">내 글</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredUserPosts.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      onOpen={() => navigate(`/app/community/${route.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {filteredDemoRoutes.length > 0 && (
              <section>
                {filteredUserPosts.length > 0 && (
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">전체 루트</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredDemoRoutes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      onOpen={() => navigate(`/app/community/${route.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
