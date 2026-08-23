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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { isBookmarked, toggleBookmark } from "../lib/bookmarks";
import { usePlaceLookup } from "../lib/usePlaceLookup";
import { ApiError } from "../lib/api";
import { CommunityPostDetail, CommunityStop, getCommunityPostDetail, importItinerary } from "../lib/community";
import { Review, createReview, getReviews, toggleReviewLike } from "../lib/reviews";

/**
 * itda-backend CommunityController(No.41)/ReviewController(No.43,44)/ReviewLikeController(No.45),
 * ItineraryController.importItinerary(No.42) 연동. id 파라미터는 게시글 id가 아니라 itinerary_id다
 * (커뮤니티 "글" = 공유된 itinerary). 2026-08-22 dev 소스 기준.
 *
 * 백엔드에 없는 필드(작성자 한 줄 소개, 장소별 예상 소요시간)는 UI에서 뺐다 — 데이터가 없는데
 * placeholder로 채우면 실제로 존재하는 것처럼 보여서 오해를 준다.
 */

interface RouteStop {
  order: number;
  name: string;
  category: string;
  image: string;
  description: string;
  address: string;
  hours: string;
  lat: number;
  lng: number;
}

function toRouteStops(stops: CommunityStop[]): RouteStop[] {
  return stops.map((s) => ({
    order: s.visit_order,
    name: s.name ?? "이름 미상",
    category: s.category ?? "",
    image: s.image_url ?? "",
    description: s.description ?? "",
    address: s.address ?? "",
    hours: s.opening_hours ?? "",
    lat: s.latitude,
    lng: s.longitude,
  }));
}

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

