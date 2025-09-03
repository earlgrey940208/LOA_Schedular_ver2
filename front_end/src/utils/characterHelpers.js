// 캐릭터 정보를 찾는 헬퍼 함수들
export const findCharacterUserId = (characterName, characters) => {
  for (const [userId, userCharacters] of Object.entries(characters)) {
    if (userCharacters.some(char => char.name === characterName)) {
      return userId
    }
  }
  return 'Unknown' // 찾지 못한 경우 기본값
}

export const findCharacterIsSupporter = (characterName, characters) => {
  for (const userCharacters of Object.values(characters)) {
    const character = userCharacters.find(char => char.name === characterName)
    if (character) {
      return character.isSupporter
    }
  }
  return false // 찾지 못한 경우 기본값
}
