import { useRegister } from "../RegisterContext";
import { StepNav } from "../StepNav";

const REGIONS = ["서울", "경기", "강원", "충청", "전라", "경상", "제주", "기타"];

export function LocationStep() {
  const { data, setField } = useRegister();
  const ready = !!data.city && data.address.trim().length > 0;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">위치</h1>
        <p className="mt-1 text-sm text-slate-500">지역과 주소를 입력해주세요.</p>
      </header>

      <div className="space-y-2">
        <span className="text-sm font-medium">지역</span>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => {
            const active = data.city === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setField("city", r)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">상세 주소</span>
        <input
          value={data.address}
          onChange={(e) => setField("address", e.target.value)}
          placeholder="OO시 OO구 OO동 ..."
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
      </label>

      <StepNav back="../description" next="../photos" disabled={!ready} />
    </section>
  );
}
