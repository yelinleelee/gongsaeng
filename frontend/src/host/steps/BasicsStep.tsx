import { Minus, Plus } from "lucide-react";
import { useRegister, type RegisterFormData } from "../RegisterContext";
import { StepNav } from "../StepNav";

const FIELDS: { key: keyof RegisterFormData; label: string; min: number }[] = [
  { key: "guests", label: "최대 인원", min: 1 },
  { key: "bedrooms", label: "침실", min: 0 },
  { key: "beds", label: "침대", min: 1 },
  { key: "bathrooms", label: "욕실", min: 0 },
];

export function BasicsStep() {
  const { data, setField } = useRegister();

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">기본 정보</h1>
        <p className="mt-1 text-sm text-slate-500">숙소 규모를 알려주세요.</p>
      </header>

      <div className="space-y-3">
        {FIELDS.map(({ key, label, min }) => {
          const value = data[key] as number;
          return (
            <div
              key={String(key)}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
            >
              <span className="text-sm font-medium">{label}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setField(key, Math.max(min, value - 1) as never)}
                  className="rounded-full border border-slate-200 p-1 hover:bg-slate-50"
                  aria-label="decrement"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center text-sm">{value}</span>
                <button
                  type="button"
                  onClick={() => setField(key, ((value as number) + 1) as never)}
                  className="rounded-full border border-slate-200 p-1 hover:bg-slate-50"
                  aria-label="increment"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <StepNav back="../concept" next="../description" />
    </section>
  );
}
