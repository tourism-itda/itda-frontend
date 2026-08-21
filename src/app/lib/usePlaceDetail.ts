import { useEffect, useState } from "react";
import { getPlaceDetail, Place } from "./placeDetail";

export type PlaceDetailStatus = "idle" | "loading" | "done" | "error";

export interface PlaceDetailResult {
  status: PlaceDetailStatus;
  data: Place | null;
}

/**
 * 백엔드 장소 PK(place_id)로 장소 상세를 조회하는 훅.
 * placeId가 바뀔 때마다 자동으로 다시 조회하고, 이전 요청 결과는 무시한다.
 */
export function usePlaceDetail(placeId: number | undefined): PlaceDetailResult {
  const [status, setStatus] = useState<PlaceDetailStatus>("idle");
  const [data, setData] = useState<Place | null>(null);

  useEffect(() => {
    if (placeId === undefined) {
      setStatus("idle");
      setData(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setData(null);

    getPlaceDetail(placeId)
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
  }, [placeId]);

  return { status, data };
}
