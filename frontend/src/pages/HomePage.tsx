import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Minus, Plus } from "lucide-react";
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
}

const ALLOWED_CULTURE = new Set(["전시/관람", "문화행사"]);
const ALLOWED_INSTITUTION = new Set(["강당", "광장", "녹화장소", "공연장", "회의실", "다목적실", "강의실"]);

// "SPACES" 섹션의 3개 카테고리 카드
// label은 StaysPage의 FIXED_CATEGORIES 키와 일치해야 함 (URL 파라미터 매칭)
const SPACE_CATEGORIES: {
  label: string;
  tag: string;
  tagColor: string;
  image: string;
}[] = [
  { label: "공연장", tag: "Performing", tagColor: "#CCFF00", image: "/drawing1.jpg" },
  { label: "전시장", tag: "Exhibition", tagColor: "#FF80D5", image: "/drawing2.jpg" },
  { label: "광장 및 야외", tag: "Outdoor", tagColor: "#FF9933", image: "/drawing3.jpg" },
];

// 카드 클릭 시 StaysPage 카테고리 매칭 (StaysPage의 FIXED_CATEGORIES와 정확히 일치하는 키로 변환)
const CATEGORY_QUERY: Record<string, string> = {
  "공연장": "공연장",
  "전시장": "전시·관람",
  "광장 및 야외": "광장·야외",
};

// "FAQ" 섹션 질문/답변
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "잇다는 무료 서비스인가요?",
    a: "네, 잇다는 무료로 이용할 수 있어요. 공간 예약은 서울시 공공서비스예약 페이지에서 진행됩니다.",
  },
  {
    q: "실제 예약은 어디서 하나요?",
    a: "공간 상세 페이지에서 날짜와 시간을 선택한 후 서울시 예약 페이지로 이동해 최종 예약할 수 있어요.",
  },
  {
    q: "AI 추천은 어떻게 작동하나요?",
    a: "창작자 유형, 목적, 인원, 예산, 지역을 입력하면 Claude AI가 최적의 공간 3곳을 추천해드려요.",
  },
  {
    q: "어떤 공간들이 있나요?",
    a: "공연장, 전시·관람, 다목적실, 강당·강의실, 녹화·촬영, 광장·야외 등 서울시 공공공간 62곳이 있어요.",
  },
  {
    q: "공간 정보가 최신인가요?",
    a: "서울시 공공데이터 API와 실시간 연동되어 항상 최신 정보를 제공해요.",
  },
];

// "FOR CREATORS" 섹션의 4개 타겟 유저 카드
const CREATOR_CATEGORIES: {
  emoji: string;
  title: string;
  description: string;
}[] = [
  {
    emoji: "🎨",
    title: "Emerging Artists",
    description: "전시·팝업을 위한 첫 공간을 찾는 창작자",
  },
  {
    emoji: "🏷️",
    title: "Small Brands",
    description: "팝업스토어·브랜드 이벤트를 기획하는 팀",
  },
  {
    emoji: "🎭",
    title: "Performers",
    description: "소규모 공연·워크숍 공간이 필요한 아티스트",
  },
  {
    emoji: "📸",
    title: "Content Creators",
    description: "촬영·녹화를 위한 공간을 찾는 크리에이터",
  },
];

const FULL_BLEED: React.CSSProperties = {
  width: "100vw",
  marginLeft: "calc(50% - 50vw)",
};

const HERO_IMAGES = ["/main1.jpg", "/main3.jpg", "/main4.jpg"];

