// 유저별 색상 매핑
export const userColors = {
  '혀니': '#9d4edd',
  '샷건': '#f4d03f',
  '도당': '#85c1e9'
}

// 파티 목록
export const defaultParties = ['1파티', '2파티', '3파티', '4파티', '5파티', '6파티']

// 기본 캐릭터 데이터
export const defaultCharacters = {
  '혀니': [
    { name: '비내', isSupporter: false, userId: '혀니' },
    { name: '메딕', isSupporter: true, userId: '혀니' }
  ],
  '샷건': [
    { name: '샷건', isSupporter: false, userId: '샷건' },
    { name: '마리', isSupporter: false, userId: '샷건' },
    { name: '붓먹', isSupporter: true, userId: '샷건' }
  ],
  '도당': [
    { name: '포우', isSupporter: false, userId: '도당' },
    { name: '포포', isSupporter: false, userId: '도당' }
  ]
}

// 기본 레이드 목록
export const defaultRaids = ['베히모스', '하기르', '노브', '노르둠']
