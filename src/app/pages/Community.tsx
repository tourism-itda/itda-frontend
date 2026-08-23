import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Search, Star, PenLine } from "lucide-react";
import { Input } from "../components/ui/input";
import { PageTitle } from "../components/PageTitle";
import { CommunityPostSummary, getCommunityPosts } from "../lib/community";

type Status = "loading" | "done" | "error";

function RouteCard({ post, onOpen }: { post: CommunityPostSummary; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group text-left bg-card rounded-[28px] border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* 썸네일 + 배지 오버레이 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {post.thumbnail_url && (
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {post.region && (
          <div className="absolute left-3 bottom-3">
            <span className="px-2.5 py-1 rounded-full bg-neutral-900/70 backdrop-blur-sm text-white text-xs font-bold tracking-wide">
              {post.region}
            </span>
          </div>
        )}
        {post.rating !== null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/70 backdrop-blur-sm text-white text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            {post.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="px-5 pt-5 pb-5">
        <p className="font-heading text-[18px] font-black mb-3 line-clamp-2 leading-snug">{post.title}</p>
        <div className="flex items-center gap-2 mb-2">
          {post.author_profile_url && (
            <img src={post.author_profile_url} className="w-6 h-6 rounded-full shrink-0" />
          )}
          <span className="text-sm font-semibold text-foreground truncate">{post.author_nickname ?? "알 수 없음"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>장소 {post.place_count}곳</span>
          <span className="text-muted-foreground/40">·</span>
          <span>리뷰 {post.review_count}개</span>
        </div>
      </div>
    </button>
  );
}

export default function Community() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<Status>("loading");
  const [posts, setPosts] = useState<CommunityPostSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    // 타이핑마다 바로 요청하지 않도록 짧게 디바운스한다.
    const timer = setTimeout(() => {
      getCommunityPosts({ q: searchQuery.trim() || undefined })
        .then((result) => {
          if (cancelled) return;
          setPosts(result);
          setStatus("done");
        })
        .catch(() => {
          if (cancelled) return;
          setStatus("error");
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

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
              공유하기
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
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">루트를 불러오는 중이에요...</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground mb-1">루트를 불러오지 못했어요</p>
            <p className="text-sm text-muted-foreground/70">잠시 후 다시 시도해주세요</p>
          </div>
        )}

        {status === "done" && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground mb-6">등록된 루트가 없습니다</p>
            <button
              onClick={() => navigate("/app/community/write")}
              className="text-sm text-primary hover:underline"
            >
              첫 루트를 공유해보세요
            </button>
          </div>
        )}

        {status === "done" && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <RouteCard
                key={post.itinerary_id}
                post={post}
                onOpen={() => navigate(`/app/community/${post.itinerary_id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
