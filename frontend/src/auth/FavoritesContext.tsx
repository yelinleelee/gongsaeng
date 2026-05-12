import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "./AuthContext";

// 백엔드 model.Favorite 와 형식 일치 (snake_case)
export interface Favorite {
  ID: number;
  user_id: number;
  svc_id: string;
  svc_nm: string;
  place_nm: string;
  area_nm: string;
  pay_at_nm: string;
  img_url: string;
  svc_url: string;
  min_class_nm: string;
  v_max: string;
  x: string;
  y: string;
}

// 페이지에서 넘기는 facility (Seoul API 또는 manual) → favorite 페이로드
export interface FavoriteInput {
  svc_id: string;
  svc_nm?: string;
  place_nm?: string;
  area_nm?: string;
  pay_at_nm?: string;
  img_url?: string;
  svc_url?: string;
  min_class_nm?: string;
  v_max?: string;
  x?: string;
  y?: string;
}

interface FavoritesState {
  favorites: Favorite[];
  ids: Set<string>; // 빠른 isLiked 조회용
  ready: boolean;
  isFavorite(svcId: string): boolean;
  toggle(input: FavoriteInput): Promise<void>;
  refresh(): Promise<void>;
}

const FavoritesContext = createContext<FavoritesState | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setReady(true);
      return;
    }
    try {
      const list = await api<Favorite[]>("/favorites");
      setFavorites(list ?? []);
    } catch {
      setFavorites([]);
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => {
    if (!authReady) return;
    setReady(false);
    refresh();
  }, [authReady, user, refresh]);

  const ids = useMemo(() => new Set(favorites.map((f) => f.svc_id)), [favorites]);

  const isFavorite = useCallback((svcId: string) => ids.has(svcId), [ids]);

  const toggle = useCallback(
    async (input: FavoriteInput) => {
      if (!user) {
        // 비로그인 상태는 호출자에서 처리 (예: 로그인 페이지 이동)
        throw new ApiError(401, "로그인이 필요합니다");
      }
      const already = ids.has(input.svc_id);
      if (already) {
        // optimistic remove
        setFavorites((prev) => prev.filter((f) => f.svc_id !== input.svc_id));
        try {
          await api(`/favorites/${encodeURIComponent(input.svc_id)}`, {
            method: "DELETE",
          });
        } catch (e) {
          await refresh(); // 실패 시 상태 복구
          throw e;
        }
      } else {
        // optimistic add — 서버 응답으로 교체될 임시 favorite
        const temp: Favorite = {
          ID: -Math.floor(Math.random() * 1e9),
          user_id: user.id,
          svc_id: input.svc_id,
          svc_nm: input.svc_nm ?? "",
          place_nm: input.place_nm ?? "",
          area_nm: input.area_nm ?? "",
          pay_at_nm: input.pay_at_nm ?? "",
          img_url: input.img_url ?? "",
          svc_url: input.svc_url ?? "",
          min_class_nm: input.min_class_nm ?? "",
          v_max: input.v_max ?? "",
          x: input.x ?? "",
          y: input.y ?? "",
        };
        setFavorites((prev) => [temp, ...prev]);
        try {
          const created = await api<Favorite>("/favorites", {
            method: "POST",
            body: JSON.stringify(input),
          });
          setFavorites((prev) =>
            prev.map((f) => (f.svc_id === created.svc_id ? created : f)),
          );
        } catch (e) {
          await refresh();
          throw e;
        }
      }
    },
    [user, ids, refresh],
  );

  const value = useMemo<FavoritesState>(
    () => ({ favorites, ids, ready, isFavorite, toggle, refresh }),
    [favorites, ids, ready, isFavorite, toggle, refresh],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
