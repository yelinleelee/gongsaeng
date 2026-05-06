export interface NeighborhoodScore {
  safeRoute: number;
  hospital: number;
  transit: number;
  dogWalk: number;
  cafe: number;
  indie: number;
  quiet: number;
  nature: number;
  community: number;
}

export interface Neighborhood {
  id: string;
  name: string;
  region: string;
  description: string;
  priceRange: string;
  tags: string[];
  scores: NeighborhoodScore;
}

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "gangdong-cheonho",
    name: "강동구 천호동",
    region: "강동구",
    description: "조용한 주거지 느낌 속 생활 편의가 완벽히 갖춰진 동네. 대형마트·병원·지하철이 모두 도보권.",
    priceRange: "월세 40~70만원대",
    tags: ["생활편의", "교통 좋음", "커뮤니티"],
    scores: { safeRoute: 85, hospital: 90, transit: 90, dogWalk: 70, cafe: 80, indie: 60, quiet: 65, nature: 70, community: 90 },
  },
  {
    id: "mapo-yeonnam",
    name: "마포구 연남동",
    region: "마포구",
    description: "경의선 숲길과 수많은 카페·빵집이 공존하는 힙한 동네. 강아지 산책로와 인디 씬도 살아있음.",
    priceRange: "월세 60~100만원대",
    tags: ["카페 천국", "강아지 친화", "인디바이브"],
    scores: { safeRoute: 80, hospital: 70, transit: 85, dogWalk: 90, cafe: 95, indie: 88, quiet: 60, nature: 80, community: 80 },
  },
  {
    id: "seongdong-seongsu",
    name: "성동구 성수동",
    region: "성동구",
    description: "공장이 카페와 갤러리로 변신한 서울 최고의 크리에이티브 씬. 팝업·독립서점이 넘친다.",
    priceRange: "월세 70~120만원대",
    tags: ["인디 씬", "카페·베이커리", "트렌디"],
    scores: { safeRoute: 75, hospital: 72, transit: 82, dogWalk: 68, cafe: 95, indie: 97, quiet: 48, nature: 68, community: 75 },
  },
  {
    id: "seodaemun-yeonhui",
    name: "서대문구 연희동",
    region: "서대문구",
    description: "조용한 단독주택 골목에 스몰 카페와 동네빵집이 숨어있는 힐링 주거지. 강아지 산책 코스 최고.",
    priceRange: "월세 55~90만원대",
    tags: ["조용한 주거", "강아지 산책", "자연 가까움"],
    scores: { safeRoute: 88, hospital: 80, transit: 72, dogWalk: 92, cafe: 80, indie: 70, quiet: 88, nature: 88, community: 87 },
  },
  {
    id: "jongno-samcheong",
    name: "종로구 삼청동",
    region: "종로구",
    description: "경복궁 옆 고즈넉한 골목. 갤러리·한옥카페·산책길이 공존하는 서울에서 가장 계절이 예쁜 동네.",
    priceRange: "월세 65~110만원대",
    tags: ["계절 감성", "고즈넉함", "예술·갤러리"],
    scores: { safeRoute: 82, hospital: 74, transit: 68, dogWalk: 85, cafe: 84, indie: 82, quiet: 90, nature: 93, community: 80 },
  },
  {
    id: "nowon-gongreung",
    name: "노원구 공릉동",
    region: "노원구",
    description: "대형병원·학교가 많고 대중교통이 촘촘한 실속 주거지. 공릉천 산책로 덕에 강아지 키우기도 좋음.",
    priceRange: "월세 30~55만원대",
    tags: ["병원 가까움", "교통 최고", "조용한 동네"],
    scores: { safeRoute: 90, hospital: 95, transit: 90, dogWalk: 85, cafe: 62, indie: 48, quiet: 82, nature: 75, community: 88 },
  },
  {
    id: "eunpyeong-bulgwang",
    name: "은평구 불광동",
    region: "은평구",
    description: "북한산 자락의 자연환경에 생활 인프라도 탄탄. 조용하고 커뮤니티 중심의 동네 문화가 살아있음.",
    priceRange: "월세 35~60만원대",
    tags: ["자연 가까움", "조용한 생활", "동네 온기"],
    scores: { safeRoute: 87, hospital: 85, transit: 84, dogWalk: 90, cafe: 68, indie: 52, quiet: 86, nature: 82, community: 92 },
  },
  {
    id: "songpa-bangi",
    name: "송파구 방이동",
    region: "송파구",
    description: "올림픽공원이 바로 옆인 자연·운동 친화 주거지. 병원·학교·교통 모두 탄탄한 안정형 동네.",
    priceRange: "월세 55~90만원대",
    tags: ["공원 접근", "안전한 귀가", "가족 친화"],
    scores: { safeRoute: 91, hospital: 84, transit: 86, dogWalk: 82, cafe: 73, indie: 58, quiet: 80, nature: 82, community: 86 },
  },
];