export function HomePage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIdx((i) => (i + 1) % HERO_IMAGES.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

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
        const all = [...cultureRows, ...institutionRows, ...manualSpaces].filter((f) => {
          const key = f.SVCID ?? `${f.SVCNM}__${f.PLACENM}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setFacilities(all);
      })
      .catch(() => setFacilities([]));
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section
        className="relative flex flex-col overflow-hidden"
        style={{
          ...FULL_BLEED,
          minHeight: "100vh",
        }}
      >
        {/* Background slideshow — crossfade between images */}
        {HERO_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
            style={{ opacity: i === heroIdx ? 1 : 0 }}
          />
        ))}

        {/* Centered copy */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <h1
            className="mb-6 leading-[1.08] text-white"
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: "clamp(2.2rem, 6vw, 4rem)",
              textShadow: "0 2px 24px rgba(0,0,0,0.35)",
            }}
          >
            공간을 찾는<br />모든 창작자를 위해,
          </h1>
          <p
            className="text-xl text-white"
            style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 800, textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
          >
            서울시 공공 유휴공간과 창작자를 연결하는 AI 매칭 플랫폼
          </p>
        </div>

        {/* Bottom card strip — full-width, white bg, black border */}
        <div className="relative flex w-full border-y-2 border-slate-900">
          {[
            {
              to: "/stays",
              label: "둘러보기",
              sub: "서울시 공공공간 80곳을 한눈에 탐색하세요",
              hover: "hover:bg-[#CCFF00]",
              border: "border-r-2 border-slate-900",
            },
            {
              to: "/neighborhood",
              label: "추천받기",
              sub: "전시, 팝업, 촬영, 워크숍 — 목적에 맞는 공간을 추천받아요",
              hover: "hover:bg-[#FF6EC7]",
              border: "",
            },
          ].map(({ to, label, sub, hover, border }) => (
            <Link
              key={to}
              to={to}
              className={`group flex flex-1 flex-col items-center justify-center gap-2 bg-white px-6 py-8 transition-colors duration-200 ${hover} ${border}`}
            >
              <span
                className="flex items-center gap-1.5 text-3xl text-slate-900"
                style={{ fontFamily: "'Black Han Sans', sans-serif" }}
              >
                {label} <ChevronRight className="size-6" />
              </span>
              <span
                className="whitespace-nowrap text-center text-sm text-slate-500 group-hover:text-slate-700"
                style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500 }}
              >
                {sub}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── SPACES ── */}
      <section className="bg-white py-20" style={FULL_BLEED}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-[18px] lg:grid-cols-[auto_1fr] lg:items-start lg:gap-14">
          {/* Left: title (전체 85% 사이즈) */}
          <div className="shrink-0 lg:pt-2">
            <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-slate-900 lg:text-5xl">
              SPACES
            </h2>
            <p className="mt-4 text-lg font-black leading-snug text-slate-900 lg:text-xl">
              공간이 없어서<br />창작을 포기하지 마세요
            </p>
          </div>

          {/* Right: 3 cards — 세로 구분선만 (조금 두껍게), 위아래 가로선 제거 */}
          <div className="grid grid-cols-3 divide-x-2 divide-slate-900">
            {SPACE_CATEGORIES.map((c) => (
              <CategoryCard key={c.label} category={c} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR CREATORS ── */}
      <section className="border-y-2 border-slate-900 bg-[#EFF7DC]" style={FULL_BLEED}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 px-[18px] lg:grid-cols-[320px_1fr]">
          {/* Left: 컬럼 폭은 grid 가 320px 로 고정. pr-12 만 적용 (max-w 불필요). py 는 왼쪽에만, 상단 60px */}
          <div className="py-20 lg:py-24 lg:pr-12 lg:pt-[60px]">
            <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-slate-900 lg:text-5xl">
              FOR<br />CREATORS
            </h2>
            <p className="mt-4 text-lg font-black leading-snug text-slate-900 lg:text-xl">
              잇다는 누구를 위한<br />플랫폼일까요?
            </p>
          </div>

          {/* Right: wrapper는 viewport 우측까지 확장 (+18px 보정), 안쪽에 pr-[40px] 로 블록 우측 패딩 40px */}
          <div className="lg:-mr-[max(0px,calc((100vw-1152px)/2+18px))] lg:pr-[40px]">
            <div className="flex h-full flex-col lg:border-x-2 lg:border-slate-900">
              {/* Hero image — 보더 안쪽 꽉 채움 */}
              <div className="aspect-[16/8] w-full shrink-0 overflow-hidden bg-slate-100">
                <img
                  src="/section3.jpg"
                  alt="Creators"
                  loading="lazy"
                  className="block h-full w-full object-cover"
                />
              </div>

              {/* 2x2 grid — divide 대신 nth-child 기반 명시적 border 로 두께 doubling 방지 */}
              <div className="grid flex-1 grid-cols-2 border-t-2 border-slate-900">
                {CREATOR_CATEGORIES.map((c, i) => (
                  <div
                    key={c.title}
                    className={`flex flex-col items-center justify-center px-6 py-7 text-center lg:px-8 ${
                      i % 2 === 1 ? "border-l-2 border-slate-900" : ""
                    } ${i >= 2 ? "border-t-2 border-slate-900" : ""}`}
                  >
                    <h3 className="text-sm font-black leading-snug text-slate-900 lg:text-base">
                      {c.title}
                    </h3>
                    <p
                      className="mt-2 text-sm leading-snug text-slate-900"
                      style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500 }}
                    >
                      {c.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-black py-20" style={FULL_BLEED}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 px-[18px] lg:grid-cols-[320px_1fr] lg:items-start">
          {/* Left: FAQ title — FOR CREATORS 와 동일하게 컬럼 폭 320px 고정 → right 시작 x 정확히 일치 */}
          <div className="shrink-0 lg:pr-12 lg:pt-2">
            <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-white lg:text-5xl">
              FAQ
            </h2>
          </div>

          {/* Right: accordion list (다크 테마) */}
          <div className="border-t border-white">
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem
                key={item.q}
                question={item.q}
                answer={item.a}
                open={faqOpen === i}
                onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

function FAQItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:bg-white/5"
      >
        <span className="text-base font-black text-white lg:text-lg">
          {question}
        </span>
        {open ? (
          <Minus className="size-5 shrink-0 text-white" />
        ) : (
          <Plus className="size-5 shrink-0 text-white" />
        )}
      </button>
      {open && (
        <p
          className="pb-5 pr-10 text-sm leading-relaxed text-slate-300"
          style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500 }}
        >
          {answer}
        </p>
      )}
    </div>
  );
}

function CategoryCard({
  category,
}: {
  category: { label: string; tag: string; tagColor: string; image: string };
}) {
  const queryLabel = CATEGORY_QUERY[category.label] ?? category.label;
  return (
    <Link
      to={`/stays?category=${encodeURIComponent(queryLabel)}`}
      className="group flex flex-col items-center px-6 py-[60px] transition-colors hover:bg-slate-50"
    >
      {/* Drawing — 기본 110% 스케일, hover 시 추가 확대 */}
      <div className="aspect-[5/4] w-full overflow-hidden">
        <img
          src={category.image}
          alt={category.label}
          loading="lazy"
          className="h-full w-full scale-110 object-contain transition-transform duration-500 ease-out group-hover:scale-[1.18]"
        />
      </div>

      {/* Title */}
      <h3 className="mt-6 text-2xl font-black text-slate-900">
        {category.label}
      </h3>

      {/* Highlighter tag */}
      <span
        className="mt-3 inline-block rounded-md px-3 py-1 text-sm font-black tracking-wide text-slate-900"
        style={{ backgroundColor: category.tagColor }}
      >
        {category.tag}
      </span>
    </Link>
  );
}

