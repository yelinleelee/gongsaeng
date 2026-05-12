// 브라우저 Notification API 헬퍼
// - 사용자 toggle 상태(localStorage) + 권한 상태(Notification.permission) 둘 다 통과해야 알림 발사
// - 이미 알림 보낸 svc_id 는 SEEN_KEY 에 누적 저장 → 같은 공간 두 번 알리지 않음

const PREF_KEY = "gongsaeng_notif_enabled";
const SEEN_KEY = "gongsaeng_notif_seen_ids";

export function isNotifSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotifPermission(): NotificationPermission | "unsupported" {
  if (!isNotifSupported()) return "unsupported";
  return Notification.permission;
}

export function isNotifEnabled(): boolean {
  if (!isNotifSupported()) return false;
  return (
    localStorage.getItem(PREF_KEY) === "true" &&
    Notification.permission === "granted"
  );
}

/** 사용자가 toggle ON 했을 때 호출. 권한이 없으면 요청. 결과 boolean 리턴. */
export async function enableNotifications(): Promise<boolean> {
  if (!isNotifSupported()) return false;
  if (Notification.permission === "denied") {
    // 브라우저 차원에서 거부 — 사용자가 직접 해제해야 함
    localStorage.setItem(PREF_KEY, "false");
    return false;
  }
  if (Notification.permission === "default") {
    const res = await Notification.requestPermission();
    if (res !== "granted") {
      localStorage.setItem(PREF_KEY, "false");
      return false;
    }
  }
  localStorage.setItem(PREF_KEY, "true");
  return true;
}

export function disableNotifications() {
  localStorage.setItem(PREF_KEY, "false");
}

function readSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed = JSON.parse(raw ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeSeen(ids: Set<string>) {
  try {
    // 너무 길어지지 않도록 최근 500개로 잘라냄
    const arr = Array.from(ids).slice(-500);
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
  } catch {
    /* quota exceeded → ignore */
  }
}

export interface NotifPayload {
  id: string;
  title: string;
  body: string;
  url?: string;
}

/**
 * 새로 매칭된 공간들 알림 발사 (이미 seen 된 id 는 skip).
 * 한 번에 4개 이상이면 통합 알림 1개로 묶음.
 */
export function notifyNewMatches(payloads: NotifPayload[]): NotifPayload[] {
  if (!isNotifEnabled()) return [];

  const seen = readSeen();
  const fresh = payloads.filter((p) => p.id && !seen.has(p.id));
  if (fresh.length === 0) return [];

  if (fresh.length >= 4) {
    new Notification("잇다 — 새로 매칭된 공간이 있어요", {
      body: `${fresh
        .slice(0, 3)
        .map((p) => p.title)
        .join(", ")} 외 ${fresh.length - 3}곳`,
      icon: "/itda-logo.png",
      tag: "itda-batch",
    });
  } else {
    fresh.forEach((p) => {
      const n = new Notification(`잇다 — ${p.title}`, {
        body: p.body,
        icon: "/itda-logo.png",
        tag: `itda-${p.id}`,
      });
      if (p.url) {
        n.onclick = () => {
          window.focus();
          window.location.href = p.url!;
          n.close();
        };
      }
    });
  }

  fresh.forEach((p) => seen.add(p.id));
  writeSeen(seen);
  return fresh;
}