export type ScoreKey = keyof NeighborhoodScore;

export interface QuizOption {
  label: string;
  emoji: string;
  weights: Partial<Record<ScoreKey, number>>;
}

export interface QuizQuestion {
  id: string;
  layer: 1 | 2;
  layerLabel: string;
  emoji: string;
  text: string;
  subText?: string;
  options: QuizOption[];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "basement",
    layer: 1,
    layerLabel: "포기불가 지수",
    emoji: "🏠",
    text: "반지하는 어때요?",
    subText: "채광·환기 조건이 집 선택에 영향을 주나요?",
    options: [
      { label: "완전 싫어요", emoji: "🚫", weights: { safeRoute: 3, hospital: 1 } },
      { label: "1층이면 괜찮아요", emoji: "🤔", weights: { safeRoute: 1 } },
      { label: "가격 맞으면 ok", emoji: "👍", weights: {} },
    ],
  },
  {
    id: "hospital",
    layer: 1,
    layerLabel: "포기불가 지수",
    emoji: "🏥",
    text: "병원이나 약국, 가까워야 해요?",
    subText: "응급상황이나 지병이 있어서 병원 접근성이 중요한 경우",
    options: [
      { label: "네, 필수예요", emoji: "🩺", weights: { hospital: 4 } },
      { label: "가까우면 좋죠", emoji: "💊", weights: { hospital: 2 } },
      { label: "상관없어요", emoji: "🤷", weights: {} },
    ],
  },
  {
    id: "transit",
    layer: 1,
    layerLabel: "포기불가 지수",
    emoji: "🚇",
    text: "차 없이 다니는 편이에요?",
    subText: "지하철·버스 접근성이 일상에 얼마나 중요한가요?",
    options: [
      { label: "버스·지하철로만 다녀요", emoji: "🚌", weights: { transit: 4 } },
      { label: "가끔 대중교통 써요", emoji: "🛵", weights: { transit: 2 } },
      { label: "주로 차 타요", emoji: "🚗", weights: { transit: -1 } },
    ],
  },
  {
    id: "dog",
    layer: 2,
    layerLabel: "골목 바이브 지수",
    emoji: "🐕",
    text: "강아지가 있어요?",
    subText: "산책로·공원이 가까운 동네가 더 잘 맞을 수 있어요",
    options: [
      { label: "네, 같이 살아요", emoji: "🐾", weights: { dogWalk: 4, nature: 2 } },
      { label: "없지만 좋아해요", emoji: "🐶", weights: { dogWalk: 1 } },
      { label: "없어요", emoji: "😊", weights: {} },
    ],
  },
  {
    id: "vibe",
    layer: 2,
    layerLabel: "골목 바이브 지수",
    emoji: "✨",
    text: "어떤 동네 분위기 좋아요?",
    subText: "일상에서 자주 찾게 될 골목 분위기를 골라주세요",
    options: [
      { label: "카페·빵집이 많은 핫플", emoji: "☕", weights: { cafe: 4, indie: 2 } },
      { label: "조용하고 주거 중심", emoji: "🏡", weights: { quiet: 4, community: 2 } },
      { label: "인디·갤러리·독립서점", emoji: "🎨", weights: { indie: 4, cafe: 2 } },
    ],
  },
  {
    id: "nature",
    layer: 2,
    layerLabel: "골목 바이브 지수",
    emoji: "🌿",
    text: "자연이 가까웠으면 해요?",
    subText: "공원·가로수·산 등 계절 변화를 느낄 수 있는 환경",
    options: [
      { label: "네, 꼭 필요해요", emoji: "🌳", weights: { nature: 4, quiet: 2 } },
      { label: "있으면 좋죠", emoji: "🌸", weights: { nature: 2 } },
      { label: "상관없어요", emoji: "🏙️", weights: { cafe: 1, indie: 1 } },
    ],
  },
];

export function calcMatch(answers: Record<string, QuizOption>, neighborhood: Neighborhood): number {
  const weights: Record<ScoreKey, number> = {
    safeRoute: 1, hospital: 1, transit: 1,
    dogWalk: 1, cafe: 1, indie: 1, quiet: 1, nature: 1, community: 1,
  };

  for (const option of Object.values(answers)) {
    for (const [key, val] of Object.entries(option.weights) as [ScoreKey, number][]) {
      weights[key] = Math.max(0, (weights[key] ?? 1) + val);
    }
  }

  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
  let weightedScore = 0;

  for (const [key, weight] of Object.entries(weights) as [ScoreKey, number][]) {
    weightedScore += (neighborhood.scores[key] / 100) * weight;
  }

  return Math.round((weightedScore / totalWeight) * 100);
}

export function getTopMatches(answers: Record<string, QuizOption>, count = 3) {
  return NEIGHBORHOODS
    .map((n) => ({ neighborhood: n, match: calcMatch(answers, n) }))
    .sort((a, b) => b.match - a.match)
    .slice(0, count);
}
