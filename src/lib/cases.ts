export interface ConstructionCase {
  id: string;
  title: string;
  type: string;
  imageIndex: number;
}

export const CONSTRUCTION_CASES: ConstructionCase[] = [
  { id: "1", title: "강남 애견미용학원 — 국가자격 대비반", type: "자격증과정", imageIndex: 1 },
  { id: "2", title: "일산 애견미용학원 — 1:1 실습 특화", type: "실습중심", imageIndex: 2 },
  { id: "3", title: "서초 애견미용학원 — 창업·취업 연계", type: "창업과정", imageIndex: 3 },
  { id: "4", title: "마포 애견미용학원 — 기초부터 실무까지", type: "종합과정", imageIndex: 4 },
  { id: "5", title: "부산 애견미용학원 — 애견미용사 자격", type: "자격증과정", imageIndex: 5 },
  { id: "6", title: "대구 애견미용학원 — 펫그루밍 실습", type: "실습중심", imageIndex: 6 },
  { id: "7", title: "인천 애견미용학원 — 소형견 전문", type: "특화과정", imageIndex: 7 },
  { id: "8", title: "수원 애견미용학원 — 애견미용관리사", type: "자격증과정", imageIndex: 8 },
  { id: "9", title: "용인 애견미용학원 — 반려견 미용 기초", type: "기초과정", imageIndex: 9 },
  { id: "10", title: "성남 애견미용학원 — 실무·창업 패키지", type: "창업과정", imageIndex: 10 },
  { id: "11", title: "광주 애견미용학원 — 종합 교육과정", type: "종합과정", imageIndex: 11 },
  { id: "12", title: "대전 애견미용학원 — 단기 집중반", type: "단기과정", imageIndex: 12 },
  { id: "13", title: "청주 애견미용학원 — 실습 장비 완비", type: "실습중심", imageIndex: 13 },
  { id: "14", title: "전주 애견미용학원 — 취업 연계형", type: "취업과정", imageIndex: 14 },
  { id: "15", title: "제주 애견미용학원 — 관광·펫산업 연계", type: "특화과정", imageIndex: 15 },
  { id: "16", title: "고양 애견미용학원 — 애견미용사 대비", type: "자격증과정", imageIndex: 16 },
  { id: "17", title: "안양 애견미용학원 — 소수정예 수업", type: "1:1과정", imageIndex: 17 },
  { id: "18", title: "부천 애견미용학원 — 기초·실무 통합", type: "종합과정", imageIndex: 18 },
  { id: "19", title: "창원 애견미용학원 — 실습·자격증 병행", type: "자격증과정", imageIndex: 19 },
  { id: "20", title: "울산 애견미용학원 — 반려견 미용 전문", type: "전문과정", imageIndex: 20 },
];

export const REVIEWS = [
  {
    name: "김*영",
    business: "애견미용사 수료",
    text: "학원 정보가 너무 많아 고민했는데, 자격증 과정과 실습 비율을 비교해 줄 수 있어서 제 상황에 맞는 학원을 빠르게 찾았습니다. 상담도 친절했어요.",
    rating: 5,
  },
  {
    name: "이*수",
    business: "애견미용 창업 준비",
    text: "창업 연계 과정이 있는 학원만 골라 안내받았습니다. 커리큘럼·수강료·실습 환경을 한눈에 비교할 수 있어 결정이 수월했습니다.",
    rating: 5,
  },
  {
    name: "박*민",
    business: "직장인 수강",
    text: "주말반·야간반 운영 학원 정보를 정리해 주셔서 본업과 병행하기 좋았습니다. 자격증 취득 후 바로 취업 연결도 도움받았습니다.",
    rating: 5,
  },
  {
    name: "최*진",
    business: "애견미용관리사 준비",
    text: "애견미용사와 관리사 과정 차이를 명확히 설명해 주셔서 목표에 맞는 학원을 선택할 수 있었습니다. 믿을 만한 정보 포털이라 주변에도 추천했습니다.",
    rating: 5,
  },
  {
    name: "정*아",
    business: "펫그루밍 입문",
    text: "처음 미용을 배우는 입장에서 기초 과정 위주로 학원을 추천받았습니다. 1:1 실습 비율이 높은 곳으로 연결되어 만족스럽게 수료했습니다.",
    rating: 5,
  },
  {
    name: "한*우",
    business: "지역별 학원 비교",
    text: "강남·일산 등 여러 지역 학원을 비교 상담받았습니다. 한국애견연맹 위원장님 검증 정보라 신뢰가 갔고, 등록 요청도 간편했습니다.",
    rating: 5,
  },
];

export const WHY_US = [
  {
    num: "01",
    title: "검증된 학원 정보",
    highlight: "500+",
    sub: "전국 등록 학원",
  },
  {
    num: "02",
    title: "자격증·실습 과정 안내",
    highlight: "전문 상담",
    sub: "무료 학원 매칭",
  },
  {
    num: "03",
    title: "한국애견연맹",
    highlight: "위원장 검증",
    sub: "신뢰할 수 있는 정보",
  },
];

export const PROCESS_STEPS = [
  {
    step: "01",
    title: "상담·목표 설정",
    desc: "자격증·창업·취업 등 목표를 확인합니다",
  },
  {
    step: "02",
    title: "학원 비교·추천",
    desc: "지역·과정·수강료 기준으로 맞춤 추천합니다",
  },
  {
    step: "03",
    title: "등록·수강 연결",
    desc: "학원 등록 요청 또는 제휴 상담을 진행합니다",
  },
];
