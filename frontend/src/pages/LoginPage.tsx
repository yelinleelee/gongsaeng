import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../lib/api";

type LocationState = { from?: { pathname?: string } };

export function LoginPage() {
  const { user, ready, loginWithGoogle } = useAuth();
  const location = useLocation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return <div className="p-6 text-sm text-slate-500">Loading…</div>;

  if (user) {
    const to = (location.state as LocationState | null)?.from?.pathname ?? "/";
    return <Navigate to={to} replace />;
  }

  async function handleLogin() {
    setPending(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "로그인 실패";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
        <p className="mt-2 text-sm text-slate-500">Google 계정으로 계속하기</p>
      </div>

      <button
        type="button"
        onClick={handleLogin}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleMark className="size-4" />
        {pending ? "Signing in…" : "Continue with Google"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.58 2.68-3.9 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.46-.81 5.95-2.18l-2.92-2.26c-.81.54-1.84.86-3.03.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.32A8.99 8.99 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.94A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.94 4.04l3.03-2.32Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.86 11.43 0 9 0A8.99 8.99 0 0 0 .94 4.96l3.03 2.32C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
