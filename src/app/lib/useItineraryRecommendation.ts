import { useEffect, useState } from "react";
import { ApiError } from "./api";
import { getItineraryRecommendation, ItineraryRecommendResponse } from "./itineraryRecommend";

export type ItineraryRecommendationStatus = "idle" | "loading" | "done" | "error";

export interface ItineraryRecommendationResult {
  status: ItineraryRecommendationStatus;
  data: ItineraryRecommendResponse | null;
  // status가 "error"일 때만 채워진다. 이제 404는 "콘텐츠 자체가 없음"만 의미하므로(장소가
  // 없는 경우는 200 + anchor_source:NONE) 백엔드 메시지를 그대로 보여줘도 된다.
  errorMessage: string | null;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (contentId === undefined) {
      setStatus("idle");
      setData(null);
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setData(null);
    setErrorMessage(null);

    getItineraryRecommendation(contentId)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus("done");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(err instanceof ApiError ? err.message : null);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [contentId]);

  return { status, data, errorMessage };
}
