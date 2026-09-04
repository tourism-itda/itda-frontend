import { useEffect, useState } from "react";
import { getPersonContents, PersonContent } from "./explore";

export type PersonContentsStatus = "loading" | "done" | "error";

export interface PersonContentsResult {
  status: PersonContentsStatus;
  contents: PersonContent[];
}

/**
 * GET /explore/persons/{personId}/contents로 인물의 관련 콘텐츠를 조회하는 훅. 관련 콘텐츠가 없는
 * 인물은 빈 배열로 내려오므로("done" + contents: [])는 정상 상태이고, 화면에서 빈 상태로 다룬다.
 */
export function usePersonContents(personId: string | undefined): PersonContentsResult {
  const [status, setStatus] = useState<PersonContentsStatus>("loading");
  const [contents, setContents] = useState<PersonContent[]>([]);

  useEffect(() => {
    if (!personId) {
      setStatus("done");
      setContents([]);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setContents([]);

    getPersonContents(personId)
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
  }, [personId]);

  return { status, contents };
}
