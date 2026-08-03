import {
  DetailIntroItem,
  getPlaceDetailCommon,
  getPlaceDetailIntro,
  searchPlacesByKeyword,
} from "./places";

export interface ResolvedPlaceDetail {
  contentId: string;
  address?: string;
  hours?: string;
  image?: string;
  description?: string;
  mapX?: string;
  mapY?: string;
}

// contentTypeId(관광지/문화시설/행사/음식점/숙박 등)에 따라 운영시간이 다른 필드에 들어있으므로
// 값이 채워진 첫 번째 필드를 사용한다.
function pickHours(intro: DetailIntroItem): string | undefined {
  return (
    intro.usetime ||
    intro.usetimeculture ||
    intro.usetimefestival ||
    intro.opentime ||
    intro.opentimefood ||
    intro.checkin ||
    undefined
  );
}

/**
 * 장소 이름으로 itda-backend의 관광정보 API(TourAPI)를 검색해 실제 주소·운영시간·이미지·
 * 설명을 가져온다. 검색 결과가 없으면 null을 반환하고, 네트워크/서버 오류는 그대로 throw한다
 * (호출부에서 "결과 없음"과 "조회 실패"를 구분해 처리할 수 있도록).
 */
export async function resolvePlaceByName(
  name: string,
  hint?: { areaCode?: string }
): Promise<ResolvedPlaceDetail | null> {
  const results = await searchPlacesByKeyword({
    keyword: name,
    numOfRows: 5,
    areaCode: hint?.areaCode,
  });
  if (results.length === 0) return null;
  const hit = results.find((r) => r.title === name) ?? results[0];

  const [common, intro] = await Promise.all([
    getPlaceDetailCommon({
      contentId: hit.contentid,
      contentTypeId: hit.contenttypeid,
      overviewYN: "Y",
      firstImageYN: "Y",
      addrInfoYN: "Y",
      mapInfoYN: "Y",
    }),
    getPlaceDetailIntro({
      contentId: hit.contentid,
      contentTypeId: hit.contenttypeid,
    }).catch(() => null),
  ]);

  return {
    contentId: hit.contentid,
    address: [common.addr1, common.addr2].filter(Boolean).join(" ") || undefined,
    image: common.firstimage || common.firstimage2 || undefined,
    description: common.overview || undefined,
    mapX: common.mapx || undefined,
    mapY: common.mapy || undefined,
    hours: intro ? pickHours(intro) : undefined,
  };
}
