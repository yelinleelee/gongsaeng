import { Link } from "react-router-dom";

export function LaunchingPage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="space-y-5 rounded-2xl bg-slate-900 px-8 py-16 text-white">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          OPEN LETTER LAUNCHING SOLUTION
        </span>
        <h1 className="text-3xl font-semibold leading-snug tracking-tight sm:text-4xl">
          매물 발굴부터 리모델링까지<br />— 당신의 숙소, 시작부터 완성까지 책임집니다.
        </h1>
        <p className="max-w-xl leading-7 text-slate-300">
          복잡한 부동산 앱, 정체불명의 인테리어 업체 사이에서 헤매지 마세요. 도시공학 전문가들이
          수익률 높은 매물을 찾고, 가장 효율적인 공간으로 세팅해 드립니다.
        </p>
      </section>

      {/* Pain Points */}
      <section className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">PAIN POINTS</p>
          <h2 className="text-2xl font-semibold">
            "호스트가 되고 싶은 마음은 굴뚝같지만,<br />현실은 이렇지 않나요?"
          </h2>
        </header>
        <div className="space-y-3">
          {[
            {
              num: "01",
              title: '"매물 찾기가 너무 힘들어요."',
              desc: "어떤 동네가 뜨는지, 어떤 건물이 수익이 날지 판단하기 어렵습니다.",
            },
            {
              num: "02",
              title: '"시공을 어디서부터 어디까지 해야 할까요?"',
              desc: "인테리어 견적은 천차만별이고, 불필요한 공사비 지출은 늘어만 갑니다.",
            },
            {
              num: "03",
              title: '"혼자 다 하기가 너무 벅차요."',
              desc: "매물 계약, 인테리어, 사진 촬영, 플랫폼 등록까지 혼자 감당하기엔 너무 많습니다.",
            },
          ].map((p) => (
            <div
              key={p.num}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5"
            >
              <span className="text-2xl font-bold text-slate-200">{p.num}</span>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{p.title}</p>
                <p className="text-sm text-slate-600">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="space-y-8 rounded-2xl bg-slate-50 px-8 py-10">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">OUR SOLUTION</p>
          <h2 className="text-2xl font-semibold">원스톱 론칭 패키지</h2>
          <p className="text-slate-500">매물 발굴부터 첫 예약까지, 모든 단계를 함께합니다.</p>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { icon: "🔍", title: "매물 발굴 & 수익 분석", desc: "도시공학 기반 데이터로 수익률 높은 매물을 직접 추천해 드립니다." },
            { icon: "🏗️", title: "리모델링 & 인테리어", desc: "최적의 공간 구성과 감성 인테리어로 예약률을 높입니다." },
            { icon: "📸", title: "전문 사진 촬영", desc: "숙소의 매력을 극대화하는 프로 포토그래퍼와 함께합니다." },
            { icon: "🚀", title: "플랫폼 등록 & 런칭", desc: "오픈레터 등록부터 초기 마케팅까지 첫 예약을 함께 만듭니다." },
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
        <h2 className="text-2xl font-semibold">지금 바로 무료 상담 신청하기</h2>
        <p className="text-slate-300">담당 컨설턴트가 48시간 내에 연락드립니다.</p>
        <Link
          to="/host/register"
          className="inline-block rounded-md bg-white px-6 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          호스트 등록 시작하기
        </Link>
      </section>
    </div>
  );
}
