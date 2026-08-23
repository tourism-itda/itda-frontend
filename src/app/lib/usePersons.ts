import { useEffect, useState } from "react";
import { ApiError } from "./api";
import { getPersons, Person } from "./explore";

export type PersonsStatus = "loading" | "done" | "unauthenticated" | "error";

export interface PersonsResult {
  status: PersonsStatus;
  data: Person[];
}

/**
 * GET /explore/persons(No.24)로 전체 인물 목록을 조회하는 훅. 비로그인 시 403이 나는 실제 동작을
 * 반영한다. 로컬 DB의 person 테이블이 비어 있어 로그인해도 지금은 빈 배열이 온다.
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
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, data };
}
