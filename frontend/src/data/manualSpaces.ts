export interface ManualSpace {
  SVCID: string;
  SVCNM: string;
  PLACENM: string;
  AREANM: string;
  PAYATNM: string;
  IMGURL?: string;
  SVCURL?: string;
  MINCLASSNM: string;
  MAXCLASSNM?: string;
  V_MAX?: string;
  X?: string;
  Y?: string;
  ADDR?: string;       // 도로명 주소
  OPENHOURS?: string;  // 운영시간
}

// 출처: 서울한옥포털(hanok.seoul.go.kr), 종로구청, sapy.kr, sfac.or.kr (2026-05 기준)
// 위경도는 도로명 주소 기반 추정값 — 운영 시 카카오/네이버 지오코딩으로 재검증 권장
export const manualSpaces: ManualSpace[] = [
  {
    SVCID: "manual-bukchon-hanok",
    SVCNM: "북촌 한옥청",
    PLACENM: "북촌 한옥청",
    AREANM: "종로구",
    PAYATNM: "무료",
    MINCLASSNM: "전시/관람",
    X: "126.9854",
    Y: "37.5827",
    ADDR: "서울특별시 종로구 북촌로12길 29-1",
    OPENHOURS: "화-일 10:00-18:00 (매주 월요일 휴관)",
    SVCURL: "https://hanok.seoul.go.kr/front/kor/life/lifeSarang.do?tab=7",
    IMGURL: "https://picsum.photos/seed/bukchon-hanok/400/300",
  },
  {
    SVCID: "manual-bukchon-sarangbang",
    SVCNM: "북촌 사랑방",
    PLACENM: "북촌 주민사랑방",
    AREANM: "종로구",
    PAYATNM: "무료",
    MINCLASSNM: "다목적실",
    X: "126.9847",
    Y: "37.5816",
    ADDR: "서울특별시 종로구 계동2길 11-9",
    OPENHOURS: "화-일 10:00-17:00 (매주 월요일 휴관)",
    SVCURL: "https://hanok.seoul.go.kr/front/kor/life/lifeSarang.do?tab=1",
    IMGURL: "https://picsum.photos/seed/bukchon-sarangbang/400/300",
  },
  {
    SVCID: "manual-shelter-gallery",
    SVCNM: "쉼터갤러리",
    PLACENM: "작은쉼터 & 모두의 갤러리",
    AREANM: "종로구",
    PAYATNM: "무료",
    MINCLASSNM: "전시/관람",
    X: "126.9849",
    Y: "37.5818",
    ADDR: "서울특별시 종로구 계동2길 11-9 (북촌 한옥지원센터 내)",
    OPENHOURS: "화-일 10:00-17:00 (매주 월요일 휴관)",
    SVCURL: "https://hanok.seoul.go.kr/front/kor/exp/expGallery.do?tab=1",
    IMGURL: "https://picsum.photos/seed/shelter-gallery/400/300",
  },
  {
    SVCID: "manual-honggeun-house",
    SVCNM: "홍건익 가옥",
    PLACENM: "필운동 홍건익 가옥",
    AREANM: "종로구",
    PAYATNM: "무료",
    MINCLASSNM: "전시/관람",
    V_MAX: "10",
    X: "126.9678",
    Y: "37.5786",
    ADDR: "서울특별시 종로구 필운대로1길 14-4",
    OPENHOURS: "화-금 10:00-21:00, 토-일 10:00-18:00 (월요일·공휴일 휴관)",
    SVCURL: "https://www.seoulhonghouse.kr/",
    IMGURL: "https://picsum.photos/seed/honggeun-house/400/300",
  },
  {
    SVCID: "manual-sapy-greyroom",
    SVCNM: "청년예술청 그레이룸",
    PLACENM: "청년예술청 SAPY",
    AREANM: "서대문구",
    PAYATNM: "무료",
    MINCLASSNM: "다목적실",
    V_MAX: "100",
    X: "126.9637",
    Y: "37.5601",
    ADDR: "서울특별시 서대문구 경기대로 26-26 102동 지하2층",
    OPENHOURS: "화-일 14:00-22:00 (월요일·법정공휴일 휴관)",
    SVCURL: "http://www.sapy.kr/SPACE_PREVIEW",
    IMGURL: "/main3.jpg",
  },
  {
    SVCID: "manual-sapy",
    SVCNM: "청년예술청 SAPY",
    PLACENM: "청년예술청 SAPY (Seoul Art Plot for Youth)",
    AREANM: "서대문구",
    PAYATNM: "무료",
    MINCLASSNM: "다목적실",
    V_MAX: "100",
    X: "126.9638",
    Y: "37.5602",
    ADDR: "서울특별시 서대문구 경기대로 26-26 102동 지하2층",
    OPENHOURS: "공유오피스 화-일 13:00-22:00 / 대관 14:00-22:00 (월·공휴일 휴관)",
    SVCURL: "http://www.sapy.kr/",
    IMGURL: "https://picsum.photos/seed/sapy-main/400/300",
  },
];
