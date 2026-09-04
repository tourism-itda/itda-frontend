import { useEffect, useState } from "react";
import { getKingdomContents, PersonContent } from "./explore";

export type KingdomContentsStatus = "loading" | "done" | "error";

export interface KingdomContentsResult {
  status: KingdomContentsStatus;
  contents: PersonContent[];
}

/**
 * GET /explore/kingdoms/{kingdom}/contents로 나라(왕조)의 관련 콘텐츠를 조회하는 훅. 관련 콘텐츠가
 * 없는 나라는 빈 배열로 내려오므로("done" + contents: [])는 정상 상태이고, 화면에서 빈 상태로 다룬다.
 * explore 도메인은 SecurityConfig에서 이미 permitAll로 공개돼 있어(비로그인도 200) 401/403 분기는
 * 두지 않는다.
 */
export function useKingdomContents(kingdomCode: string | undefined): KingdomContentsResult {
  const [status, setStatus] = useState<KingdomContentsStatus>("loading");
  const [contents, setContents] = useState<PersonContent[]>([]);

  useEffect(() => {
    if (!kingdomCode) {
      setStatus("done");
      setContents([]);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setContents([]);

    getKingdomContents(kingdomCode)
      .then((result) => {
        if (cancelled) return;
        setContents(result);
        setStatus("done");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [kingdomCode]);

  return { status, contents };
}
