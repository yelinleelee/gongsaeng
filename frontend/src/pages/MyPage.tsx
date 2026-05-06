import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export function MyPage() {
  const { user, becomeHost } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function onBecomeHost() {
    setPending(true);
    setError(null);
    try {
      await becomeHost();
    } catch (err) {
      setError(err instanceof Error ? err.message : "호스트 전환 실패");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">My Page</h1>

      <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <span className="text-slate-500">Email</span>
        <span>{user.email}</span>
        <span className="text-slate-500">Name</span>
        <span>{user.name}</span>
        <span className="text-slate-500">Role</span>
        <span className="font-medium">{user.role}</span>
      </div>

      {user.role === "guest" && (
        <div className="rounded-md border border-slate-200 p-4">
          <p className="text-sm text-slate-600">호스트로 전환하면 숙소를 등록할 수 있어요.</p>
          <button
            type="button"
            onClick={onBecomeHost}
            disabled={pending}
            className="mt-3 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "처리 중…" : "Become a host"}
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </section>
  );
}
