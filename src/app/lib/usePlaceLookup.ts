import { useEffect, useState } from "react";
import { resolvePlaceByName, ResolvedPlaceDetail } from "./placeLookup";

export type PlaceLookupStatus = "idle" | "loading" | "done" | "not-found" | "error";

export interface PlaceLookupResult {
  status: PlaceLookupStatus;
  data: ResolvedPlaceDetail | null;
}

/**
 * 장소 이름을 실제 관광정보 API로 조회하는 훅.
 * name이 바뀔 때마다 자동으로 다시 조회하고, 이전 요청 결과는 무시한다.
 */
export function usePlaceLookup(name: string | undefined, areaCode?: string): PlaceLookupResult {
  const [status, setStatus] = useState<PlaceLookupStatus>("idle");
  const [data, setData] = useState<ResolvedPlaceDetail | null>(null);

  useEffect(() => {
    if (!name) {
      setStatus("idle");
      setData(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setData(null);

    resolvePlaceByName(name, { areaCode })
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setData(result);
          setStatus("done");
        } else {
          setStatus("not-found");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [name, areaCode]);

  return { status, data };
}
