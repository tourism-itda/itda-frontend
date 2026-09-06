import { useEffect, useState } from "react";
import { getPersons, Person } from "./explore";

export type PersonsStatus = "loading" | "done" | "error";

export interface PersonsResult {
  status: PersonsStatus;
  data: Person[];
}

/**
 * GET /explore/persons(No.24)로 전체 인물 목록을 조회하는 훅. explore 도메인은 SecurityConfig에서
 * 이미 permitAll로 공개돼 있어(비로그인도 200) 401/403 분기는 두지 않는다. 로컬 DB의 person 테이블이
 * 비어 있어 지금은 항상 빈 배열이 온다.
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
