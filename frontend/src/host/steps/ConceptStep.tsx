import { CONCEPT_OPTIONS, useRegister } from "../RegisterContext";
import { StepNav } from "../StepNav";

export function ConceptStep() {
  const { data, setField } = useRegister();

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">어떤 컨셉인가요?</h1>
        <p className="mt-1 text-sm text-slate-500">대표 키워드 하나를 골라주세요.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {CONCEPT_OPTIONS.map((c) => {
          const active = data.concept === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setField("concept", active ? null : c)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <StepNav back="../type" next="../basics" />
    </section>
  );
}
