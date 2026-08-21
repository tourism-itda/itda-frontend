import { useEffect, useState } from "react";
import { getContentDetail, ContentDetail } from "./contents";

export type ContentDetailStatus = "idle" | "loading" | "done" | "error";

export interface ContentDetailResult {
  status: ContentDetailStatus;
  data: ContentDetail | null;
}

/**
 * contentId(TMDB movieId)로 콘텐츠 상세를 조회하는 훅.
 * contentId가 바뀔 때마다 자동으로 다시 조회하고, 이전 요청 결과는 무시한다.
 */
export function useContentDetail(contentId: number | undefined): ContentDetailResult {
  const [status, setStatus] = useState<ContentDetailStatus>("idle");
  const [data, setData] = useState<ContentDetail | null>(null);

  useEffect(() => {
    if (contentId === undefined) {
      setStatus("idle");
      setData(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setData(null);

    getContentDetail(contentId)
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
