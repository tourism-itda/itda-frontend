import { useEffect, useState } from "react";
import { getItineraryRecommendation, ItineraryRecommendResponse } from "./itineraryRecommend";

export type ItineraryRecommendationStatus = "idle" | "loading" | "done" | "error";

export interface ItineraryRecommendationResult {
  status: ItineraryRecommendationStatus;
  data: ItineraryRecommendResponse | null;
}

/**
 * content_id로 일정 추천 미리보기를 조회하는 훅.
 * contentId가 바뀔 때마다 자동으로 다시 조회하고, 이전 요청 결과는 무시한다.
 */
export function useItineraryRecommendation(
  contentId: number | undefined
): ItineraryRecommendationResult {
  const [status, setStatus] = useState<ItineraryRecommendationStatus>("idle");
  const [data, setData] = useState<ItineraryRecommendResponse | null>(null);

  useEffect(() => {
    if (contentId === undefined) {
      setStatus("idle");
      setData(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setData(null);

    getItineraryRecommendation(contentId)
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
