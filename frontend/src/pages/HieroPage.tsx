import { Link } from "react-router-dom";

export function HieroPage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="space-y-5 rounded-2xl bg-slate-900 px-8 py-16 text-white">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          HIERO by OPEN LETTER
        </span>
        <h1 className="text-3xl font-semibold leading-snug tracking-tight sm:text-4xl">
          숙소 관리가 귀찮다면?<br />오픈레터 관리 구독 서비스 —<br />숙소 운영을 우리에게 맡겨보세요.
        </h1>
        <p className="max-w-xl leading-7 text-slate-300">
          예약부터 메시지 응대, 청소, 정산까지.<br />
          히로(HIERO)가 호스트님의 시간을 되찾아 드립니다.
        </p>
      </section>

      {/* Pain Points */}
      <section className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">PAIN POINTS</p>
          <h2 className="text-2xl font-semibold">
            "아직도 새벽 2시에 게스트 메시지 알람에 깨시나요?"
          </h2>
        </header>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            "💬 끝도 없는 게스트 응대와 CS",
            "🧹 갑자기 펑크 나는 청소 스케줄 관리",
            "📉 비수기만 되면 늘어나는 공실과 수익 걱정",
            "⚖️ 복잡한 정산과 전세사기 이슈 등 법률적 불안감",
          ].map((p) => (
            <div
              key={p}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="space-y-8 rounded-2xl bg-slate-50 px-8 py-10">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold">
            오픈레터하우스에 올리기만 하세요.<br />나머지는 HIERO OS가 알아서 합니다.
          </h2>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              icon: "🤖",
              title: "AI 자동 응대 (Smart CS)",
              desc: "90% 이상의 단순 문의를 AI가 즉각 처리하여 호스트의 수고를 덜어줍니다.",
            },
            {
              icon: "✨",
              title: "청소 & 컨디션 관리",
              desc: "검증된 전문 청소팀이 체크아웃 즉시 청소하고 입실 가능 상태를 확인합니다.",
            },
            {
              icon: "📊",
              title: "수익 극대화 전략",
              desc: "시즌별 가격 자동 조정과 빈 날짜 프로모션으로 공실률을 최소화합니다.",
            },
            {
              icon: "📝",
              title: "투명한 정산 시스템",
              desc: "월별 정산 내역을 자동 생성하고 세무 자료까지 정리해 드립니다.",
            },
          ].map((s) => (
            <div key={s.title} className="space-y-2 rounded-xl bg-white p-5 shadow-sm">
              <div className="text-2xl">{s.icon}</div>
              <p className="font-semibold text-slate-900">{s.title}</p>
              <p className="text-sm leading-6 text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="space-y-5 rounded-2xl bg-slate-900 px-8 py-12 text-center text-white">
        <h2 className="text-2xl font-semibold">지금 바로 시작해보세요</h2>
        <p className="text-slate-300">첫 상담은 무료입니다. 숙소 주소와 연락처만 남겨주세요.</p>
        <Link
          to="/host/register"
          className="inline-block rounded-md bg-white px-6 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          호스트 등록하기
        </Link>
      </section>
    </div>
  );
}
