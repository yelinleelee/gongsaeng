import { useRegister } from "../RegisterContext";
import { StepNav } from "../StepNav";

export function DescriptionStep() {
  const { data, setField } = useRegister();
  const ready = data.name.trim().length > 0;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">숙소 소개</h1>
        <p className="mt-1 text-sm text-slate-500">이름과 설명을 적어주세요.</p>
      </header>

      <label className="block space-y-1">
        <span className="text-sm font-medium">숙소 이름</span>
        <input
          value={data.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="예: 한적한 마을의 단독 한옥"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">설명</span>
        <textarea
          value={data.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={6}
          placeholder="공간의 분위기와 추천 활동을 적어주세요."
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
      </label>

      <StepNav back="../basics" next="../location" disabled={!ready} />
    </section>
  );
}
