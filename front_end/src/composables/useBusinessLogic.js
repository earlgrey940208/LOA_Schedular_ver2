import { 
  getScheduledCharacters, 
  getCharacterRaids, 
  isCharacterMaxed, 
  isScheduleFinished as utilIsScheduleFinished, 
  toggleScheduleFinish as utilToggleScheduleFinish, 
  markScheduleAsChanged as utilMarkScheduleAsChanged 
} from '@/utils/scheduleHelpers'

export function useBusinessLogic(appData, dragDropFunctions, autoSave = null) {
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

  // 자동 저장 기능 (선택적)
  const autoSaveEnabled = autoSave !== null
  
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

  // 자동 저장을 위한 스케줄 변경 처리
  const markScheduleAsChangedWithAutoSave = async (scheduleKey) => {
    console.log('🎯 [스케줄 변경 자동 저장] 시작:', scheduleKey)
    markScheduleAsChanged()
    
    // 자동 저장 활성화된 경우 즉시 저장
    if (autoSaveEnabled && autoSave.debouncedSaveSchedule) {
      const [party, raid] = scheduleKey.split('-')
      const characters = schedules.value[scheduleKey] || []
      const isFinished = scheduleFinish.value[scheduleKey] || false
      
      console.log('🎯 [스케줄 변경 자동 저장] 데이터:', {
        party, 
        raid, 
        characters: characters.length, 
        isFinished
      })
      
      autoSave.debouncedSaveSchedule(scheduleKey, characters, isFinished)
    } else {
      console.log('🎯 [스케줄 변경 자동 저장] 건너뜀 - 조건 미충족')
      console.log('🎯 autoSaveEnabled:', autoSaveEnabled)
      console.log('🎯 debouncedSaveSchedule:', autoSave?.debouncedSaveSchedule)
    }
  }

  // 래핑된 드래그&드롭 함수들
  const onScheduleDrop = (event, party, raid) => {
    console.log('🎯 [스케줄 드롭] 시작:', party, raid)
    console.log('🎯 [자동 저장 상태] autoSaveEnabled:', autoSaveEnabled)
    
    const result = originalOnScheduleDrop(event, party, raid, schedules, getCharacterRaidsWrapper, isScheduleFinished, markScheduleAsChanged)
    
    // 자동 저장
    if (result && autoSaveEnabled) {
      const scheduleKey = `${party}-${raid}`
      console.log('🎯 [스케줄 드롭] 자동 저장 호출:', scheduleKey)
      markScheduleAsChangedWithAutoSave(scheduleKey)
    } else {
      console.log('🎯 [스케줄 드롭] 자동 저장 건너뜀 - result:', result, 'autoSaveEnabled:', autoSaveEnabled)
    }
    
    return result
  }

  const onRightClick = (event, party, raid, characterIndex) => {
    const result = originalOnRightClick(event, party, raid, characterIndex, schedules, toggleScheduleFinish, isScheduleFinished, markScheduleAsChanged)
    
    // 자동 저장
    if (result && autoSaveEnabled) {
      const scheduleKey = `${party}-${raid}`
      markScheduleAsChangedWithAutoSave(scheduleKey)
    }
    
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
      
      // 스케줄 변경사항 추적 및 자동 저장
      if (autoSaveEnabled) {
        markScheduleAsChangedWithAutoSave(key)
      } else {
        markScheduleAsChanged()
      }
    }
  }

  // ========== 캐릭터 관리 로직 ==========
  
  const addCharacter = async (userName, characterName) => {
    try {
      console.log('🎯 [캐릭터 추가] 시작:', userName, characterName)
      console.log('🎯 [자동 저장 상태] autoSaveEnabled:', autoSaveEnabled)
      
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
      
      console.log('🎯 [캐릭터 추가] 새 캐릭터 객체:', newCharacter)
      
      // 로컬 상태에 추가
      characters[userName].push(newCharacter)
      
      // 새 캐릭터 목록에 추가 (서버 저장용)
      newCharacters.value.push(newCharacter)
      
      // 자동 저장
      if (autoSaveEnabled && autoSave.saveCharacterChange) {
        console.log('🎯 [캐릭터 추가] 자동 저장 호출 시작')
        await autoSave.saveCharacterChange(newCharacter, 'create')
        console.log('🎯 [캐릭터 추가] 자동 저장 완료')
      } else {
        console.log('🎯 [캐릭터 추가] 자동 저장 비활성화 또는 함수 없음')
        console.log('🎯 autoSave 객체:', autoSave)
      }
      
    } catch (error) {
      console.error('❌ 캐릭터 추가 실패:', error)
      setError('캐릭터 추가에 실패했습니다')
    }
  }

  const deleteCharacter = async (userName, characterName) => {
    const userCharacters = characters[userName]
    if (userCharacters) {
      const characterIndex = userCharacters.findIndex(char => char.name === characterName)
      if (characterIndex !== -1) {
        const character = userCharacters[characterIndex]
        
        // 새로 추가된 캐릭터인지 확인
        const newCharacterIndex = newCharacters.value.findIndex(char => char.name === characterName)
        
        if (newCharacterIndex !== -1) {
          // 새로 추가된 캐릭터라면 newCharacters 목록에서만 제거 (서버 삭제 불필요)
          newCharacters.value.splice(newCharacterIndex, 1)
        } else {
          // 기존 캐릭터라면 삭제 목록에 추가 (서버에서 삭제 필요)
          deletedCharacters.value.push(characterName) // 이름만 저장
          
          // 자동 저장
          if (autoSaveEnabled && autoSave.saveCharacterChange) {
            await autoSave.saveCharacterChange(character, 'delete')
          }
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
    console.log('🎯 [유저 스케줄 텍스트 업데이트] 시작:', userId, dayOfWeek, weekNumber, text)
    console.log('🎯 [자동 저장 상태] autoSaveEnabled:', autoSaveEnabled)
    
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
    
    // 자동 저장
    if (autoSaveEnabled && autoSave.debouncedSaveUserSchedule) {
      const scheduleData = {
        text,
        isEnabled: userSchedules.value[userId][weekKey][dayOfWeek].isEnabled
      }
      console.log('🎯 [유저 스케줄 텍스트] 자동 저장 호출:', userId, dayOfWeek, weekNumber)
      autoSave.debouncedSaveUserSchedule(userId, dayOfWeek, weekNumber, scheduleData)
    } else {
      console.log('🎯 [유저 스케줄 텍스트] 자동 저장 건너뜀')
      console.log('🎯 autoSaveEnabled:', autoSaveEnabled)
      console.log('🎯 debouncedSaveUserSchedule:', autoSave?.debouncedSaveUserSchedule)
    }
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
    
    // 자동 저장
    if (autoSaveEnabled && autoSave.debouncedSaveUserSchedule) {
      const scheduleData = {
        text: userSchedules.value[userId][weekKey][dayOfWeek].text,
        isEnabled: !currentEnabled
      }
      autoSave.debouncedSaveUserSchedule(userId, dayOfWeek, weekNumber, scheduleData)
    }
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
