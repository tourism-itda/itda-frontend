import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Search, Star, PenLine } from "lucide-react";
import { Input } from "../components/ui/input";
import { PageTitle } from "../components/PageTitle";
import { CommunityPost, getUserPosts } from "../lib/communityPosts";

interface RouteCardData {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  rating: number;
  reviewCount?: number;
  region: string;
  placeCount: number;
  thumbnail: string;
}

function RouteCard({ route, onOpen }: { route: RouteCardData; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group text-left bg-card rounded-[28px] border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* 썸네일 + 배지 오버레이 */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={route.thumbnail}
          alt={route.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute left-3 bottom-3">
          <span className="px-2.5 py-1 rounded-full bg-neutral-900/70 backdrop-blur-sm text-white text-[11px] font-bold tracking-wide">
            {route.region}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/70 backdrop-blur-sm text-white text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-primary text-primary" />
          {route.rating}
        </div>
      </div>

      {/* 본문 */}
      <div className="px-5 pt-5 pb-5">
        <p className="font-heading text-[18px] font-black mb-3 line-clamp-2 leading-snug">{route.title}</p>
        <div className="flex items-center gap-2 mb-2">
          <img src={route.authorAvatar} className="w-6 h-6 rounded-full shrink-0" />
          <span className="text-sm font-semibold text-foreground truncate">{route.author}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>장소 {route.placeCount}곳</span>
          {route.reviewCount !== undefined && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>리뷰 {route.reviewCount}개</span>
            </>
          )}
        </div>
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
      <div className="border-b border-border bg-card sticky top-0 lg:top-16 z-40">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <PageTitle eyebrow="Community" title="커뮤니티" />
            <button
              onClick={() => navigate("/app/community/write")}
              className="flex items-center gap-1.5 h-11 px-5 rounded-full bg-foreground text-background text-sm font-black hover:bg-foreground/90 transition-colors"
            >
              <PenLine className="w-4 h-4" />
              글쓰기
            </button>
          </div>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="지역, 테마, 작성자"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-full bg-input-background text-[16px] font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 space-y-12">
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
                <h2 className="text-[20px] font-black mb-5">내 글</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <h2 className="text-[20px] font-black mb-5">전체 루트</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
