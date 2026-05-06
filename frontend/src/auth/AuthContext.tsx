import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, tokenStore } from "../lib/api";
import { signInWithGoogle, signOutFromFirebase } from "../lib/firebase";

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: "guest" | "host";
  avatar: string;
  is_verified: boolean;
};

type AuthState = {
  ready: boolean;
  user: CurrentUser | null;
  loginWithGoogle: () => Promise<void>;
  becomeHost: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

type LoginResponse = { token: string; user: CurrentUser };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setReady(true);
      return;
    }
    api<CurrentUser>("/auth/me")
      .then(setUser)
      .catch(() => {
        tokenStore.clear();
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      user,
      async loginWithGoogle() {
        const { idToken } = await signInWithGoogle();
        const res = await api<LoginResponse>("/auth/google", {
          method: "POST",
          body: JSON.stringify({ id_token: idToken }),
        });
        tokenStore.set(res.token);
        setUser(res.user);
      },
      async becomeHost() {
        const updated = await api<CurrentUser>("/auth/become-host", { method: "POST" });
        setUser(updated);
      },
      async logout() {
        try {
          await signOutFromFirebase();
        } catch {
          /* ignore */
        }
        tokenStore.clear();
        setUser(null);
      },
    }),
    [ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
