import { useEffect, useState } from "react";
import { getPersonPlaces, RelatedPlace } from "./explore";

export type PersonPlacesStatus = "loading" | "done" | "error";

export interface PersonPlacesResult {
  status: PersonPlacesStatus;
  places: RelatedPlace[];
}

/**
 * GET /explore/persons/{personId}/places로 인물의 관련 장소를 조회하는 훅. 관련 장소가 없는 인물은
 * 빈 배열로 내려오므로("done" + places: [])는 정상 상태이고, 화면에서 빈 상태로 다룬다.
 * explore 도메인은 SecurityConfig에서 이미 permitAll로 공개돼 있어(비로그인도 200) 401/403 분기는
 * 두지 않는다.
 */
export function usePersonPlaces(personId: string | undefined): PersonPlacesResult {
  const [status, setStatus] = useState<PersonPlacesStatus>("loading");
  const [places, setPlaces] = useState<RelatedPlace[]>([]);

  useEffect(() => {
    if (!personId) {
      setStatus("done");
      setPlaces([]);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setPlaces([]);

    getPersonPlaces(personId)
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
  }, [personId]);

  return { status, places };
}
