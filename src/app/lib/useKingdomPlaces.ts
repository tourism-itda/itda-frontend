import { useEffect, useState } from "react";
import { getKingdomPlaces, RelatedPlace } from "./explore";

export type KingdomPlacesStatus = "loading" | "done" | "error";

export interface KingdomPlacesResult {
  status: KingdomPlacesStatus;
  places: RelatedPlace[];
}

/**
 * GET /explore/kingdoms/{kingdom}/places로 나라(왕조)의 관련 장소를 조회하는 훅. 관련 장소가 없는
 * 나라는 빈 배열로 내려오므로("done" + places: [])는 정상 상태이고, 화면에서 빈 상태로 다룬다.
 * explore 도메인은 SecurityConfig에서 이미 permitAll로 공개돼 있어(비로그인도 200) 401/403 분기는
 * 두지 않는다.
 */
export function useKingdomPlaces(kingdomCode: string | undefined): KingdomPlacesResult {
  const [status, setStatus] = useState<KingdomPlacesStatus>("loading");
  const [places, setPlaces] = useState<RelatedPlace[]>([]);

  useEffect(() => {
    if (!kingdomCode) {
      setStatus("done");
      setPlaces([]);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setPlaces([]);

    getKingdomPlaces(kingdomCode)
      .then((result) => {
        if (cancelled) return;
        setPlaces(result);
        setStatus("done");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [kingdomCode]);

  return { status, places };
}
