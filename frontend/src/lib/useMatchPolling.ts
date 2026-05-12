import { useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { fetchAllSpaces } from "../data/seoul";
import { manualSpaces } from "../data/manualSpaces";
import { computeMatches, hasAnyPreference, type MatchableFacility } from "./matchSpaces";
import { isNotifEnabled, notifyNewMatches } from "./notifications";

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10분
const FIRST_CHECK_DELAY_MS = 5 * 1000;   // 마운트 직후 5초 후 첫 체크 (즉시 호출 방지)

/**
 * 로그인 + 알림 toggle ON + 사용자가 선호 정보 입력 했을 때만 동작.
 * 10분 간격으로 시설 목록을 받아서 매칭 공간 추출 → notifyNewMatches 로 위임.
 * 이미 알림 보낸 svc_id 는 notifications.ts 가 자체 추적.
 */
export function useMatchPolling() {
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready || !user) return;
    if (!isNotifEnabled()) return;
    if (!hasAnyPreference(user)) return;

    let cancelled = false;

    async function checkOnce() {
      if (cancelled) return;
      try {
        const rows = await fetchAllSpaces();
        if (cancelled || !user) return;
        const all: MatchableFacility[] = [
          ...(rows as MatchableFacility[]),
          ...manualSpaces,
        ];
        const matches = computeMatches(user, all, 20);
        if (matches.length === 0) return;

        notifyNewMatches(
          matches
            .filter((f) => Boolean(f.SVCID))
            .map((f) => ({
              id: f.SVCID!,
              title: f.SVCNM,
              body: `${f.AREANM ?? ""}${f.MINCLASSNM ? ` · ${f.MINCLASSNM}` : ""}${
                f.PAYATNM === "무료" ? " · 무료" : ""
              }`,
              url: `/spaces/${encodeURIComponent(f.SVCID!)}`,
            })),
        );
      } catch {
        /* 네트워크 실패 — 다음 폴링에서 재시도 */
      }
    }

    const firstId = setTimeout(checkOnce, FIRST_CHECK_DELAY_MS);
    const intervalId = setInterval(checkOnce, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(firstId);
      clearInterval(intervalId);
    };
  }, [ready, user]);
}
