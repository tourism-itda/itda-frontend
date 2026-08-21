import { useEffect, useState } from "react";
import { getContents, ContentListParams, ContentListResponse } from "./contents";

export type ContentsStatus = "loading" | "done" | "error";

export interface ContentsResult {
  status: ContentsStatus;
  data: ContentListResponse | null;
}

/**
 * GET /api/contents로 콘텐츠 목록을 조회하는 훅. params가 바뀔 때마다 자동으로 다시 조회하고,
 * 이전 요청 결과는 무시한다. 객체 identity가 아니라 각 필드 값 기준으로 재조회를 판단한다.
 */
export function useContents(params: ContentListParams): ContentsResult {
  const { q, mediaType, categoryId, sort, page, limit } = params;
  const [status, setStatus] = useState<ContentsStatus>("loading");
  const [data, setData] = useState<ContentListResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    getContents({ q, mediaType, categoryId, sort, page, limit })
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
  }, [q, mediaType, categoryId, sort, page, limit]);

  return { status, data };
}
