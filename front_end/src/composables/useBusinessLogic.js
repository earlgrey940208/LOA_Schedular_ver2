import { 
  getScheduledCharacters, 
  getCharacterRaids, 
  isCharacterMaxed, 
  isScheduleFinished as utilIsScheduleFinished, 
  toggleScheduleFinish as utilToggleScheduleFinish, 
  markScheduleAsChanged as utilMarkScheduleAsChanged 
} from '@/utils/scheduleHelpers'

export function useBusinessLogic(appData, dragDropFunctions) {
  const {
    // 상태
    characters,
    schedules,
    scheduleFinish,
    userSchedules,
    newCharacters,
    deletedCharacters,
    hasScheduleChanges,
    hasUserScheduleChanges,
    changedUserSchedules,
    // 메서드
    setError
  } = appData

  const {
    onScheduleDrop: originalOnScheduleDrop,
    onRightClick: originalOnRightClick
  } = dragDropFunctions

  // ========== 스케줄 관리 로직 ==========
  
  // 스케줄 관련 헬퍼 함수들 (래핑)
  const getScheduledCharactersWrapper = (party, raid) => {
    return getScheduledCharacters(party, raid, schedules.value)
  }

  const getCharacterRaidsWrapper = (characterName) => {
    return getCharacterRaids(characterName, schedules.value)
  }

  const isCharacterMaxedWrapper = (characterName) => {
    return isCharacterMaxed(characterName, schedules.value)
  }

  // 스케줄 완료 상태 관리 래핑 함수들
  const isScheduleFinished = (party, raid) => {
    return utilIsScheduleFinished(party, raid, scheduleFinish.value)
  }

  const toggleScheduleFinish = (party, raid) => {
    utilToggleScheduleFinish(party, raid, scheduleFinish.value)
  }

  // 스케줄 변경사항 추적 래핑 함수
  const markScheduleAsChanged = () => {
    utilMarkScheduleAsChanged(hasScheduleChanges)
  }

  // 래핑된 드래그&드롭 함수들
  const onScheduleDrop = (event, party, raid, schedules, getCharacterRaids) => {
    const result = originalOnScheduleDrop(event, party, raid, schedules, getCharacterRaidsWrapper, isScheduleFinished, markScheduleAsChanged)
    return result
  }

  const onRightClick = (event, party, raid, characterIndex, schedules) => {
    const result = originalOnRightClick(event, party, raid, characterIndex, schedules, toggleScheduleFinish, isScheduleFinished, markScheduleAsChanged)
    return result
  }

  // 스케줄에서 캐릭터 더블클릭 삭제 함수
  const onCharacterDoubleClick = (event, party, raid, characterIndex) => {
    event.preventDefault()
    event.stopPropagation()
    
    const key = `${party}-${raid}`
    
    if (schedules.value[key] && schedules.value[key][characterIndex]) {
      // 캐릭터 삭제
      schedules.value[key].splice(characterIndex, 1)
      
      // 배열이 비어있으면 키 삭제
      if (schedules.value[key].length === 0) {
        delete schedules.value[key]
      }
      
      // 스케줄 변경사항 추적
      markScheduleAsChanged()
    }
  }

  // ========== 캐릭터 관리 로직 ==========
  
  const addCharacter = async (userName, characterName) => {
    try {
      // 로컬 상태에만 추가 (서버 저장은 saveAll에서 일괄 처리)
      if (!characters[userName]) {
        characters[userName] = []
      }
      
      // seq 계산: 해당 사용자의 기존 캐릭터 중 최대 seq + 1
      const userCharacters = characters[userName]
      const maxSeq = userCharacters.length > 0 
        ? Math.max(...userCharacters.map(char => char.seq || 0))
        : 0
      
      const newCharacter = {
        name: characterName,
        isSupporter: false, // 기본값
        userId: userName,
        seq: maxSeq + 1
      }
      
      // 로컬 상태에 추가
      characters[userName].push(newCharacter)
      
      // 새 캐릭터 목록에 추가 (서버 저장용)
      newCharacters.value.push(newCharacter)
      
    } catch (error) {
      console.error('캐릭터 추가 실패:', error)
      setError('캐릭터 추가에 실패했습니다')
    }
  }

  const deleteCharacter = (userName, characterName) => {
    const userCharacters = characters[userName]
    if (userCharacters) {
      const characterIndex = userCharacters.findIndex(char => char.name === characterName)
      if (characterIndex !== -1) {
        // 새로 추가된 캐릭터인지 확인
        const newCharacterIndex = newCharacters.value.findIndex(char => char.name === characterName)
        
        if (newCharacterIndex !== -1) {
          // 새로 추가된 캐릭터라면 newCharacters 목록에서만 제거 (서버 삭제 불필요)
          newCharacters.value.splice(newCharacterIndex, 1)
        } else {
          // 기존 캐릭터라면 삭제 목록에 추가 (서버에서 삭제 필요)
          deletedCharacters.value.push(characterName) // 이름만 저장
        }
        
        // 로컬 상태에서 제거
        userCharacters.splice(characterIndex, 1)
      } else {
        console.warn('❌ 캐릭터를 찾을 수 없음:', characterName)
      }
    } else {
      console.warn('❌ 사용자를 찾을 수 없음:', userName)
    }
  }

  // ========== 유저 일정 관리 로직 ==========
  
  const updateUserScheduleText = (userId, dayOfWeek, weekNumber, text) => {
    // 2주차 시스템에 맞게 데이터 구조 수정
    if (!userSchedules.value[userId]) {
      userSchedules.value[userId] = {}
    }
    
    const weekKey = `week${weekNumber}`
    if (!userSchedules.value[userId][weekKey]) {
      userSchedules.value[userId][weekKey] = {}
    }
    if (!userSchedules.value[userId][weekKey][dayOfWeek]) {
      userSchedules.value[userId][weekKey][dayOfWeek] = { text: '', isEnabled: true }
    }
    
    userSchedules.value[userId][weekKey][dayOfWeek].text = text

    // 변경된 일정 추적
    const changeKey = `${userId}-${dayOfWeek}-week${weekNumber}`
    const existingIndex = changedUserSchedules.value.findIndex(item => 
      `${item.userId}-${item.dayOfWeek}-week${item.weekNumber}` === changeKey
    )
    const scheduleData = {
      userId,
      dayOfWeek,
      weekNumber,
      scheduleText: text,
      enabled: userSchedules.value[userId][weekKey][dayOfWeek].isEnabled ? 'Y' : 'N'
    }
    if (existingIndex >= 0) {
      changedUserSchedules.value[existingIndex] = scheduleData
    } else {
      changedUserSchedules.value.push(scheduleData)
    }
    hasUserScheduleChanges.value = true
  }

  const toggleUserScheduleEnabled = (userId, dayOfWeek, weekNumber) => {
    // 2주차 시스템에 맞게 데이터 구조 수정
    if (!userSchedules.value[userId]) {
      userSchedules.value[userId] = {}
    }
    
    const weekKey = `week${weekNumber}`
    if (!userSchedules.value[userId][weekKey]) {
      userSchedules.value[userId][weekKey] = {}
    }
    if (!userSchedules.value[userId][weekKey][dayOfWeek]) {
      userSchedules.value[userId][weekKey][dayOfWeek] = { text: '', isEnabled: true }
    }
    
    // 현재 상태 토글
    const currentEnabled = userSchedules.value[userId][weekKey][dayOfWeek].isEnabled
    userSchedules.value[userId][weekKey][dayOfWeek].isEnabled = !currentEnabled
    
    // 변경된 일정 추적
    const changeKey = `${userId}-${dayOfWeek}-week${weekNumber}`
    const existingIndex = changedUserSchedules.value.findIndex(item => 
      `${item.userId}-${item.dayOfWeek}-week${item.weekNumber}` === changeKey
    )
    const scheduleData = {
      userId,
      dayOfWeek,
      weekNumber,
      scheduleText: userSchedules.value[userId][weekKey][dayOfWeek].text || '',
      enabled: userSchedules.value[userId][weekKey][dayOfWeek].isEnabled ? 'Y' : 'N'
    }
    if (existingIndex >= 0) {
      changedUserSchedules.value[existingIndex] = scheduleData
    } else {
      changedUserSchedules.value.push(scheduleData)
    }
    hasUserScheduleChanges.value = true
  }

  return {
    // 스케줄 관리
    getScheduledCharactersWrapper,
    getCharacterRaidsWrapper,
    isCharacterMaxedWrapper,
    isScheduleFinished,
    toggleScheduleFinish,
    markScheduleAsChanged,
    onScheduleDrop,
    onRightClick,
    onCharacterDoubleClick,
    
    // 캐릭터 관리
    addCharacter,
    deleteCharacter,
    
    // 유저 일정 관리
    updateUserScheduleText,
    toggleUserScheduleEnabled
  }
}
