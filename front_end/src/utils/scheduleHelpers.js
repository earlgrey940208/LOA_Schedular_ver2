// 스케줄 관련 헬퍼 함수들
export const getScheduledCharacters = (party, raid, schedules) => {
  const key = `${party}-${raid}`
  const result = schedules[key] || []
  return result
}

export const getCharacterRaids = (characterName, schedules) => {
  const raidsList = new Set()
  Object.keys(schedules).forEach(key => {
    const [party, raid] = key.split('-')
    schedules[key].forEach(character => {
      if (character.name === characterName) {
        raidsList.add(raid)
      }
    })
  })
  return Array.from(raidsList)
}

// 캐릭터가 최대 레이드 수에 도달했는지 확인
export const isCharacterMaxed = (characterName, schedules) => {
  return getCharacterRaids(characterName, schedules).length >= 3
}