type PostStatus = "loading" | "done" | "not-found" | "error";
type ReviewStatus = "loading" | "done" | "error";

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [postStatus, setPostStatus] = useState<PostStatus>("loading");
  const [post, setPost] = useState<CommunityPostDetail | null>(null);

  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("loading");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [likingIds, setLikingIds] = useState<Set<number>>(new Set());

  const [activeTab, setActiveTab] = useState<"route" | "review">("route");
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [stopSaved, setStopSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setPostStatus("loading");

    getCommunityPostDetail(id)
      .then((result) => {
        if (cancelled) return;
        setPost(result);
        setPostStatus("done");
      })
      .catch((err) => {
        if (cancelled) return;
        setPostStatus(err instanceof ApiError && err.status === 404 ? "not-found" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setReviewStatus("loading");

    getReviews(id)
      .then((result) => {
        if (cancelled) return;
        setReviews(result);
        setReviewStatus("done");
      })
      .catch(() => {
        if (cancelled) return;
        setReviewStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const stops = post ? toRouteStops(post.stops) : [];

  const stopBookmarkId = selectedStop ? `${id}-stop-${selectedStop.order}` : null;
  // selectedStop은 큐레이션된 루트 데이터(이름/카테고리/순서)이고, 실제 주소·운영시간·이미지·
  // 설명은 이름으로 관광정보 API를 조회해 보강한다. 조회 실패 시 큐레이션 데이터로 대체된다.
  const { status: stopLookupStatus, data: stopDetail } = usePlaceLookup(selectedStop?.name);

  useEffect(() => {
    setStopSaved(stopBookmarkId ? isBookmarked(stopBookmarkId) : false);
  }, [stopBookmarkId]);

  async function handleToggleLike(reviewId: number) {
    if (likingIds.has(reviewId)) return;
    const target = reviews.find((r) => r.review_id === reviewId);
    if (!target) return;
    const prevLiked = target.is_liked ?? false;
    const prevCount = target.like_count;

    setLikingIds((ids) => new Set(ids).add(reviewId));
    setReviews((prev) =>
      prev.map((r) =>
        r.review_id === reviewId
          ? { ...r, is_liked: !prevLiked, like_count: prevLiked ? prevCount - 1 : prevCount + 1 }
          : r
      )
    );

    try {
      const result = await toggleReviewLike(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.review_id === reviewId ? { ...r, is_liked: result.liked, like_count: result.like_count } : r
        )
      );
    } catch (err) {
      setReviews((prev) =>
        prev.map((r) => (r.review_id === reviewId ? { ...r, is_liked: prevLiked, like_count: prevCount } : r))
      );
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
        navigate("/login");
      } else {
        toast(err instanceof ApiError ? err.message : "좋아요 처리에 실패했어요.");
      }
    } finally {
      setLikingIds((ids) => {
        const next = new Set(ids);
        next.delete(reviewId);
        return next;
      });
    }
  }

  async function handleSubmitReview() {
    if (!id || !myComment.trim() || myRating === 0 || submittingReview) return;
    setSubmittingReview(true);
    try {
      const created = await createReview(id, myRating, myComment.trim());
      setReviews((prev) => [created, ...prev]);
      setMyComment("");
      setMyRating(0);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
        navigate("/login");
      } else {
        toast(err instanceof ApiError ? err.message : "리뷰 등록에 실패했어요.");
      }
    } finally {
      setSubmittingReview(false);
    }
  }

  function handleImport() {
    if (!id || importing) return;
    setImporting(true);
    importItinerary(id)
      .then(() => setShowImportModal(true))
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
          navigate("/login");
        } else {
          toast(err instanceof ApiError ? err.message : "가져오기에 실패했어요.");
        }
      })
      .finally(() => setImporting(false));
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href);
    toast("링크가 복사되었습니다.");
  }

  if (postStatus === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">불러오는 중이에요...</p>
      </div>
    );
  }

  if (postStatus === "not-found" || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="text-muted-foreground mb-1">공유된 루트를 찾을 수 없어요</p>
        <p className="text-sm text-muted-foreground/70 mb-5">삭제되었거나 공유가 해제된 루트일 수 있어요</p>
        <Button variant="outline" onClick={() => navigate("/app/community")}>커뮤니티로 돌아가기</Button>
      </div>
    );
  }

  if (postStatus === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="text-muted-foreground mb-1">불러오지 못했어요</p>
        <p className="text-sm text-muted-foreground/70">잠시 후 다시 시도해주세요</p>
      </div>
    );
  }

  const avgRating = post.rating ?? 0;

  return (
    <div className="min-h-screen pb-8">
      {/* 히어로 */}
      <div className="relative h-52 md:h-64 lg:h-80 overflow-hidden bg-muted">
        {post.thumbnail_url && (
          <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/65" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-11 h-11 rounded-full bg-navy/50 backdrop-blur-sm hanji-noise flex items-center justify-center text-ivory hover:bg-navy/70 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ivory focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="absolute bottom-5 lg:bottom-10 left-5 right-5 lg:left-0 lg:right-0">
          <div className="lg:max-w-[1280px] lg:mx-auto lg:px-8">
            <div className="flex items-center gap-1.5 mb-1">
              {post.tags.map((t) => (
                <span key={t} className="text-xs font-bold text-ivory/70 bg-ivory/15 rounded-full px-2 py-0.5">
                  #{t}
                </span>
              ))}
            </div>
            <h1 className="font-heading text-ivory text-2xl lg:text-4xl font-black leading-tight max-w-3xl">{post.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 mt-6 lg:mt-10 pb-10">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-12 lg:items-start">

          {/* 좌측: 탭 콘텐츠 */}
          <div className="space-y-6 lg:space-y-8">
            {/* 작성자 + 메타 — 모바일 전용 (데스크톱은 우측 사이드바에 표시) */}
            <div className="lg:hidden space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {post.author.profile_url ? (
                    <img src={post.author.profile_url} alt="" className="w-10 h-10 rounded-full bg-muted shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{post.author.nickname ?? "알 수 없음"}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0" onClick={handleImport} disabled={importing}>
                  {importing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                  가져오기
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>장소 {post.place_count}곳</span>
                {post.duration_label && (
                  <>
                    <span>·</span>
                    <span>{post.duration_label}</span>
                  </>
                )}
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                  <span className="text-foreground font-medium">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({post.review_count})</span>
                </div>
              </div>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-border">
              {(["route", "review"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 lg:flex-none lg:px-8 py-3 text-[16px] font-bold transition-colors relative ${
                    activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "route" ? "루트 경로" : `리뷰 ${post.review_count}`}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* 루트 탭 */}
            {activeTab === "route" && (
              <div className="space-y-1">
                <p className="text-[15px] leading-relaxed text-muted-foreground mb-6">
                  {post.description || "아직 등록된 소개가 없습니다."}
                </p>
                <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 space-y-1">
                  {stops.map((stop, idx) => (
                    <div key={stop.order}>
                      <button
                        onClick={() => setSelectedStop(stop)}
                        className="w-full bg-card border border-border rounded-[24px] overflow-hidden flex gap-4 p-5 text-left hover:bg-muted/30 hover:shadow-sm transition-all"
                      >
                        {stop.image ? (
                          <img src={stop.image} alt={stop.name} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-muted shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-muted-foreground">{stop.category}</span>
                          <p className="font-black text-[16px] mt-1 mb-1.5">{stop.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{stop.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center" />
                      </button>
                      {idx < stops.length - 1 && (
                        <div className="lg:hidden flex items-center justify-center gap-2 py-1.5">
                          <div className="h-px w-8 bg-border" />
                          <span className="text-muted-foreground/50 text-xs">↓</span>
                          <div className="h-px w-8 bg-border" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="hidden lg:flex gap-3 pt-6">
                  <Button onClick={handleImport} disabled={importing} className="h-12 px-6 text-[14px] font-black">
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "가져오기"}
                  </Button>
                  <Button variant="outline" className="h-12 px-6" onClick={handleShare}><Share2 className="w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {/* 리뷰 탭 */}
            {activeTab === "review" && (
              <div className="space-y-6">
                {/* 별점 분포 요약 */}
                <div className="bg-card border border-border rounded-[24px] p-6 flex items-center gap-8">
                  <div className="text-center shrink-0">
                    <p className="text-5xl font-black">{avgRating.toFixed(1)}</p>
                    <StarRating value={avgRating} size="sm" />
                    <p className="text-sm text-muted-foreground mt-1">{post.review_count}개 리뷰</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter((r) => r.rating === star).length;
                      const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <div className="bg-card border border-border rounded-[24px] p-6 space-y-3">
                  <p className="text-[16px] font-extrabold">리뷰 남기기</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setMyRating(n)}
                        className="p-2 -m-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                      className="flex-1 text-sm h-11 bg-input-background"
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitReview()}
                    />
                    <Button
                      onClick={handleSubmitReview}
                      disabled={!myComment.trim() || myRating === 0 || submittingReview}
                      className="h-11 px-4"
                    >
                      {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  {myRating === 0 && myComment.trim() && (
                    <p className="text-sm text-destructive">별점을 선택해주세요</p>
                  )}
                </div>

                {/* 리뷰 목록 */}
                {reviewStatus === "loading" && (
                  <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">리뷰를 불러오는 중이에요...</span>
                  </div>
                )}
                {reviewStatus === "error" && (
                  <p className="text-sm text-muted-foreground text-center py-10">리뷰를 불러오지 못했어요.</p>
                )}
                {reviewStatus === "done" && reviews.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!</p>
                )}
                {reviewStatus === "done" && reviews.length > 0 && (
                  <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
                    {reviews.map((review) => (
                      <div key={review.review_id} className="bg-card border border-border rounded-[24px] p-6">
                        <div className="flex items-center gap-2.5 mb-3">
                          {review.author_profile_url ? (
                            <img
                              src={review.author_profile_url}
                              alt=""
                              className="w-9 h-9 rounded-full bg-muted shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold">{review.author_nickname ?? "알 수 없음"}</p>
                              <StarRating value={review.rating} size="sm" />
                            </div>
                            <p className="text-sm text-muted-foreground">{review.created_at.slice(0, 10)}</p>
                          </div>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed mb-3">{review.content}</p>
                        <button
                          onClick={() => handleToggleLike(review.review_id)}
                          disabled={likingIds.has(review.review_id)}
                          className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-60 ${
                            review.is_liked ? "text-primary" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${review.is_liked ? "fill-current" : ""}`} />
                          <span>도움이 됐어요 {review.like_count}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 우측: 요약 사이드바 — 데스크톱 전용 */}
          <div className="hidden lg:block sticky top-24 mt-16 space-y-4">
            <div className="bg-card border border-border rounded-[28px] p-6">
              <div className="flex items-center gap-3 pb-5 mb-5 border-b border-border">
                {post.author.profile_url ? (
                  <img src={post.author.profile_url} alt="" className="w-12 h-12 rounded-full bg-muted shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-[15px]">{post.author.nickname ?? "알 수 없음"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-4xl font-black">{avgRating.toFixed(1)}</span>
                <div className="flex flex-col">
                  <StarRating value={avgRating} size="sm" />
                  <span className="text-sm text-muted-foreground mt-0.5">리뷰 {post.review_count}개</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-5 pt-5 border-t border-border">
                <span>장소 {post.place_count}곳</span>
                {post.duration_label && (
                  <>
                    <span>·</span>
                    <span>{post.duration_label}</span>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 장소 정보 바텀시트 */}
      {selectedStop && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* 딤 배경 */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm hanji-noise"
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
                className="w-11 h-11 rounded-full bg-muted flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Bookmark className={`w-4 h-4 ${stopSaved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
              <button
                onClick={() => setSelectedStop(null)}
                className="w-11 h-11 rounded-full bg-muted flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                <p className="text-sm font-medium">{selectedStop.name}</p>
              </div>
            </div>

            {/* 장소 정보 */}
            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              <div>
                <p className="text-sm text-muted-foreground mb-0.5">{selectedStop.category}</p>
                <h3 className="text-lg font-semibold">{selectedStop.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{stopDetail?.description ?? selectedStop.description}</p>
              </div>

              {stopLookupStatus === "loading" && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  실시간 정보를 불러오는 중...
                </div>
              )}
              {(stopLookupStatus === "error" || stopLookupStatus === "not-found") && (
                <p className="text-sm text-muted-foreground">
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm hanji-noise"
            onClick={() => setShowImportModal(false)}
          />
          <div className="relative bg-card w-full max-w-xs rounded-2xl shadow-2xl p-6 text-center">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
    </div>
  );
}
