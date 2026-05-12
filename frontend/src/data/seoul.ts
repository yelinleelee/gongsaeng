import axios from "axios";

const API_KEY = import.meta.env.VITE_SEOUL_API_KEY;

// Vite/Vercel 가 /seoul-api/* → openapi.seoul.go.kr:8088/* 로 프록시
// (mixed-content 방지 + CORS 우회)
const BASE = "/seoul-api";

/* ─────────────────────────────────────────────────────────────── */
/*  공통 Facility 타입 — 모든 API 소스를 이 모양으로 정규화          */
/* ─────────────────────────────────────────────────────────────── */
export interface SeoulFacility {
  SVCID?: string;
  SVCNM: string;
  PLACENM?: string;
  AREANM?: string;
  PAYATNM?: string;
  IMGURL?: string;
  SVCURL?: string;
  MINCLASSNM?: string;
  MAXCLASSNM?: string;
  V_MAX?: string;
  SVCSTATNM?: string;
  X?: string;
  Y?: string;
  ADDR?: string;
  OPENHOURS?: string;
}

async function safeGet<T>(path: string): Promise<T | null> {
  try {
    const res = await axios.get(path);
    return res.data as T;
  } catch (err) {
    console.warn("[seoul-api] fetch failed:", path, err);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────── */
/*  공공서비스예약 시스템 — 실제 "예약"이 가능한 시설만               */
/*    1) Institution (기관시설)                                    */
/*    2) Culture (문화행사)                                        */
/*    3) Sport (체육시설)                                          */
/*                                                                 */
/*  ※ culturalSpaceInfo (미술관/박물관 등 단순 관람시설),           */
/*    SearchParkInfoService (공원) 등은 예약 시스템이 아니므로     */
/*    의도적으로 제외.                                             */
/* ─────────────────────────────────────────────────────────────── */
type ReservationRow = SeoulFacility & { row?: never };
type ReservationRes<K extends string> = Record<K, { row?: ReservationRow[] }>;

async function fetchReservationInstitution(): Promise<SeoulFacility[]> {
  const data = await safeGet<ReservationRes<"ListPublicReservationInstitution">>(
    `${BASE}/${API_KEY}/json/ListPublicReservationInstitution/1/100/`,
  );
  return data?.ListPublicReservationInstitution?.row ?? [];
}

async function fetchReservationCulture(): Promise<SeoulFacility[]> {
  const data = await safeGet<ReservationRes<"ListPublicReservationCulture">>(
    `${BASE}/${API_KEY}/json/ListPublicReservationCulture/1/100/`,
  );
  return data?.ListPublicReservationCulture?.row ?? [];
}

async function fetchReservationSport(): Promise<SeoulFacility[]> {
  const data = await safeGet<ReservationRes<"ListPublicReservationSport">>(
    `${BASE}/${API_KEY}/json/ListPublicReservationSport/1/100/`,
  );
  return data?.ListPublicReservationSport?.row ?? [];
}

/* ─────────────────────────────────────────────────────────────── */
/*  통합 fetcher — 3개 예약 API 병렬 fetch + dedupe                 */
/* ─────────────────────────────────────────────────────────────── */
function dedupe(rows: SeoulFacility[]): SeoulFacility[] {
  const seen = new Set<string>();
  const out: SeoulFacility[] = [];
  for (const r of rows) {
    if (!r.SVCNM) continue;
    const key = r.SVCID || `${r.SVCNM}__${r.PLACENM || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export async function fetchAllSpaces(): Promise<SeoulFacility[]> {
  const [inst, culture, sport] = await Promise.all([
    fetchReservationInstitution(),
    fetchReservationCulture(),
    fetchReservationSport(),
  ]);
  return dedupe([...inst, ...culture, ...sport]);
}

/* ─────────────────────────────────────────────────────────────── */
/*  Backward compat — 기존 호출부 유지                              */
/* ─────────────────────────────────────────────────────────────── */
export const fetchInstitutionFacilities = async () => {
  return safeGet(
    `${BASE}/${API_KEY}/json/ListPublicReservationInstitution/1/100/`,
  );
};

export const fetchCultureEvents = async () => {
  return safeGet(`${BASE}/${API_KEY}/json/ListPublicReservationCulture/1/100/`);
};
