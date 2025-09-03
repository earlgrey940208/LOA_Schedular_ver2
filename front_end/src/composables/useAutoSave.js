import { ref, nextTick } from 'vue'
import { raidApi, characterApi, scheduleApi, userScheduleApi } from '@/services/api'

// Debounce 헬퍼 함수
const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export function useAutoSave(onSaveComplete = null) {
  // 저장 상태 관리
  const savingStates = ref({
    character: false,
    schedule: false,
    userSchedule: false,
    raid: false
  })

  const saveErrors = ref({
    character: null,
    schedule: null,
    userSchedule: null,
    raid: null
  })

  // 저장 완료 시 콜백 호출
  const handleSaveComplete = (type) => {
    if (onSaveComplete) {
      onSaveComplete(type)
    }
  }

  // 저장 상태 설정
  const setSavingState = (type, isSaving, error = null) => {
    savingStates.value[type] = isSaving
    saveErrors.value[type] = error
  }

  // 개별 캐릭터 저장
  const saveCharacterChange = async (character, action = 'update') => {
    try {
      setSavingState('character', true)
      console.log(`💾 [캐릭터 ${action}] API 호출 시작:`, character.name)
      
      if (action === 'create') {
        console.log(`🔗 API: POST /charactors (캐릭터 생성 - ${character.name})`)
        await characterApi.createCharacter(character)
      } else if (action === 'update') {
        console.log(`🔗 API: PUT /charactors/${character.name} (캐릭터 수정 - ${character.name})`)
        await characterApi.updateCharacter(character.name, character)
      } else if (action === 'delete') {
        console.log(`🔗 API: DELETE /charactors/${character.name} (캐릭터 삭제 - ${character.name})`)
        await characterApi.deleteCharacter(character.name)
      }
      
      setSavingState('character', false)
      handleSaveComplete('character')
      console.log(`✅ [캐릭터 ${action}] 저장 완료:`, character.name)
    } catch (error) {
      setSavingState('character', false, error.message)
      console.error('❌ 캐릭터 저장 실패:', error)
      throw error
    }
  }

  // 개별 스케줄 저장 (특정 파티-레이드 조합)
  const saveScheduleChange = async (scheduleKey, characters, isFinished = false) => {
    try {
      setSavingState('schedule', true)
      const [partyName, raidName] = scheduleKey.split('-')
      console.log(`💾 [스케줄 저장] API 호출 시작: ${partyName}파티 - ${raidName}레이드`)
      
      // 기존 스케줄 삭제 후 새로 저장
      console.log(`🔗 API: DELETE /schedule/party/${partyName}/raid/${raidName} (기존 스케줄 삭제)`)
      await scheduleApi.deleteSchedulesByPartyAndRaid(partyName, raidName)
      
      // 새 스케줄 저장
      if (characters && characters.length > 0) {
        for (const character of characters) {
          if (character.name && character.name.trim()) {
            const scheduleData = {
              id: partyName,
              raidName: raidName,
              characterName: character.name,
              isFinish: isFinished ? 'Y' : 'N'
            }
            console.log(`🔗 API: POST /schedule (스케줄 생성 - ${character.name})`)
            await scheduleApi.createSchedule(scheduleData)
          }
        }
      }
      
      setSavingState('schedule', false)
      handleSaveComplete('schedule')
      console.log(`✅ [스케줄 저장] 완료: ${partyName}파티 - ${raidName}레이드 (캐릭터 ${characters?.length || 0}명)`)
    } catch (error) {
      setSavingState('schedule', false, error.message)
      console.error(`❌ 스케줄 저장 실패: ${scheduleKey}`, error)
      throw error
    }
  }

  // 개별 유저 스케줄 저장
  const saveUserScheduleChange = async (userId, day, weekNumber, scheduleData) => {
    try {
      setSavingState('userSchedule', true)
      console.log(`💾 [유저 스케줄 저장] API 호출 시작: ${userId} - ${day}요일 (${weekNumber}주차)`)
      
      const userScheduleData = {
        userId,
        day,
        weekNumber,
        text: scheduleData.text || '',
        isEnabled: scheduleData.isEnabled
      }
      
      console.log(`🔗 API: POST /userSchedule (유저 스케줄 저장 - ${userId})`)
      await userScheduleApi.saveUserSchedule(userScheduleData)
      
      setSavingState('userSchedule', false)
      handleSaveComplete('userSchedule')
      console.log(`✅ [유저 스케줄 저장] 완료: ${userId} - ${day}요일 (${weekNumber}주차)`)
    } catch (error) {
      setSavingState('userSchedule', false, error.message)
      console.error(`❌ 유저 스케줄 저장 실패: ${userId} - ${day} (${weekNumber}주차)`, error)
      throw error
    }
  }

  // 레이드 순서 저장
  const saveRaidOrderChange = async (raids) => {
    try {
      setSavingState('raid', true)
      console.log('💾 [레이드 순서 저장] API 호출 시작')
      
      // 레이드 순서 업데이트
      for (let i = 0; i < raids.length; i++) {
        const raid = raids[i]
        console.log(`🔗 API: PUT /raid/${raid.name}/order (레이드 순서 업데이트 - ${raid.name}, seq: ${i + 1})`)
        await raidApi.updateRaidOrderSingle(raid.name, i + 1)
      }
      
      setSavingState('raid', false)
      handleSaveComplete('raid')
      console.log('✅ [레이드 순서 저장] 완료')
    } catch (error) {
      setSavingState('raid', false, error.message)
      console.error('❌ 레이드 순서 저장 실패:', error)
      throw error
    }
  }

  // Debounced 저장 함수들 (연속 입력 방지)
  const debouncedSaveUserSchedule = debounce(saveUserScheduleChange, 1000) // 1초 대기
  const debouncedSaveSchedule = debounce(saveScheduleChange, 500) // 0.5초 대기

  // 전체 저장 상태 확인
  const isAnySaving = () => {
    return Object.values(savingStates.value).some(state => state)
  }

  // 에러가 있는지 확인
  const hasAnyError = () => {
    return Object.values(saveErrors.value).some(error => error !== null)
  }

  // 에러 클리어
  const clearErrors = () => {
    Object.keys(saveErrors.value).forEach(key => {
      saveErrors.value[key] = null
    })
  }

  return {
    // 상태
    savingStates,
    saveErrors,
    
    // 저장 함수들
    saveCharacterChange,
    saveScheduleChange,
    saveUserScheduleChange,
    saveRaidOrderChange,
    
    // Debounced 함수들
    debouncedSaveUserSchedule,
    debouncedSaveSchedule,
    
    // 유틸리티
    isAnySaving,
    hasAnyError,
    clearErrors,
    setSavingState
  }
}
