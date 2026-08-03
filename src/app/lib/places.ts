import { apiFetch } from "./api";

/**
 * itda-backend PlaceController (`/api/places/**`)를 감싸는 클라이언트.
 *
 * 백엔드 DTO(`com.tourism.itda.place.dto.*`)는 각 필드에 `@JsonProperty("소문자명")`을 붙여
 * 한국관광공사 원본 API의 키 이름(contentid, mapx, addr1 등)을 그대로 직렬화합니다.
 * 즉 실제 응답 JSON의 key는 자바 필드명(contentId)이 아니라 소문자 원본명(contentid)이므로,
 * 아래 타입들도 실제 응답 키 이름 그대로 정의합니다.
 */

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ─── 목록 조회 공통 필드 (locationBasedList2 / searchKeyword2 / areaBasedSyncList2 등) ───

export interface PlaceListItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2: string;
  areacode: string;
  sigungucode: string;
  cat1: string;
  cat2: string;
  cat3: string;
  firstimage: string;
  firstimage2: string;
  cpyrhtDivCd: string;
  mapx: string;
  mapy: string;
  mlevel: string;
  tel: string;
  booktour: string;
  createdtime: string;
  modifiedtime: string;
}

export interface LocationBasedListItem extends PlaceListItem {
  dist: string;
}

export type KeywordSearchItem = PlaceListItem;

export interface FestivalItem extends PlaceListItem {
  eventstartdate: string;
  eventenddate: string;
  sponsor1: string;
  sponsor1tel: string;
  sponsor2: string;
  sponsor2tel: string;
}

export interface AreaBasedSyncItem extends PlaceListItem {
  showflag: string;
}

export interface DetailCommonItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  createdtime: string;
  modifiedtime: string;
  tel: string;
  telname: string;
  homepage: string;
  booktour: string;
  firstimage: string;
  firstimage2: string;
  cpyrhtDivCd: string;
  areacode: string;
  sigungucode: string;
  cat1: string;
  cat2: string;
  cat3: string;
  addr1: string;
  addr2: string;
  zipcode: string;
  mapx: string;
  mapy: string;
  mlevel: string;
  overview: string;
}

/**
 * detailIntro2 응답. contentTypeId(관광지/문화시설/행사·공연·축제/레포츠/숙박/쇼핑/음식점)에 따라
 * 실제로 채워지는 필드 그룹이 다르므로 전부 선택적(optional) 필드로 둡니다.
 */
export interface DetailIntroItem {
  contentid: string;
  contenttypeid: string;

  // 관광지
  infocenter?: string;
  restdate?: string;
  expguide?: string;
  heritage1?: string;
  heritage2?: string;
  heritage3?: string;
  accomcount?: string;
  useseason?: string;
  usetime?: string;
  parking?: string;
  opendate?: string;
  expagerange?: string;
  accomcountparking?: string;
  parkingfee?: string;
  chkbabycarriage?: string;
  chkpet?: string;
  chkcreditcard?: string;

  // 문화시설
  infocenterculture?: string;
  restdateculture?: string;
  accomcountculture?: string;
  usetimeculture?: string;
  parkingculture?: string;
  parkingfeeculture?: string;
  chkbabycarriageculture?: string;
  chkpetculture?: string;
  chkcreditcardculture?: string;
  spendtime?: string;
  discount?: string;
  scale?: string;
  museum?: string;
  gallery?: string;

  // 행사/공연/축제
  eventstartdate?: string;
  eventenddate?: string;
  sponsor1?: string;
  sponsor1tel?: string;
  sponsor2?: string;
  sponsor2tel?: string;
  eventplace?: string;
  playtime?: string;
  usetimefestival?: string;
  spendtimefestival?: string;
  discountinfofestival?: string;
  bookingplace?: string;
  subevent?: string;
  program?: string;
  agelimit?: string;
  eventhomepage?: string;

  // 레포츠
  infocenterleports?: string;
  restdateleports?: string;
  accomcountleports?: string;
  useageleports?: string;
  usefeeleports?: string;
  expagerangeleports?: string;
  parkingleports?: string;
  parkingfeeleports?: string;
  chkbabycarriageleports?: string;
  chkpetleports?: string;
  chkcreditcardleports?: string;
  openperiod?: string;
  reservation?: string;

  // 숙박
  checkin?: string;
  checkout?: string;
  infocenterlodging?: string;
  parkinglodging?: string;
  pickupservice?: string;
  foodplace?: string;
  reservationlodging?: string;
  reservationurl?: string;
  roomtype?: string;
  scalelodging?: string;
  subfacility?: string;
  barbecue?: string;
  beauty?: string;
  beverage?: string;
  bicycle?: string;
  campfire?: string;
  fitness?: string;
  karaoke?: string;
  publicbath?: string;
  publicpc?: string;
  sauna?: string;
  seminar?: string;
  sports?: string;
  refundregulation?: string;
  accomcountlodging?: string;
  benikia?: string;
  chkcooking?: string;
  goodstay?: string;
  hanok?: string;
  theme?: string;

