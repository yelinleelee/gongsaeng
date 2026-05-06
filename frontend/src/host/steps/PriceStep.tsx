import { useNavigate } from "react-router-dom";
import { useRegister } from "../RegisterContext";
import { StepNav } from "../StepNav";
import { useAuth } from "../../auth/AuthContext";

export function PriceStep() {
  const navigate = useNavigate();
  const { data, setField, submit, submitError, submitting } = useRegister();
  const { user, becomeHost } = useAuth();
  const ready = Number(data.price) > 0;

  async function onSubmit() {
    if (user && user.role !== "host") {
      try {
        await becomeHost();
      } catch {
        /* fall through — backend will reject if needed */
      }
    }
    const res = await submit();
    if (res.ok) navigate("../success", { replace: true });
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">가격</h1>
        <p className="mt-1 text-sm text-slate-500">1박 기준 가격을 적어주세요 (KRW).</p>
      </header>

      <label className="block space-y-1">
        <span className="text-sm font-medium">1박 가격</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={data.price}
          onChange={(e) => setField("price", e.target.value)}
          placeholder="120000"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-lg outline-none focus:border-slate-400"
        />
      </label>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <StepNav
        back="../photos"
        nextLabel={submitting ? "등록 중…" : "등록하기"}
        disabled={!ready || submitting}
        onNext={onSubmit}
      />
    </section>
  );
}
