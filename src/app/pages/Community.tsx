import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Search, Star, PenLine, MapPinned } from "lucide-react";
import { Input } from "../components/ui/input";
import { PageTitle } from "../components/PageTitle";
import { CommunityPostSummary, getCommunityPosts } from "../lib/community";
import { getAvatarUrl, getProxiedImageUrl } from "../lib/imageProxy";
import { PlaceImage } from "../components/PlaceImage";

type Status = "loading" | "done" | "error";

// 카드 높이가 들쭉날쭉해지지 않도록 목록에서는 태그를 이만큼만 보여주고 나머지는 "+N"으로 줄인다.
const MAX_CARD_TAGS = 3;

function RouteCard({ post, onOpen }: { post: CommunityPostSummary; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group text-left bg-card rounded-[28px] border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* 썸네일 + 배지 오버레이 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <PlaceImage
          src={post.thumbnail_url}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* 이미지 왼쪽 아래: 지역 배지를 위에, 그 아래에 태그를 쌓는다. */}
        {(post.region || post.tags.length > 0) && (
          <div className="absolute left-3 right-3 bottom-3 flex flex-col items-start gap-1.5">
            {post.region && (
              <span className="px-2.5 py-1 rounded-full bg-neutral-900/70 backdrop-blur-sm text-white text-xs font-bold tracking-wide">
                {post.region}
              </span>
            )}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 max-w-full">
                {post.tags.slice(0, MAX_CARD_TAGS).map((t) => (
                  // 스페이스 입력 규칙이 생기기 전에는 공백이 든 긴 태그도 저장할 수 있었다 — 카드를 넘치지 않게 말줄임.
                  <span
                    key={t}
                    className="max-w-full truncate px-2 py-0.5 rounded-full bg-white border border-black text-black text-xs font-medium"
                  >
                    #{t}
                  </span>
                ))}
                {post.tags.length > MAX_CARD_TAGS && (
                  <span className="px-2 py-0.5 rounded-full bg-white border border-black text-black text-xs font-medium">
                    +{post.tags.length - MAX_CARD_TAGS}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        {post.rating != null && (
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
          <img
            src={getProxiedImageUrl(getAvatarUrl(post.author_profile_url, post.author_nickname))}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full shrink-0"
          />
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
          <div className="mb-5">
            <PageTitle title="커뮤니티" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-2xl flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="작품 이름, 루트 제목, 작성자, 지역을 검색해보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-full bg-input-background text-[16px] font-semibold"
              />
            </div>
            <button
              onClick={() => navigate("/app/community/write")}
              className="flex items-center gap-1.5 h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-black hover:bg-primary/90 transition-colors shrink-0"
            >
              <PenLine className="w-4 h-4" />
              공유하기
            </button>
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
            <MapPinned className="w-10 h-10 mx-auto mb-4 text-muted-foreground/40" />
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
