import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="space-y-5 rounded-2xl bg-slate-900 px-8 py-16 text-white">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          OPEN LETTER HOUSE
        </span>
        <h1 className="text-3xl font-semibold leading-snug tracking-tight sm:text-4xl">
          당신과 가장 닮은 동네를<br />찾으세요.
        </h1>
        <p className="max-w-xl leading-7 text-slate-300">
          단기 임대, 이제는 역세권이 아니라 <strong className="text-white">'내 취향 골목'</strong>을
          기준으로 선택할 때입니다. 오픈레터하우스가 당신의 한 챕터가 될 동네를 매칭해 드립니다.
        </p>
      </section>

      {/* Why Open Letter */}
      <section className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            WHY OPEN LETTER?
          </p>
          <h2 className="text-2xl font-semibold">"집 밖 10분이 당신의 하루를 결정합니다."</h2>
          <p className="text-slate-500">역세권이면 정말 행복할까요?</p>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { emoji: "🌳", text: "창문을 열었을 때 보이는 가로수 그늘" },
            { emoji: "🥐", text: "퇴근길 마주치는 다정한 빵집의 온기" },
            { emoji: "🐕", text: "주말 아침 강아지와 함께 걷는 산책길" },
          ].map((c) => (
            <div
              key={c.text}
              className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-center"
            >
              <span className="text-3xl">{c.emoji}</span>
              <p className="text-sm text-slate-700">{c.text}</p>
            </div>
          ))}
        </div>
        <p className="text-slate-600">
          오픈레터는 당신의 삶이 가장 빛날 수 있는{" "}
          <strong>'중간영역'</strong>을 찾아냅니다.
        </p>
      </section>

      {/* MORO Score */}
      <section className="space-y-8 rounded-2xl bg-slate-50 px-8 py-10">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            PLATFORM CORE
          </p>
          <h2 className="text-2xl font-semibold">
            감성을 데이터로 증명합니다<br />— MORO Score Stack
          </h2>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: "🛡️",
              title: "포기불가 지수",
              sub: "Life Quality",
              desc: "경사도, 체감 안전, 주차 등 절대 양보할 수 없는 기본 생활 여건을 체크합니다.",
            },
            {
              icon: "☕",
              title: "골목 바이브 지수",
              sub: "Neighborhood Vibe",
              desc: "3년 이상 자리를 지킨 스테디 빵집, 인디 서점, 공원 벤치 등 동네의 아날로그 온기를 측정합니다.",
            },
            {
              icon: "🚇",
              title: "외부 연결 지수",
              sub: "Connectivity",
              desc: "직장까지의 실 소요 시간과 따릉이·러닝 코스 접근성까지 고려합니다.",
            },
          ].map((c) => (
            <div key={c.title} className="space-y-2 rounded-xl bg-white p-5 shadow-sm">
              <div className="text-2xl">{c.icon}</div>
              <p className="font-semibold text-slate-900">{c.title}</p>
              <p className="text-xs text-slate-400">{c.sub}</p>
              <p className="text-sm leading-6 text-slate-600">{c.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400">
          도시공학 전문가들이 설계한 데이터 기반 매칭 시스템
        </p>
      </section>

      {/* Story Stay */}
      <section className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            STORY STAY
          </p>
          <h2 className="text-2xl font-semibold">
            당신의 취향을 구독하세요,<br />'스토리 스테이'
          </h2>
          <p className="text-slate-500">단순 숙박을 넘어, 당신의 취향을 구체화하는 테마형 공간.</p>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              emoji: "🎨",
              title: "아트 스테이",
              sub: "Art Stay",
              desc: "영감이 필요한 당신을 위해. 독립 갤러리와 예술적 골목이 어우러진 크리에이티브 공간.",
              bg: "bg-amber-50",
            },
            {
              emoji: "🌿",
              title: "에코 스테이",
              sub: "Eco Stay",
              desc: "회복이 필요한 당신을 위해. 한강까지 12분, 가로수 그늘과 식물이 가득한 힐링 공간.",
              bg: "bg-emerald-50",
            },
            {
              emoji: "💻",
              title: "워라밸 스테이",
              sub: "Work-Life Stay",
              desc: "효율이 중요한 당신을 위해. 강남 출퇴근 30분 컷, 단골 국밥집과 조용한 밤이 있는 실속 공간.",
              bg: "bg-blue-50",
            },
          ].map((c) => (
            <div
              key={c.title}
              className={`space-y-3 rounded-xl p-5 ${c.bg}`}
            >
              <p className="text-3xl">{c.emoji}</p>
              <div>
                <p className="font-semibold text-slate-900">{c.title}</p>
                <p className="text-xs text-slate-400">{c.sub}</p>
              </div>
              <p className="text-sm leading-6 text-slate-700">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / Managed by HIERO */}
      <section className="space-y-5 rounded-2xl bg-slate-900 px-8 py-12 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          MANAGED BY HIERO
        </p>
        <h2 className="text-2xl font-semibold leading-snug">
          감성은 로컬에서,<br />운영은 프로페셔널하게.
        </h2>
        <p className="max-w-xl leading-7 text-slate-300">
          오픈레터하우스의 모든 숙소는 전문 운영 OS인{" "}
          <strong className="text-white">HIERO(히로)</strong>를 통해 관리됩니다. 어느 동네를
          선택하든 표준화된 청결함, 신속한 AI 응대, 투명한 계약 시스템을 보장합니다.
        </p>
        <Link
          to="/host/hiero"
          className="inline-block rounded-md border border-slate-500 px-4 py-2 text-sm text-slate-300 hover:border-white hover:text-white"
        >
          HIERO 자세히 보기 →
        </Link>
      </section>

      {/* CTA */}
      <section className="space-y-4 text-center">
        <h2 className="text-2xl font-semibold">
          지금 당신과 가장 닮은 동네는 어디인가요?
        </h2>
        <p className="text-slate-500">나다운 삶의 한 챕터를 오늘 시작하세요.</p>
        <div className="flex justify-center gap-3">
          <Link
            to="/neighborhood"
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            1분 만에 취향 퀴즈 시작하기
          </Link>
          <Link
            to="/stays"
            className="rounded-md border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            숙소 둘러보기
          </Link>
        </div>
      </section>
    </div>
  );
}
