import { useEffect, useState } from "react";
import { ApiError } from "./api";
import { getKingdomDetail, getPersonsByKingdom, Kingdom, Person } from "./explore";

export type DynastyDetailStatus = "loading" | "done" | "unauthenticated" | "not-found" | "error";

export interface DynastyDetailResult {
  status: DynastyDetailStatus;
  kingdom: Kingdom | null;
  persons: Person[];
}

/**
 * GET /explore/kingdoms/{kingdom}(No.22)와 GET /explore/kingdoms/{kingdom}/persons(No.23)를
 * 함께 조회하는 훅. kingdomCode는 Kingdom enum 값 그대로(대문자, 예: "GORYEO")여야 하고, 존재하지
 * 않는 값이면 400이 오는데 이 훅은 그 경우도 "not-found"로 묶어서 다룬다.
 */
export function useDynastyDetail(kingdomCode: string | undefined): DynastyDetailResult {
  const [status, setStatus] = useState<DynastyDetailStatus>("loading");
  const [kingdom, setKingdom] = useState<Kingdom | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);

  useEffect(() => {
    if (!kingdomCode) {
      setStatus("not-found");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setKingdom(null);
    setPersons([]);

    Promise.all([getKingdomDetail(kingdomCode), getPersonsByKingdom(kingdomCode)])
      .then(([kingdomResult, personsResult]) => {
        if (cancelled) return;
        setKingdom(kingdomResult);
        setPersons(personsResult);
        setStatus("done");
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
  }, [kingdomCode]);

  return { status, kingdom, persons };
}
