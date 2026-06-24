// 최근 본 공간을 localStorage에 저장 (백엔드 불필요)
// 사용자가 디바이스 바뀌면 초기화됨 — 의도된 동작

const STORAGE_KEY = "itda_recently_viewed";
const MAX_ITEMS = 8;

export interface RecentSpace {
  svc_id: string;
  svc_nm: string;
  place_nm?: string;
  area_nm?: string;
  pay_at_nm?: string;
  img_url?: string;
  min_class_nm?: string;
  v_max?: string;
  viewed_at: number; // ms timestamp
}

function read(): RecentSpace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentSpace[];
  } catch {
    return [];
  }
}

function write(items: RecentSpace[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* localStorage quota or disabled — ignore */
  }
}

export function trackRecentSpace(item: Omit<RecentSpace, "viewed_at">) {
  if (!item.svc_id) return;
  const existing = read().filter((r) => r.svc_id !== item.svc_id);
  const next: RecentSpace[] = [
    { ...item, viewed_at: Date.now() },
    ...existing,
  ].slice(0, MAX_ITEMS);
  write(next);
}

export function getRecentSpaces(): RecentSpace[] {
  return read().sort((a, b) => b.viewed_at - a.viewed_at);
}

export function clearRecentSpaces() {
  write([]);
}
