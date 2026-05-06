import { PROPERTY_TYPE_OPTIONS, useRegister } from "../RegisterContext";
import { StepNav } from "../StepNav";

export function TypeStep() {
  const { data, setField } = useRegister();

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">어떤 숙소를 등록하시나요?</h1>
        <p className="mt-1 text-sm text-slate-500">유형을 하나 선택해주세요.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PROPERTY_TYPE_OPTIONS.map((opt) => {
          const active = data.type === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setField("type", opt.value)}
              className={`rounded-lg border p-4 text-left text-sm transition ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <StepNav next="../concept" disabled={!data.type} />
    </section>
  );
}
