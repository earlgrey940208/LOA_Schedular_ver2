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

// 스케줄 완료 상태 관리 함수들
export const isScheduleFinished = (party, raid, scheduleFinish) => {
  const key = `${party}-${raid}`
  return scheduleFinish[key] || false
}

export const toggleScheduleFinish = (party, raid, scheduleFinish) => {
  const key = `${party}-${raid}`
  scheduleFinish[key] = !scheduleFinish[key]
}

// 스케줄 변경 추적 함수들
export const markScheduleAsChanged = (hasScheduleChanges) => {
  hasScheduleChanges.value = true
}

export const resetScheduleChanges = (hasScheduleChanges) => {
  hasScheduleChanges.value = false
}
