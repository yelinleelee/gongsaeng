// 사용자 프로필 기반 공간 매칭 — MyPage 추천 + 알림 폴링이 공유
import type { CurrentUser } from "../auth/AuthContext";

export interface MatchableFacility {
  SVCID?: string;
  SVCNM: string;
  PLACENM?: string;
  AREANM?: string;
  PAYATNM?: string;
  IMGURL?: string;
  SVCURL?: string;
  MINCLASSNM?: string;
  V_MAX?: string;
  X?: string;
  Y?: string;
}

// 사용자 선호 카테고리 → 실제 MINCLASSNM 값 매핑
export const CATEGORY_TO_MINCLASS: Record<string, string[]> = {
  "공연장": ["공연장"],
  "다목적실": ["다목적실"],
  "전시·관람": ["전시/관람"],
  "강당·강의실": ["강당", "강의실"],
  "회의실": ["회의실"],
  "광장·야외": ["광장"],
  "녹화·촬영": ["녹화장소"],
};

export function splitCSV(s: string): string[] {
  return s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
}

export function joinCSV(arr: string[]): string {
  return arr.join(",");
}

export function capacityBucket(vmax: string): string | null {
  const n = parseInt(vmax, 10);
  if (isNaN(n)) return null;
  if (n <= 10) return "10명 이하";
  if (n <= 30) return "10~30명";
  if (n <= 100) return "30~100명";
  return "100명 이상";
}

export function hasAnyPreference(user: CurrentUser): boolean {
  return Boolean(
    user.preferred_categories ||
      user.preferred_districts ||
      user.preferred_capacity,
  );
}

/**
 * 사용자 선호와 facility 의 매칭 점수.
 * 카테고리 +3, 지역 +2, 인원 +1. 0이면 매치 아님.
 */
export function matchScore(user: CurrentUser, f: MatchableFacility): number {
  const prefCats = splitCSV(user.preferred_categories);
  const prefDistricts = splitCSV(user.preferred_districts);
  const prefCapacity = user.preferred_capacity;

  const allowedMinClass = new Set(
    prefCats.flatMap((c) => CATEGORY_TO_MINCLASS[c] ?? []),
  );

  let score = 0;
  if (allowedMinClass.size > 0 && allowedMinClass.has(f.MINCLASSNM ?? "")) score += 3;
  if (prefDistricts.length > 0 && prefDistricts.includes(f.AREANM ?? "")) score += 2;
  if (prefCapacity && f.V_MAX && capacityBucket(f.V_MAX) === prefCapacity) score += 1;
  return score;
}

/**
 * 매칭된 facility 들을 점수 내림차순으로 정렬해서 반환.
 * limit 지정 시 상위 N개만.
 */
export function computeMatches<T extends MatchableFacility>(
  user: CurrentUser,
  facilities: T[],
  limit?: number,
): T[] {
  if (!hasAnyPreference(user) || facilities.length === 0) return [];
  const scored = facilities
    .map((f) => ({ f, score: matchScore(user, f) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.f);
  return limit ? scored.slice(0, limit) : scored;
}
