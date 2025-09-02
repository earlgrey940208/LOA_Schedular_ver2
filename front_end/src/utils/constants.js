// 유저별 색상 매핑 (기본값 - API에서 동적으로 로드됨)
export const defaultUserColors = {
  '혀니': '#9d4edd',
  '샷건': '#f4d03f',
  '도당': '#85c1e9'
}

// 동적으로 설정되는 유저 색상 (API에서 로드 후 업데이트됨)
export let userColors = { ...defaultUserColors }

// 유저 색상 업데이트 함수
export const updateUserColors = (users) => {
  const newColors = {}
  users.forEach(user => {
    newColors[user.name] = user.color
  })
  // 기존 userColors 객체를 업데이트
  Object.keys(userColors).forEach(key => delete userColors[key])
  Object.assign(userColors, newColors)
}

// 파티 목록
export const defaultParties = ['1파티', '2파티', '3파티', '4파티', '5파티', '6파티', '7파티']

// 기본 캐릭터 데이터
export const defaultCharacters = {
  '혀니': [
    { name: '비내', isSupporter: false, userId: '혀니', seq: 1 },
    { name: '메딕', isSupporter: true, userId: '혀니', seq: 2 }
  ],
  '샷건': [
    { name: '샷건', isSupporter: false, userId: '샷건', seq: 1 },
    { name: '마리', isSupporter: false, userId: '샷건', seq: 2 },
    { name: '붓먹', isSupporter: true, userId: '샷건', seq: 3 }
  ],
  '도당': [
    { name: '포우', isSupporter: false, userId: '도당', seq: 1 },
    { name: '포포', isSupporter: false, userId: '도당', seq: 2 }
  ]
}

// 기본 레이드 목록
export const defaultRaids = [
  { name: '베히모스', seq: 1 },
  { name: '하기르', seq: 2 },
  { name: '노브', seq: 3 },
  { name: '노르둠', seq: 4 }
]

// 유저 일정 관련 상수
export const weekDays = ['수', '목', '금', '토', '일', '월', '화']

export const defaultUserSchedules = {
  '혀니': {
    week1: {},
    week2: {}
  },
  '도당': {
    week1: {},
    week2: {}
  },
  '샷건': {
    week1: {},
    week2: {}
  }
}
