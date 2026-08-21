import { useEffect, useState } from "react";
import { getContentRelatedPlaces, ContentPlaceListItem } from "./contents";

export type ContentPlacesStatus = "idle" | "loading" | "done" | "error";

export interface ContentPlacesResult {
  status: ContentPlacesStatus;
  data: ContentPlaceListItem[] | null;
}

/**
 * contentId(TMDB movieId)로 콘텐츠 관련 장소 목록을 조회하는 훅.
 * contentId가 바뀔 때마다 자동으로 다시 조회하고, 이전 요청 결과는 무시한다.
 */
export function useContentPlaces(contentId: number | undefined): ContentPlacesResult {
  const [status, setStatus] = useState<ContentPlacesStatus>("idle");
  const [data, setData] = useState<ContentPlaceListItem[] | null>(null);

  useEffect(() => {
    if (contentId === undefined) {
      setStatus("idle");
      setData(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setData(null);

    getContentRelatedPlaces(contentId)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus("done");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [contentId]);

  return { status, data };
}
