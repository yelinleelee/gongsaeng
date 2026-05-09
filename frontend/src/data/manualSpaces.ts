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
}

export const manualSpaces: ManualSpace[] = [
  {
    SVCID: "manual-bukchon-hanok",
    SVCNM: "북촌 한옥청",
    PLACENM: "북촌 한옥청",
    AREANM: "종로구",
    PAYATNM: "무료",
    MINCLASSNM: "전시/관람",
    X: "126.9851",
    Y: "37.5826",
  },
  {
    SVCID: "manual-bukchon-sarangbang",
    SVCNM: "북촌 사랑방",
    PLACENM: "북촌 사랑방",
    AREANM: "종로구",
    PAYATNM: "무료",
    MINCLASSNM: "전시/관람",
    X: "126.9845",
    Y: "37.5822",
  },
  {
    SVCID: "manual-shelter-gallery",
    SVCNM: "쉼터갤러리",
    PLACENM: "쉼터갤러리",
    AREANM: "종로구",
    PAYATNM: "무료",
    MINCLASSNM: "전시/관람",
    X: "126.9873",
    Y: "37.5791",
  },
  {
    SVCID: "manual-honggeun-house",
    SVCNM: "홍건익 가옥",
    PLACENM: "홍건익 가옥",
    AREANM: "종로구",
    PAYATNM: "무료",
    MINCLASSNM: "전시/관람",
    X: "126.9692",
    Y: "37.5785",
  },
  {
    SVCID: "manual-youth-arts-greyroom",
    SVCNM: "청년예술청 그레이룸",
    PLACENM: "청년예술청",
    AREANM: "종로구",
    PAYATNM: "무료",
    MINCLASSNM: "전시/관람",
    X: "126.9782",
    Y: "37.5705",
  },
  {
    SVCID: "manual-solsol-center",
    SVCNM: "솔솔센터",
    PLACENM: "솔솔센터",
    AREANM: "영등포구",
    PAYATNM: "무료",
    MINCLASSNM: "전시/관람",
    X: "126.9066",
    Y: "37.5258",
  },
];
