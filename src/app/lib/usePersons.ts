import { useEffect, useState } from "react";
import { getPersons, Person } from "./explore";

export type PersonsStatus = "loading" | "done" | "error";

export interface PersonsResult {
  status: PersonsStatus;
  data: Person[];
}

/**
 * GET /explore/persons(No.24)로 전체 인물 목록을 조회하는 훅. explore 도메인은 SecurityConfig에서
 * 이미 permitAll로 공개돼 있어(비로그인도 200) 401/403 분기는 두지 않는다. 고려 이전 인물은
 * getPersons()가 이미 걸러서 반환한다(explore.ts의 PRE_GORYEO_KINGDOMS 참고).
 */
export function usePersons(): PersonsResult {
  const [status, setStatus] = useState<PersonsStatus>("loading");
  const [data, setData] = useState<Person[]>([]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getPersons()
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
  }, []);

  return { status, data };
}
