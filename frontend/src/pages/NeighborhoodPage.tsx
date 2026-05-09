import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ImageIcon, RefreshCw, Sparkles } from "lucide-react";
import { fetchCultureEvents, fetchInstitutionFacilities } from "../data/seoul";
import { manualSpaces } from "../data/manualSpaces";

interface Facility {
  SVCID?: string;
  SVCNM: string;
  PLACENM: string;
  AREANM: string;
  PAYATNM: string;
  IMGURL?: string;
  SVCURL?: string;
  MINCLASSNM?: string;
  V_MAX?: string;
  X?: string;
  Y?: string;
}

interface Option {
  id: string;
  emoji: string;
  label: string;
}

interface Question {
  id: string;
  tag: string;
  emoji: string;
  title: string;
  subtitle?: string;
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    id: "creator",
    tag: "창작자 유형",
    emoji: "🎨",
    title: "당신은 누구인가요?",
    subtitle: "당신의 분야를 알려주세요",
    options: [
      { id: "visual", emoji: "🖼️", label: "시각예술가" },
      { id: "performance", emoji: "🎭", label: "공연예술가" },
      { id: "media", emoji: "📷", label: "사진·영상 작가" },
      { id: "curator", emoji: "🗂️", label: "기획자·큐레이터" },
      { id: "other", emoji: "✨", label: "기타 창작자" },
    ],
  },
  {
    id: "purpose",
    tag: "공간 목적",
    emoji: "🎯",
    title: "어떤 목적으로 공간이 필요한가요?",
    subtitle: "추천 결과에 가장 큰 영향을 줘요",
    options: [
      { id: "exhibition", emoji: "🖼️", label: "전시·갤러리" },
      { id: "popup", emoji: "🛍️", label: "팝업스토어" },
      { id: "performance", emoji: "🎭", label: "공연·퍼포먼스" },
      { id: "shoot", emoji: "🎥", label: "촬영·녹화" },
      { id: "workshop", emoji: "🧑‍🏫", label: "워크숍·강의" },
      { id: "meeting", emoji: "💬", label: "회의·기획" },
    ],
  },
  {
    id: "capacity",
    tag: "예상 인원",
    emoji: "👥",
    title: "얼마나 많은 사람이 오나요?",
    options: [
      { id: "solo", emoji: "🧍", label: "나 혼자" },
      { id: "small", emoji: "👥", label: "소규모 (2~10명)" },
      { id: "medium", emoji: "👨‍👩‍👧‍👦", label: "중규모 (10~50명)" },
      { id: "large", emoji: "🏟️", label: "대규모 (50명 이상)" },
    ],
  },
  {
    id: "budget",
    tag: "예산",
    emoji: "💰",
    title: "예산이 있나요?",
    options: [
      { id: "free", emoji: "🆓", label: "무료만" },
      { id: "paid", emoji: "💸", label: "유료도 괜찮아요" },
    ],
  },
  {
    id: "district",
    tag: "선호 지역",
    emoji: "📍",
    title: "선호하는 지역이 있나요?",
    options: [
      { id: "all", emoji: "🗺️", label: "서울 전체" },
      { id: "jongno", emoji: "🏛️", label: "종로·중구" },
      { id: "mapo", emoji: "🎨", label: "마포·홍대" },
      { id: "gangnam", emoji: "🏙️", label: "강남·서초" },
      { id: "other", emoji: "📌", label: "기타" },
    ],
  },
];

const ALLOWED_INSTITUTION = new Set([
  "강당", "광장", "녹화장소", "공연장", "회의실", "다목적실", "강의실",
]);
const ALLOWED_CULTURE = new Set(["전시/관람", "문화행사"]);

const PURPOSE_TO_CLASS: Record<string, string[]> = {
  exhibition: ["전시/관람"],
  popup: ["전시/관람", "다목적실"],
  performance: ["공연장"],
  shoot: ["녹화장소"],
  workshop: ["강의실", "강당", "다목적실"],
  meeting: ["회의실", "다목적실"],
};

const DISTRICT_GROUPS: Record<string, string[]> = {
  jongno: ["종로구", "중구"],
  mapo: ["마포구"],
  gangnam: ["강남구", "서초구"],
};
const EXPLICIT_DISTRICTS = ["종로구", "중구", "마포구", "강남구", "서초구"];

const CAPACITY_RANGES: Record<string, [number, number]> = {
  solo: [0, 10],
  small: [2, 10],
  medium: [10, 50],
  large: [50, 100000],
};

function scoreFacility(f: Facility, a: Record<string, string>): number | null {
  // Hard filter: 무료만 선택 시 유료 제외
  if (a.budget === "free" && f.PAYATNM !== "무료") return null;

  let score = 0;

  // 목적 매칭 (가중치 높음)
  const purposeClasses = PURPOSE_TO_CLASS[a.purpose] ?? [];
  if (purposeClasses.length > 0) {
    if (purposeClasses.includes(f.MINCLASSNM ?? "")) score += 10;
    else score -= 5;
  }

  // 지역
  if (a.district === "all") {
    score += 1;
  } else if (a.district === "other") {
    if (!EXPLICIT_DISTRICTS.includes(f.AREANM)) score += 5;
  } else {
    const dists = DISTRICT_GROUPS[a.district] ?? [];
    if (dists.includes(f.AREANM)) score += 5;
  }

  // 인원
  const range = CAPACITY_RANGES[a.capacity];
  if (range && f.V_MAX) {
    const max = parseInt(f.V_MAX, 10);
    if (!isNaN(max)) {
      const [low, high] = range;
      if (max >= low && max <= high) score += 5;
      else if (max < low * 0.5 || max > high * 2) score -= 3;
    }
  }

  // 무료 선호 보너스
  if (a.budget === "free" && f.PAYATNM === "무료") score += 2;

  return score;
}

