import { useEffect, useState } from "react";
import { ApiError } from "./api";
import { getKingdomDetail, getPersonDetail, Person } from "./explore";

export type PersonDetailStatus = "loading" | "done" | "unauthenticated" | "not-found" | "error";

export interface PersonDetailResult {
  status: PersonDetailStatus;
  person: Person | null;
  /** person.kingdom(enum 코드)을 사람이 읽는 한글 이름으로 바꾼 값. 조회 실패 시 person.kingdom 그대로. */
  kingdomName: string | null;
}

/**
 * GET /explore/persons/{personId}(No.25)로 인물 상세를 조회하는 훅. 존재하지 않는 personId는
 * 404가 아니라 400으로 온다(PersonService.getPerson 참고) — "not-found"로 묶어서 다룬다.
 * 인물의 소속 나라 한글 이름은 별도 필드가 없어 GET /explore/kingdoms/{kingdom}(No.22)을 이어서
 * 호출해 채운다.
 */
export function usePersonDetail(personId: string | undefined): PersonDetailResult {
  const [status, setStatus] = useState<PersonDetailStatus>("loading");
  const [person, setPerson] = useState<Person | null>(null);
  const [kingdomName, setKingdomName] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) {
      setStatus("not-found");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setPerson(null);
    setKingdomName(null);

    getPersonDetail(personId)
      .then((result) => {
        if (cancelled) return;
        setPerson(result);
        setStatus("done");
        return getKingdomDetail(result.kingdom)
          .then((kingdomResult) => {
            if (!cancelled) setKingdomName(kingdomResult.name);
          })
          .catch(() => {
            if (!cancelled) setKingdomName(result.kingdom);
          });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setStatus("unauthenticated");
        } else if (err instanceof ApiError && err.status === 400) {
          setStatus("not-found");
        } else {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [personId]);

  return { status, person, kingdomName };
}
