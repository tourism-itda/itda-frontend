import { useEffect, useState } from "react";
import { getKingdoms, Kingdom } from "./explore";

export type KingdomsStatus = "loading" | "done" | "error";

export interface KingdomsResult {
  status: KingdomsStatus;
  data: Kingdom[];
}

/**
 * GET /explore/kingdoms(No.21)로 나라 목록을 조회하는 훅. explore 도메인은 SecurityConfig에서
 * 이미 permitAll로 공개돼 있어(비로그인도 200) 401/403 분기는 두지 않는다.
 */
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
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, data };
}