export function NeighborhoodPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"quiz" | "result">("quiz");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  const question = QUESTIONS[currentQ];
  const total = QUESTIONS.length;
  const isLast = currentQ === total - 1;
  const progress = ((currentQ + (pending ? 1 : 0)) / total) * 100;

  useEffect(() => {
    Promise.all([fetchCultureEvents(), fetchInstitutionFacilities()])
      .then(([cultureData, institutionData]) => {
        const cultureRows: Facility[] = (
          cultureData?.ListPublicReservationCulture?.row ?? []
        ).filter((f: Facility) => ALLOWED_CULTURE.has(f.MINCLASSNM ?? ""));

        const institutionRows: Facility[] = (
          institutionData?.ListPublicReservationInstitution?.row ?? []
        ).filter((f: Facility) => ALLOWED_INSTITUTION.has(f.MINCLASSNM ?? ""));

        const seen = new Set<string>();
        const all = [...institutionRows, ...cultureRows, ...manualSpaces].filter((f) => {
          const key = f.SVCID ?? `${f.SVCNM}__${f.PLACENM}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setFacilities(all);
      })
      .catch(() => setFacilities([]));
  }, []);

  const results = useMemo(() => {
    if (step !== "result") return [];
    const scored = facilities
      .map((f) => {
        const s = scoreFacility(f, answers);
        return s === null ? null : { f, score: s };
      })
      .filter((x): x is { f: Facility; score: number } => x !== null);
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map((x) => x.f);
  }, [step, facilities, answers]);

  function selectOption(optionId: string) {
    if (pending) return;
    setPending(optionId);
    window.setTimeout(() => {
      setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
      setPending(null);
      if (isLast) setStep("result");
      else setCurrentQ((q) => q + 1);
    }, 350);
  }

  function restart() {
    setStep("quiz");
    setCurrentQ(0);
    setAnswers({});
    setPending(null);
  }

  if (step === "result") {
    return (
      <ResultView
        results={results}
        onRestart={restart}
        onCardClick={(f) => {
          const id = f.SVCID ?? f.SVCNM;
          navigate(`/spaces/${encodeURIComponent(id)}`, { state: { facility: f } });
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <style>{`
        @keyframes itda-slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Progress */}
      <div className="mt-6">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-slate-900 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs font-semibold text-slate-500">
          {currentQ + 1} / {total}
        </p>
      </div>

      {/* Question (animated on currentQ change via key) */}
      <div
        key={currentQ}
        className="mt-2"
        style={{
          animation: "itda-slide-in 0.3s ease-out",
          opacity: pending ? 0.5 : 1,
          transition: "opacity 0.2s",
        }}
      >
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <span>{question.emoji}</span>
            {question.tag}
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-3xl">{question.emoji}</p>
          <h2 className="mt-3 text-xl font-bold text-slate-900">{question.title}</h2>
          {question.subtitle && (
            <p className="mt-1 text-xs text-slate-500">{question.subtitle}</p>
          )}
        </div>

        <div className="mt-5 space-y-2.5">
          {question.options.map((opt) => {
            const isPending = pending === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => selectOption(opt.id)}
                disabled={!!pending}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed ${
                  isPending
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-900"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl leading-none">{opt.emoji}</span>
                  <span className="text-sm font-semibold">{opt.label}</span>
                </span>
                {isPending && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ResultView({
  results,
  onRestart,
  onCardClick,
}: {
  results: Facility[];
  onRestart: () => void;
  onCardClick: (f: Facility) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl py-2">
      <div className="mb-8 text-center">
        <p className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">
          <Sparkles className="size-3" />
          AI Matching Result
        </p>
        <h1
          className="mt-3 text-4xl text-slate-900"
          style={{ fontFamily: "'Black Han Sans', sans-serif" }}
        >
          이런 공간 어떠세요?
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          선택하신 조건과 잘 맞는 공간 {results.length}곳을 찾았어요
        </p>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-16 text-center">
          <p className="text-sm text-slate-400">
            조건에 맞는 공간을 찾지 못했어요.<br />
            다른 조건으로 다시 시도해보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {results.map((f, i) => (
            <li key={f.SVCID ?? i}>
              <button
                onClick={() => onCardClick(f)}
                className="group flex w-full items-center gap-4 overflow-hidden rounded-xl border-2 border-slate-900 bg-white p-3 text-left transition-colors hover:border-[#CCFF00] hover:bg-[#CCFF00]/10"
              >
                <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {f.IMGURL ? (
                    <img src={f.IMGURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <ImageIcon className="size-6" strokeWidth={1.2} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-base font-bold text-slate-900">{f.SVCNM}</p>
                    <span className="ml-1 shrink-0 rounded-full border border-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                      #{i + 1}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {f.AREANM}{f.PLACENM ? ` · ${f.PLACENM}` : ""}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {f.PAYATNM === "무료" ? "무료 대관" : f.PAYATNM ?? "유료"}
                    {f.V_MAX ? ` · 최대 ${f.V_MAX}명` : ""}
                    {f.MINCLASSNM ? ` · ${f.MINCLASSNM}` : ""}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex justify-center">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-6 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
        >
          <RefreshCw className="size-4" />
          다시 추천받기
        </button>
      </div>
    </div>
  );
}
