import { useEffect, useRef, useState } from "react";
import { ImageIcon, MapPin, RotateCcw, Sparkles } from "lucide-react";
import { fetchAllSpaces } from "../data/seoul";

interface Choice {
  id: string;
  label: string;
}

interface Question {
  id: keyof Answers;
  prompt: string;
  choices: Choice[];
}

interface Answers {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
}

interface Recommendation {
  name: string;
  location: string;
  reason: string;
  category: string;
  image?: string;
}

interface SeoulFacility {
  SVCNM?: string;
  PLACENM?: string;
  IMGURL?: string;
}

const UNSPLASH_FALLBACK = "https://source.unsplash.com/400x200/?seoul,space,gallery";

function normalize(s: string): string {
  return s.replace(/[\s·\-_,()\[\]/]/g, "").toLowerCase();
}

function matchImage(rec: Recommendation, facilities: SeoulFacility[]): string {
  const targetName = normalize(rec.name);
  const targetLoc = normalize(rec.location);
  if (!targetName) return UNSPLASH_FALLBACK;

  for (const f of facilities) {
    if (!f.IMGURL) continue;
    const svcnm = normalize(f.SVCNM ?? "");
    const placenm = normalize(f.PLACENM ?? "");
    if (!svcnm && !placenm) continue;

    const nameHit =
      (svcnm && (svcnm.includes(targetName) || targetName.includes(svcnm))) ||
      (placenm && (placenm.includes(targetName) || targetName.includes(placenm)));
    const locHit =
      !targetLoc ||
      (placenm && (placenm.includes(targetLoc) || targetLoc.includes(placenm)));

    if (nameHit && locHit) return f.IMGURL;
  }

  for (const f of facilities) {
    if (!f.IMGURL) continue;
    const placenm = normalize(f.PLACENM ?? "");
    if (placenm && (placenm.includes(targetName) || targetName.includes(placenm))) {
      return f.IMGURL;
    }
  }

  return UNSPLASH_FALLBACK;
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "당신은 누구인가요?",
    choices: [
      { id: "시각예술가", label: "시각예술가" },
      { id: "공연예술가", label: "공연예술가" },
      { id: "사진·영상 작가", label: "사진·영상 작가" },
      { id: "기획자·큐레이터", label: "기획자·큐레이터" },
      { id: "기타 창작자", label: "기타 창작자" },
    ],
  },
  {
    id: "q2",
    prompt: "어떤 목적으로 공간이 필요한가요?",
    choices: [
      { id: "전시·갤러리", label: "전시·갤러리" },
      { id: "팝업스토어", label: "팝업스토어" },
      { id: "공연·퍼포먼스", label: "공연·퍼포먼스" },
      { id: "촬영·녹화", label: "촬영·녹화" },
      { id: "워크숍·강의", label: "워크숍·강의" },
      { id: "회의·기획", label: "회의·기획" },
    ],
  },
  {
    id: "q3",
    prompt: "얼마나 많은 사람이 오나요?",
    choices: [
      { id: "나 혼자", label: "나 혼자" },
      { id: "소규모 (2~10명)", label: "소규모 (2~10명)" },
      { id: "중규모 (10~50명)", label: "중규모 (10~50명)" },
      { id: "대규모 (50명 이상)", label: "대규모 (50명 이상)" },
    ],
  },
  {
    id: "q4",
    prompt: "예산이 있나요?",
    choices: [
      { id: "무료만", label: "무료만" },
      { id: "유료도 괜찮아요", label: "유료도 괜찮아요" },
    ],
  },
  {
    id: "q5",
    prompt: "선호하는 지역이 있나요?",
    choices: [
      { id: "서울 전체", label: "서울 전체" },
      { id: "종로·중구", label: "종로·중구" },
      { id: "마포·홍대", label: "마포·홍대" },
      { id: "강남·서초", label: "강남·서초" },
      { id: "기타", label: "기타" },
    ],
  },
];

const EMPTY_ANSWERS: Answers = { q1: "", q2: "", q3: "", q4: "", q5: "" };

