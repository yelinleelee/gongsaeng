export function BrandStoryPage() {
  return (
    <div className="space-y-16">
      <section className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-slate-900 px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">OPEN LETTER HOUSE</h1>
        <p className="mt-3 text-slate-400">편지처럼 남겨지는 공간들의 이야기</p>
      </section>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">우리의 이야기</h2>
          <p className="leading-7 text-slate-600">
            오픈레터하우스는 여행자와 공간이 서로에게 편지를 쓰듯 연결되는 플랫폼입니다. 우리는
            단순한 숙박을 넘어, 공간이 가진 이야기와 문화를 함께 경험할 수 있는 특별한 스테이를
            큐레이팅합니다.
          </p>
          <p className="leading-7 text-slate-600">
            각 스테이는 호스트의 개성과 철학이 담긴 고유한 공간입니다. 아티스트의 작업실에서
            하룻밤을, 친환경 건축가의 집에서 자연을, 오래된 골목의 한옥에서 시간의 결을
            경험해보세요.
          </p>
        </div>
        <div className="hidden rounded-2xl bg-gradient-to-br from-[#3d3028] to-[#6b4c3b] lg:block" />
      </section>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="hidden rounded-2xl bg-gradient-to-br from-[#2b3a4a] to-[#4a6580] lg:block" />
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">세 가지 컨셉</h2>
          <ul className="space-y-4">
            {[
              {
                title: "아트 스테이",
                desc: "예술가의 손길이 담긴 공간. 회화, 조각, 사진 등 다양한 예술 작품과 함께하는 특별한 숙박 경험.",
              },
              {
                title: "친환경 스테이",
                desc: "지속 가능한 건축과 소재로 만들어진 공간. 자연과 함께 숨쉬며 환경을 생각하는 여행.",
              },
              {
                title: "로컬 스테이",
                desc: "그 동네 사람처럼 살아보는 경험. 관광지가 아닌, 진짜 동네의 일상 속으로.",
              },
            ].map((c) => (
              <li key={c.title} className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{c.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-2xl font-semibold">우리가 믿는 것들</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "✦", title: "진정성", desc: "모든 스테이는 직접 방문하고 검증합니다." },
            {
              icon: "◎",
              title: "연결",
              desc: "여행자와 공간, 호스트가 서로 이야기를 나눕니다.",
            },
            {
              icon: "◇",
              title: "지속가능성",
              desc: "환경과 지역 커뮤니티를 생각하는 여행을 지향합니다.",
            },
            {
              icon: "○",
              title: "발견",
              desc: "아직 알려지지 않은 특별한 공간들을 발굴합니다.",
            },
          ].map((v) => (
            <div
              key={v.title}
              className="space-y-2 rounded-xl border border-slate-200 p-5 text-center"
            >
              <div className="text-2xl">{v.icon}</div>
              <h3 className="font-semibold">{v.title}</h3>
              <p className="text-sm leading-6 text-slate-600">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
