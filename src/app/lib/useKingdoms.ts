import { useEffect, useState } from "react";
import { ApiError } from "./api";
import { getKingdoms, Kingdom } from "./explore";

export type KingdomsStatus = "loading" | "done" | "unauthenticated" | "error";

export interface KingdomsResult {
  status: KingdomsStatus;
  data: Kingdom[];
}

/** GET /explore/kingdoms(No.21)로 나라 목록을 조회하는 훅. 비로그인 시 403이 나는 실제 동작을 반영한다. */
export function useKingdoms(): KingdomsResult {
  const [status, setStatus] = useState<KingdomsStatus>("loading");
  const [data, setData] = useState<Kingdom[]>([]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getKingdoms()
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
