import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QUESTIONS, getTopMatches } from "../data/neighborhoods";
import type { QuizOption } from "../data/neighborhoods";

const LAYER1_LABELS: Record<string, string> = {
  safeRoute: "안심 귀가길",
  hospital: "병원 안심",
  transit: "대중교통",
};
const LAYER2_LABELS: Record<string, string> = {
  dogWalk: "강아지 산책",
  cafe: "스테디 카페",
  indie: "인디 바이브",
  quiet: "머물 포인트",
  nature: "계절 감성",
  community: "인간적 온기",
};

export function NeighborhoodPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"quiz" | "result">("quiz");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizOption>>({});
  const [selected, setSelected] = useState<QuizOption | null>(null);

  const question = QUESTIONS[currentQ];
  const progress = (currentQ / QUESTIONS.length) * 100;
  const isLast = currentQ === QUESTIONS.length - 1;

  function handleNext() {
    if (!selected) return;
    const newAnswers = { ...answers, [question.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);
    if (isLast) {
      setStep("result");
    } else {
      setCurrentQ((q) => q + 1);
    }
  }

  function handleRestart() {
    setStep("quiz");
    setCurrentQ(0);
    setAnswers({});
    setSelected(null);
  }

  if (step === "result") {
    const results = getTopMatches(answers);
    const top = results[0];

    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <header className="space-y-1 text-center">
          <p className="text-sm font-medium text-slate-500">동네 매칭 완료!</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            회원님께{" "}
            <span className="text-emerald-600">{top.match}%</span> 맞는 동네
          </h1>
          <p className="text-sm text-slate-500">6가지 질문을 바탕으로 분석했어요</p>
        </header>

        <ul className="space-y-4">
          {results.map(({ neighborhood: n, match }, i) => (
            <li
              key={n.id}
              className={`rounded-xl border p-5 ${
                i === 0 ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
              }`}
            >
              {i === 0 && (
                <p className="mb-2 text-xs font-semibold text-emerald-700">최고 매칭</p>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">{n.region}</p>
                  <h2 className="text-lg font-semibold text-slate-900">{n.name}</h2>
                  <p className="text-sm text-slate-600">{n.description}</p>
                </div>
                <div className="shrink-0 text-center">
                  <p className="text-3xl font-bold text-slate-900">{match}</p>
                  <p className="text-xs text-slate-500">%</p>
                </div>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${match}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {n.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-700">포기불가 지수</p>
                  {Object.entries(LAYER1_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-slate-500">{label}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-slate-200 h-1">
                        <div
                          className="h-full rounded-full bg-slate-700"
                          style={{ width: `${n.scores[key as keyof typeof n.scores]}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-slate-600">
                        {n.scores[key as keyof typeof n.scores]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-700">골목 바이브 지수</p>
                  {Object.entries(LAYER2_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-slate-500">{label}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-slate-200 h-1">
                        <div
                          className="h-full rounded-full bg-slate-700"
                          style={{ width: `${n.scores[key as keyof typeof n.scores]}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-slate-600">
                        {n.scores[key as keyof typeof n.scores]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">{n.priceRange}</span>
                <button
                  type="button"
                  onClick={() => navigate(`/stays?city=${encodeURIComponent(n.region)}`)}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  이 동네 숙소 보기 →
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="text-center">
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            다시 해보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 text-right">
            {currentQ + 1} / {QUESTIONS.length}
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            question.layer === 1
              ? "bg-slate-100 text-slate-700"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {question.layer === 1 ? "🛡" : "✨"} {question.layerLabel}
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-4xl">{question.emoji}</p>
          <h2 className="text-xl font-semibold text-slate-900">{question.text}</h2>
          {question.subText && (
            <p className="text-sm text-slate-500">{question.subText}</p>
          )}
        </div>

        <div className="space-y-2">
          {question.options.map((opt) => {
            const active = selected?.label === opt.label;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setSelected(opt)}
                className={`flex w-full items-center gap-3 rounded-xl border px-5 py-4 text-left transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-sm font-medium">{opt.label}</span>
                {active && <span className="ml-auto text-xs">✓</span>}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => currentQ > 0 && setCurrentQ((q) => q - 1)}
            disabled={currentQ === 0}
            className="rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-0"
          >
            ← 이전
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!selected}
            className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
          >
            {isLast ? "결과 보기" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