export function NeighborhoodPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const facilitiesRef = useRef<SeoulFacility[]>([]);

  useEffect(() => {
    fetchAllSpaces()
      .then((rows) => {
        facilitiesRef.current = rows as SeoulFacility[];
      })
      .catch(() => {
        facilitiesRef.current = [];
      });
  }, []);

  const isResult = step >= QUESTIONS.length;
  const progress = isResult ? 100 : (step / QUESTIONS.length) * 100;

  function selectChoice(choiceId: string) {
    const current = QUESTIONS[step];
    const next = { ...answers, [current.id]: choiceId };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      void runRecommendation(next);
    }
  }

  async function runRecommendation(finalAnswers: Answers) {
    setStep(QUESTIONS.length);
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_ANTHROPIC_API_KEY 환경변수가 설정되어 있지 않습니다.");
      }

      const userPrompt = `당신은 서울시 공공공간 추천 전문가입니다.

사용자 정보:
- 유형: ${finalAnswers.q1}
- 목적: ${finalAnswers.q2}
- 인원: ${finalAnswers.q3}
- 예산: ${finalAnswers.q4}
- 지역: ${finalAnswers.q5}

위 조건에 맞는 서울시 공공공간을 3개 추천하고,
각 공간마다 추천 이유를 한 줄로 설명해줘.
JSON 형식으로만 응답해줘 (다른 설명 없이):
{"recommendations": [{"name": "공간명", "location": "위치", "reason": "추천이유", "category": "카테고리"}]}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Claude API ${response.status}: ${text}`);
      }

      const data = await response.json();
      const text: string = data?.content?.[0]?.text ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("응답에서 JSON을 찾지 못했습니다.");
      const parsed = JSON.parse(match[0]) as { recommendations: Recommendation[] };
      if (!parsed.recommendations?.length) throw new Error("추천 결과가 비어있습니다.");
      const withImages = parsed.recommendations.map((r) => ({
        ...r,
        image: matchImage(r, facilitiesRef.current),
      }));
      setResults(withImages);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(0);
    setAnswers(EMPTY_ANSWERS);
    setResults(null);
    setError(null);
    setLoading(false);
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="fixed inset-x-0 top-0 z-30 h-1 bg-slate-100">
        <div
          className="h-full bg-slate-900 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 pt-24 pb-16">
        {!isResult ? (
          <QuestionView
            key={step}
            index={step}
            total={QUESTIONS.length}
            question={QUESTIONS[step]}
            selected={answers[QUESTIONS[step].id]}
            onSelect={selectChoice}
            onBack={step > 0 ? () => setStep(step - 1) : undefined}
          />
        ) : (
          <ResultView
            loading={loading}
            error={error}
            results={results}
            onReset={reset}
            onRetry={() => runRecommendation(answers)}
          />
        )}
      </div>
    </div>
  );
}

interface QuestionViewProps {
  index: number;
  total: number;
  question: Question;
  selected: string;
  onSelect: (id: string) => void;
  onBack?: () => void;
}

function QuestionView({ index, total, question, selected, onSelect, onBack }: QuestionViewProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`flex flex-1 flex-col transition-all duration-500 ease-out ${
        mounted ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span className="h-px flex-1 bg-slate-200" />
        <span>{String(total).padStart(2, "0")}</span>
      </div>

      <h1 className="mt-6 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
        {question.prompt}
      </h1>
      <p className="mt-2 text-sm text-slate-500">선택하면 다음 질문으로 넘어가요.</p>

      <div className="mt-10 grid gap-3">
        {question.choices.map((c) => {
          const active = c.id === selected;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={`group flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900 hover:shadow-md ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-800"
              }`}
            >
              <span className="font-medium">{c.label}</span>
              <span
                className={`text-sm transition-transform group-hover:translate-x-1 ${
                  active ? "text-white" : "text-slate-400"
                }`}
              >
                →
              </span>
            </button>
          );
        })}
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-8 self-start text-sm font-medium text-slate-400 hover:text-slate-700"
        >
          ← 이전 질문
        </button>
      )}
    </div>
  );
}

interface ResultViewProps {
  loading: boolean;
  error: string | null;
  results: Recommendation[] | null;
  onReset: () => void;
  onRetry: () => void;
}

function ResultView({ loading, error, results, onReset, onRetry }: ResultViewProps) {
  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <Sparkles className="size-8 animate-pulse text-slate-900" />
        <p className="text-lg font-semibold text-slate-900">당신에게 맞는 공간을 찾는 중…</p>
        <p className="text-sm text-slate-500">잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg font-semibold text-slate-900">추천을 불러오지 못했어요.</p>
        <p className="max-w-md break-words text-sm text-slate-500">{error}</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            다시 시도
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-900"
          >
            처음부터
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
        <Sparkles className="size-3.5" />
        AI 추천 완료
      </div>
      <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
        이런 공간은 어때요?
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        당신의 답변을 바탕으로 3개의 공간을 추천해 드려요.
      </p>

      <div className="mt-8 grid gap-5">
        {results?.map((r, i) => (
          <article
            key={`${r.name}-${i}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
          >
            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
              <CardImage src={r.image} />
              <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-900 backdrop-blur">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {r.category}
              </div>
              <h2 className="mt-3 text-xl font-bold text-slate-900">{r.name}</h2>
              <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="size-3.5" />
                <span>{r.location}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">{r.reason}</p>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-10 inline-flex items-center justify-center gap-2 self-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-900"
      >
        <RotateCcw className="size-4" />
        다시 추천받기
      </button>
    </div>
  );
}

function CardImage({ src }: { src?: string }) {
  const initial = src && src !== UNSPLASH_FALLBACK ? src : UNSPLASH_FALLBACK;
  const [url, setUrl] = useState(initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setUrl(initial);
    setFailed(false);
  }, [initial]);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <ImageIcon className="size-10 text-slate-300" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => {
        if (url !== UNSPLASH_FALLBACK) {
          setUrl(UNSPLASH_FALLBACK);
        } else {
          setFailed(true);
        }
      }}
      className="h-full w-full object-cover"
    />
  );
}
