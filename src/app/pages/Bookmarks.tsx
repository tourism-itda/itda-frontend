import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Bookmark, Loader2, LogIn, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import { ApiError, isLoginRequiredError } from "../lib/api";
import { BookmarkListItem, deleteBookmark, getMyBookmarks } from "../lib/bookmarksApi";
import { PlaceImage } from "../components/PlaceImage";
import { PlaceSheet, PlaceSheetData } from "../components/PlaceSheet";

type Status = "loading" | "done" | "unauthenticated" | "error";

export default function Bookmarks() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<Status>("loading");
  const [bookmarks, setBookmarks] = useState<BookmarkListItem[]>([]);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [sheetPlace, setSheetPlace] = useState<PlaceSheetData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getMyBookmarks()
      .then((result) => {
        if (cancelled) return;
        setBookmarks(result);
        setStatus("done");
      })
      .catch((err) => {
        if (cancelled) return;
        // itda-backend는 인증 필요 라우트에 토큰이 없으면 401이 아니라 403(Forbidden)을 반환할 수 있다
        // (Spring Security 기본 동작, ItineraryRecommendation.tsx와 동일한 처리).
        if (isLoginRequiredError(err)) {
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openPlace(place: BookmarkListItem) {
    // 주소·운영시간·설명은 시트가 placeId로 장소 상세 API를 조회해 채운다.
    setSheetPlace({
      id: String(place.place_id),
      placeId: place.place_id,
      bookmarkId: place.bookmark_id,
      name: place.name,
      category: place.category,
      address: place.region ?? "",
      hours: "",
      image: place.image_url ?? "",
      description: "",
    });
  }

  // 시트 안에서도 북마크를 해제할 수 있으므로, 닫을 때 목록을 다시 불러와 맞춘다(실패하면 기존 목록 유지).
  function closeSheet() {
    setSheetPlace(null);
    getMyBookmarks()
      .then(setBookmarks)
      .catch(() => {});
  }

  async function handleRemove(bookmarkId: number) {
    if (removingIds.has(bookmarkId)) return;

    const prev = bookmarks;
    setRemovingIds((ids) => new Set(ids).add(bookmarkId));
    setBookmarks((cur) => cur.filter((b) => b.bookmark_id !== bookmarkId));

    try {
      await deleteBookmark(bookmarkId);
    } catch (err) {
      setBookmarks(prev);
      if (isLoginRequiredError(err)) {
        toast("로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.");
        navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
      } else {
        toast(err instanceof ApiError ? err.message : "북마크 삭제에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setRemovingIds((ids) => {
        const next = new Set(ids);
        next.delete(bookmarkId);
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card sticky top-0 lg:top-16 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 -ml-2.5 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="font-heading text-xl">내 북마크</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">북마크를 불러오는 중이에요...</p>
          </div>
        )}

        {status === "unauthenticated" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <LogIn className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">로그인이 필요한 기능이에요</p>
            <p className="text-sm text-muted-foreground/70 mb-5">로그인하고 저장한 장소를 확인해보세요</p>
            <Button onClick={() => navigate("/login", { replace: true, state: { from: location.pathname + location.search } })}>로그인하기</Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bookmark className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">북마크를 불러오지 못했어요</p>
            <p className="text-sm text-muted-foreground/70">잠시 후 다시 시도해주세요</p>
          </div>
        )}

        {status === "done" && bookmarks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bookmark className="w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">저장한 장소가 없습니다</p>
            <p className="text-sm text-muted-foreground/70">장소 상세 정보에서 북마크 아이콘을 눌러 저장해보세요</p>
          </div>
        )}

        {status === "done" && bookmarks.length > 0 && (
          <div className="divide-y divide-border border-t border-border">
            {bookmarks.map((place) => (
              <div key={place.bookmark_id} className="flex gap-3 py-4">
                <button
                  type="button"
                  onClick={() => openPlace(place)}
                  className="flex flex-1 min-w-0 gap-3 text-left"
                >
                  <PlaceImage
                    src={place.image_url}
                    alt={place.name}
                    category={place.category}
                    className="w-20 h-20 rounded-sm object-cover border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-sm text-muted-foreground mb-1">{place.category}</p>
                    <p className="font-heading mb-1.5 truncate">{place.name}</p>
                    {place.region && (
                      <div className="flex items-start gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{place.region}</span>
                      </div>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleRemove(place.bookmark_id)}
                  disabled={removingIds.has(place.bookmark_id)}
                  aria-label="북마크 삭제"
                  className="self-center w-11 h-11 -mr-2 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0 disabled:opacity-60"
                >
                  <Bookmark className="w-4 h-4 fill-primary text-primary" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <PlaceSheet place={sheetPlace} onClose={closeSheet} />
    </div>
  );
}
