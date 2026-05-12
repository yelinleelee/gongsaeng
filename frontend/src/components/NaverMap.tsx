import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

const SCRIPT_ID = "naver-maps-sdk";

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우 즉시 resolve
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

    // 2024 NCP 개편 후 신규 키는 ncpKeyId, 기존 키는 ncpClientId 사용
    // 환경변수 VITE_NAVER_MAP_KEY_PARAM 으로 전환 가능 (기본값: ncpKeyId)
    const paramName = import.meta.env.VITE_NAVER_MAP_KEY_PARAM ?? "ncpKeyId";
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "text/javascript";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${paramName}=${clientId}`;
    console.debug("[NaverMap] SDK URL:", script.src);

    console.debug("[NaverMap] SDK 로드 시작 →", script.src);

    script.onload = () => {
      console.debug("[NaverMap] SDK 로드 완료, window.naver:", !!window.naver?.maps);
      resolve();
    };
    script.onerror = (e) => {
      console.error("[NaverMap] SDK 로드 실패 (인증 오류 또는 네트워크 문제):", e);
      // 실패한 태그 제거 → 재시도 가능하게
      document.getElementById(SCRIPT_ID)?.remove();
      reject(new Error("SDK 로드 실패"));
    };

    document.head.appendChild(script);
  });
}

interface MarkerFacility {
  SVCID?: string;
  SVCNM: string;
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
  const markersRef = useRef<{ marker: any; id: string; isFree: boolean }[]>([]);
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
      .then(() => { if (!cancelled) setSdkReady(true); })
      .catch((e: Error) => { if (!cancelled) setLoadError(e.message); });
    return () => { cancelled = true; };
  }, []);

  // 지도 초기화 (sdkReady 시 1회)
  useEffect(() => {
    if (!sdkReady || !containerRef.current || mapRef.current) return;

    // 컨테이너 크기가 0이면 requestAnimationFrame 후 재시도
    const init = () => {
      if (!containerRef.current) return;
      const { offsetWidth, offsetHeight } = containerRef.current;
      console.debug("[NaverMap] 컨테이너 크기:", offsetWidth, "x", offsetHeight);

      mapRef.current = new window.naver.maps.Map(containerRef.current, {
        center: new window.naver.maps.LatLng(37.5665, 126.978),
        zoom: 11,
        mapTypeControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
          style: window.naver.maps.ZoomControlStyle.SMALL,
        },
      });
      // 컨테이너 크기를 지도에 강제 반영
      window.naver.maps.Event.trigger(mapRef.current, "resize");
      console.debug("[NaverMap] 지도 초기화 완료");
    };

    requestAnimationFrame(init);
  }, [sdkReady]);

  // 마커 업데이트 (facilities 또는 sdkReady 변경 시)
  useEffect(() => {
    if (!sdkReady || !mapRef.current) return;

    markersRef.current.forEach(({ marker }) => marker.setMap(null));
    markersRef.current = [];

    let count = 0;
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
      markersRef.current.push({ marker, id, isFree });
      count++;
    });

    console.debug("[NaverMap] 마커 생성:", count, "개");
  }, [sdkReady, facilities, onMarkerClick]);

  // 하이라이트 마커 강조
  useEffect(() => {
    if (!sdkReady) return;
    markersRef.current.forEach(({ marker, id, isFree }) => {
      marker.setIcon(markerIcon(isFree, id === highlightedId));
    });
  }, [highlightedId, sdkReady]);

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
  const size = highlighted ? 20 : 14;
  const offset = size / 2;
  const border = highlighted ? "3px" : "2.5px";
  const shadow = highlighted ? "0 2px 8px rgba(0,0,0,.4)" : "0 1px 4px rgba(0,0,0,.35)";
  return {
    content: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border} solid white;box-shadow:${shadow};cursor:pointer"></div>`,
    anchor: new window.naver.maps.Point(offset, offset),
  };
}