  // 쇼핑
  restdateshopping?: string;
  opentime?: string;
  parkingshopping?: string;
  chkbabycarriageshopping?: string;
  chkpetshopping?: string;
  chkcreditcardshopping?: string;
  sellitem?: string;
  fairday?: string;
  saleitem?: string;
  shopguide?: string;

  // 음식점
  opentimefood?: string;
  restdatefood?: string;
  parkingfood?: string;
  chkbabycarriagefood?: string;
  chkpetfood?: string;
  chkcreditcardfood?: string;
  firstmenu?: string;
  treatmenu?: string;
  lcnsno?: string;
  smoking?: string;
  seat?: string;
  kidsfacility?: string;
  packing?: string;
  infocenterfood?: string;
  reservationfood?: string;
}

export interface DetailImageItem {
  contentid: string;
  originimgurl: string;
  imgname: string;
  smallimageurl: string;
  cpyrhtDivCd: string;
  serialnum: string;
}

// TarRlteTarService1 (연관 관광지)는 원본 API 자체가 카멜케이스 필드명을 사용합니다.
export interface RelatedTourismItem {
  baseYm: string;
  tAtsCd: string;
  tAtsNm: string;
  areaCd: string;
  areaNm: string;
  signguCd: string;
  signguNm: string;
  rlteTatsCd: string;
  rlteTatsNm: string;
  rlteRegnCd: string;
  rlteRegnNm: string;
  rlteSignguCd: string;
  rlteSignguNm: string;
  rlteCtgryLclsNm: string;
  rlteCtgryMclsNm: string;
  rlteCtgrySclsNm: string;
  rlteRank: string;
}

// ─── 요청 파라미터 & API 함수 ───

interface PageParams {
  pageNo?: number;
  numOfRows?: number;
}

export interface LocationBasedParams extends PageParams {
  mapX: string;
  mapY: string;
  radius: string;
  contentTypeId?: string;
  areaCode?: string;
  sigunguCode?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  arrange?: string;
  listYN?: string;
}

// 위치기반 관광정보조회 - locationBasedList2
export function getLocationBasedPlaces(params: LocationBasedParams) {
  return apiFetch<LocationBasedListItem[]>(`/api/places/location${buildQuery(params)}`);
}

export interface KeywordSearchParams extends PageParams {
  keyword: string;
  contentTypeId?: string;
  areaCode?: string;
  sigunguCode?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  arrange?: string;
  listYN?: string;
}

// 키워드 검색 조회 - searchKeyword2
export function searchPlacesByKeyword(params: KeywordSearchParams) {
  return apiFetch<KeywordSearchItem[]>(`/api/places/keyword${buildQuery(params)}`);
}

export interface FestivalSearchParams extends PageParams {
  eventStartDate: string;
  eventEndDate?: string;
  areaCode?: string;
  sigunguCode?: string;
  arrange?: string;
  listYN?: string;
}

// 행사정보조회 - searchFestival2
export function searchFestivals(params: FestivalSearchParams) {
  return apiFetch<FestivalItem[]>(`/api/places/festivals${buildQuery(params)}`);
}

export interface DetailCommonParams {
  contentId: string;
  contentTypeId?: string;
  defaultYN?: string;
  firstImageYN?: string;
  areaInfoYN?: string;
  addrInfoYN?: string;
  mapInfoYN?: string;
  overviewYN?: string;
}

// 공통정보조회 - detailCommon2
export function getPlaceDetailCommon(params: DetailCommonParams) {
  return apiFetch<DetailCommonItem>(`/api/places/common${buildQuery(params)}`);
}

export interface DetailIntroParams {
  contentId: string;
  contentTypeId: string;
}

// 소개정보조회 - detailIntro2
export function getPlaceDetailIntro(params: DetailIntroParams) {
  return apiFetch<DetailIntroItem>(`/api/places/intro${buildQuery(params)}`);
}

export interface DetailImagesParams extends PageParams {
  contentId: string;
  imageYN?: string;
  subImageYN?: string;
}

// 이미지정보조회 - detailImage2
export function getPlaceDetailImages(params: DetailImagesParams) {
  return apiFetch<DetailImageItem[]>(`/api/places/images${buildQuery(params)}`);
}

export interface RelatedTourismParams extends PageParams {
  keyword: string;
  areaCd: string;
  signguCd?: string;
  baseYm?: string;
}

// 키워드 검색 연관 관광지 정보 조회 - TarRlteTarService/searchKeyword1
export function searchRelatedTourismByKeyword(params: RelatedTourismParams) {
  return apiFetch<RelatedTourismItem[]>(`/api/places/related/keyword${buildQuery(params)}`);
}

export interface AreaBasedSyncParams extends PageParams {
  areaCode?: string;
  sigunguCode?: string;
  contentTypeId?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  arrange?: string;
  listYN?: string;
  modifiedTime?: string;
}

// 관광정보 동기화 목록 조회 - areaBasedSyncList2
export function getAreaBasedSync(params: AreaBasedSyncParams) {
  return apiFetch<AreaBasedSyncItem[]>(`/api/places/sync${buildQuery(params)}`);
}
