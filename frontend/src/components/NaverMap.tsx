import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

const SCRIPT_ID = "naver-maps-sdk";
const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_ZOOM = 11;
const FOCUS_ZOOM = 15;
const ANIM = { duration: 600, easing: "easeOutCubic" };

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.naver?.maps) {
      resolve();
      return;
    }

    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      reject(new Error("VITE_NAVER_MAP_CLIENT_ID 환경변수가 없습니다"));
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("SDK load error")), { once: true });
      return;
    }

    // 2024 NCP 개편 후 신규 키는 ncpKeyId, 기존 키는 ncpClientId
    const paramName = import.meta.env.VITE_NAVER_MAP_KEY_PARAM ?? "ncpKeyId";
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "text/javascript";
    // submodules=geocoder: 좌표가 없는 시설에 대한 지오코딩 폴백 지원
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${paramName}=${clientId}&submodules=geocoder`;
    console.debug("[NaverMap] SDK URL:", script.src);

    script.onload = () => resolve();
    script.onerror = (e) => {
      console.error("[NaverMap] SDK 로드 실패:", e);
      document.getElementById(SCRIPT_ID)?.remove();
      reject(new Error("SDK 로드 실패"));
    };

    document.head.appendChild(script);
  });
}

interface MarkerFacility {
  SVCID?: string;
  SVCNM: string;
  PLACENM?: string;
  AREANM?: string;
  PAYATNM: string;
  X?: string;
  Y?: string;
}

interface NaverMapProps {
  facilities: MarkerFacility[];
  highlightedId: string | null;
  onMarkerClick: (id: string) => void;
}

export function NaverMap({ facilities, highlightedId, onMarkerClick }: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<
    { marker: any; id: string; isFree: boolean; facility: MarkerFacility }[]
  >([]);
  const geocodeCacheRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());
  const [sdkReady, setSdkReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // SDK 로드 (마운트 1회)
  useEffect(() => {
    let cancelled = false;
    if (window.naver?.maps) {
      setSdkReady(true);
      return;
    }
    loadSdk()
      .then(() => {
        if (!cancelled) setSdkReady(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 지도 초기화 (sdkReady 시 1회)
  useEffect(() => {
    if (!sdkReady || !containerRef.current || mapRef.current) return;

    const init = () => {
      if (!containerRef.current) return;
      mapRef.current = new window.naver.maps.Map(containerRef.current, {
        center: new window.naver.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng),
        zoom: DEFAULT_ZOOM,
        mapTypeControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
          style: window.naver.maps.ZoomControlStyle.SMALL,
        },
      });
      window.naver.maps.Event.trigger(mapRef.current, "resize");
    };

    requestAnimationFrame(init);
  }, [sdkReady]);

  // 마커 업데이트 (facilities 변경 시)
  useEffect(() => {
    if (!sdkReady || !mapRef.current) return;

    markersRef.current.forEach(({ marker }) => marker.setMap(null));
    markersRef.current = [];

    facilities.forEach((f) => {
      if (!f.X || !f.Y) return;
      const lat = parseFloat(f.Y);
      const lng = parseFloat(f.X);
      if (isNaN(lat) || isNaN(lng)) return;

      const isFree = f.PAYATNM === "무료";
      const id = f.SVCID ?? f.SVCNM;

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(lat, lng),
        map: mapRef.current,
        icon: markerIcon(isFree, false),
      });

      window.naver.maps.Event.addListener(marker, "click", () => onMarkerClick(id));
      markersRef.current.push({ marker, id, isFree, facility: f });
    });
  }, [sdkReady, facilities, onMarkerClick]);

  // 하이라이트 변경 → 마커 강조 + 부드러운 카메라 이동
  useEffect(() => {
    if (!sdkReady || !mapRef.current) return;

    // 1) 마커 아이콘 갱신
    markersRef.current.forEach(({ marker, id, isFree }) => {
      marker.setIcon(markerIcon(isFree, id === highlightedId));
    });

    const map = mapRef.current;
    const naver = window.naver;

    const moveTo = (lat: number, lng: number, zoom: number) => {
      const latlng = new naver.maps.LatLng(lat, lng);
      if (typeof map.morph === "function") {
        map.morph(latlng, zoom, ANIM);
      } else {
        map.panTo(latlng, ANIM);
        map.setZoom(zoom, true);
      }
    };

    // 2) 해제 → 서울 전체 보기로 복귀
    if (!highlightedId) {
      moveTo(SEOUL_CENTER.lat, SEOUL_CENTER.lng, DEFAULT_ZOOM);
      return;
    }

    // 3) 하이라이트된 시설 찾기
    const facility = facilities.find(
      (f) => (f.SVCID ?? f.SVCNM) === highlightedId
    );
    if (!facility) return;

    // 3-1) 좌표가 있으면 즉시 이동
    if (facility.X && facility.Y) {
      const lat = parseFloat(facility.Y);
      const lng = parseFloat(facility.X);
      if (!isNaN(lat) && !isNaN(lng)) {
        moveTo(lat, lng, FOCUS_ZOOM);
        return;
      }
    }

    // 3-2) 좌표가 없으면 지오코딩 (캐시 → API)
    const query = facility.PLACENM || facility.AREANM || facility.SVCNM;
    if (!query) return;

    const cached = geocodeCacheRef.current.get(query);
    if (cached) {
      moveTo(cached.lat, cached.lng, FOCUS_ZOOM);
      return;
    }

    if (!naver?.maps?.Service?.geocode) {
      console.warn("[NaverMap] geocoder 서브모듈이 로드되지 않음");
      return;
    }

    const requestedId = highlightedId;
    naver.maps.Service.geocode({ query }, (status: any, response: any) => {
      if (status !== naver.maps.Service.Status.OK) return;
      const item = response.v2?.addresses?.[0];
      if (!item) return;
      const lat = parseFloat(item.y);
      const lng = parseFloat(item.x);
      if (isNaN(lat) || isNaN(lng)) return;
      geocodeCacheRef.current.set(query, { lat, lng });
      // race-guard: 아직 같은 카드에 hover 중일 때만 이동
      if (requestedId === highlightedId) {
        moveTo(lat, lng, FOCUS_ZOOM);
      }
    });
  }, [sdkReady, highlightedId, facilities]);

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-100 text-sm text-slate-500">
        <span>지도를 불러오지 못했습니다.</span>
        <span className="text-xs text-slate-400">{loadError}</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {!sdkReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-sm text-slate-400">
          지도 로딩 중…
        </div>
      )}
    </div>
  );
}

function markerIcon(isFree: boolean, highlighted: boolean) {
  const color = isFree ? "#059669" : "#1e3a5f";
  const size = highlighted ? 22 : 14;
  const offset = size / 2;
  const border = highlighted ? "3px" : "2.5px";
  const shadow = highlighted
    ? "0 4px 12px rgba(0,0,0,.45)"
    : "0 1px 4px rgba(0,0,0,.35)";
  return {
    content: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border} solid white;box-shadow:${shadow};cursor:pointer;transition:all .2s ease"></div>`,
    anchor: new window.naver.maps.Point(offset, offset),
  };
}
