import { raidApi, characterApi, scheduleApi, userScheduleApi, userApi } from '@/services/api'
import { defaultCharacters, defaultRaids, defaultUserSchedules, updateUserColors } from '@/utils/constants'
import { findCharacterUserId, findCharacterIsSupporter } from '@/utils/characterHelpers'
import { calculateWeekInfo } from '@/utils/weekUtils'
import { loadUserSchedules as utilLoadUserSchedules } from '@/utils/userScheduleHelpers'

export function useApiIntegration(appData) {
  const {
    // 상태
    isLoading,
    error,
    raids,
    characters,
    schedules,
    scheduleFinish,
    userSchedules,
    users,
    newCharacters,
    deletedCharacters,
    raidOrderChanges,
    newRaids,
    deletedRaids,
    hasScheduleChanges,
    hasUserScheduleChanges,
    changedUserSchedules,
    weekInfo,
    // 메서드
    setLoading,
    setError,
    clearError,
    resetDataScheduleChanges,
    updateWeekInfo
  } = appData

  // 데이터 로드 함수
  const loadData = async () => {
    try {
      setLoading(true)
      clearError()
      
      // 변경 추적 상태 초기화
      newCharacters.value = []
      deletedCharacters.value = []
      raidOrderChanges.value = []
      resetDataScheduleChanges()
      hasUserScheduleChanges.value = false
      changedUserSchedules.value = []
      
      // 유저 데이터 로드 (다른 데이터보다 먼저 로드)
      try {
        const usersData = await userApi.getAllUsers()
        users.value = usersData
        updateUserColors(usersData)
      } catch (err) {
        console.warn('유저 API 실패, 기본값 사용:', err)
        users.value = [
          { name: '혀니', color: '#9d4edd' },
          { name: '샷건', color: '#f4d03f' },
          { name: '도당', color: '#85c1e9' }
        ]
        updateUserColors(users.value)
      }
      
      // 레이드 데이터 로드
      try {
        const raidsData = await raidApi.getAllRaids()
        raids.value = raidsData
      } catch (err) {
        console.warn('레이드 API 실패, 기본값 사용:', err)
        raids.value = [...defaultRaids]
      }
      
      // 캐릭터 데이터 로드
      try {
        const charactersData = await characterApi.getAllCharacters()
        Object.keys(characters).forEach(key => delete characters[key])
        Object.assign(characters, charactersData)
      } catch (err) {
        console.warn('캐릭터 API 실패, 기본값 사용:', err)
        Object.keys(characters).forEach(key => delete characters[key])
        Object.assign(characters, defaultCharacters)
      }
      
      // 스케줄 데이터 로드
      try {
        const schedulesData = await scheduleApi.getAllSchedules()
        
        // 스케줄 데이터를 프론트엔드 형식으로 변환
        const groupedSchedules = {}
        const groupedFinish = {}
        
        schedulesData.forEach(schedule => {
          const key = `${schedule.id}-${schedule.raidName}`
          
          // 스케줄 그룹화
          if (!groupedSchedules[key]) {
            groupedSchedules[key] = []
          }
          
          groupedSchedules[key].push({
            name: schedule.characterName,
            scheduleId: Date.now() + Math.random(),
            raidName: schedule.raidName,
            partyName: schedule.id,
            userId: findCharacterUserId(schedule.characterName, characters),
            isSupporter: findCharacterIsSupporter(schedule.characterName, characters)
          })
          
          // 완료 상태 설정
          if (schedule.isFinish === 'Y') {
            groupedFinish[key] = true
          }
        })
        
        // 상태 업데이트
        schedules.value = groupedSchedules
        scheduleFinish.value = groupedFinish
        
      } catch (err) {
        console.warn('스케줄 API 실패, 빈 상태로 시작:', err)
        schedules.value = {}
        scheduleFinish.value = {}
      }
      
      // 유저 일정 데이터 로드
      try {
        const userSchedulesData = await userScheduleApi.getAllUserSchedules()
        userSchedules.value = userSchedulesData
      } catch (err) {
        console.warn('유저 일정 API 실패, 기본값 사용:', err)
        userSchedules.value = { ...defaultUserSchedules }
      }
      
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      setError('데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 레이드 데이터만 다시 로드하는 함수
  const loadRaids = async () => {
    try {
      const raidsData = await raidApi.getAllRaids()
      raids.value = raidsData
    } catch (err) {
      console.warn('레이드 데이터 로드 실패:', err)
    }
  }

  // 캐릭터 저장 함수 (CharacterSection에서 호출)
  const saveCharacters = async () => {
    let hasCharacterChanges = false
    
    // 새 캐릭터 추가
    if (newCharacters.value.length > 0) {
      try {
        await characterApi.saveAllCharacters(newCharacters.value)
        newCharacters.value = []
        hasCharacterChanges = true
      } catch (err) {
        throw new Error('새 캐릭터 저장에 실패했습니다')
      }
    }
    
    // 캐릭터 삭제
    if (deletedCharacters.value.length > 0) {
      try {
        for (const characterName of deletedCharacters.value) {
          await characterApi.deleteCharacter(characterName)
        }
        deletedCharacters.value = []
        hasCharacterChanges = true
      } catch (err) {
        throw new Error('캐릭터 삭제에 실패했습니다')
      }
    }
    
    return hasCharacterChanges
  }

  // 전체 저장 함수
  const saveAll = async (characterSectionRef) => {
    console.log('🟡 saveAll 함수 시작')
    
    try {
      setLoading(true)
      clearError()
      
      let hasAnyChanges = false
      let savedItems = []
      
      // 1. 캐릭터 저장 (CharacterSection에 위임)
      if (characterSectionRef?.value) {
        const hasCharacterChanges = await characterSectionRef.value.saveCharacters()
        if (hasCharacterChanges) {
          hasAnyChanges = true
          savedItems.push('캐릭터')
        }
      }
      
      // 2. 레이드 추가/삭제 저장
      if (newRaids.value.length > 0 || deletedRaids.value.length > 0) {
        
        // 새 레이드 추가
        if (newRaids.value.length > 0) {
          const savedRaids = raids.value.filter(raid => 
            !newRaids.value.some(newRaid => newRaid.name === raid.name)
          )
          
          const currentMaxSeq = savedRaids.length > 0 
            ? Math.max(...savedRaids.map(raid => raid.seq || 0))
            : 0
          
          for (let i = 0; i < newRaids.value.length; i++) {
            const raid = newRaids.value[i]
            try {
              const raidWithSeq = {
                name: raid.name,
                seq: currentMaxSeq + i + 1
              }
              await raidApi.createRaidWithSeq(raidWithSeq)
            } catch (err) {
              console.error('레이드 추가 실패:', raid.name, err)
              throw new Error(`레이드 '${raid.name}' 추가에 실패했습니다`)
            }
          }
        }
        
        // 레이드 삭제
        for (const raid of deletedRaids.value) {
          try {
            await raidApi.deleteRaid(raid.name)
          } catch (err) {
            console.error('레이드 삭제 실패:', raid.name, err)
            throw new Error(`레이드 '${raid.name}' 삭제에 실패했습니다`)
          }
        }
        
        // 변경 추적 초기화
        newRaids.value = []
        deletedRaids.value = []
        
        // 레이드 목록 다시 로드
        await loadRaids()
        
        hasAnyChanges = true
        savedItems.push('레이드')
      }

      // 3. 레이드 순서 저장
      if (raidOrderChanges.value.length > 0) {
        try {
          await raidApi.updateRaidOrder(raidOrderChanges.value)
          raidOrderChanges.value = []
          hasAnyChanges = true
          savedItems.push('레이드 순서')
        } catch (err) {
          console.error('레이드 순서 저장 실패:', err)
          throw new Error('레이드 순서 저장에 실패했습니다')
        }
      }
      
      // 4. 스케줄 저장
      if (hasScheduleChanges.value) {
        try {
          console.log('저장할 스케줄 데이터:', schedules.value)
          console.log('저장할 완료 상태:', scheduleFinish.value)
          
          await scheduleApi.saveAllSchedules(schedules.value, scheduleFinish.value)
          hasScheduleChanges.value = false
          hasAnyChanges = true
          savedItems.push('스케줄')
        } catch (err) {
          console.error('스케줄 저장 실패:', err)
          throw new Error('스케줄 저장에 실패했습니다')
        }
      }
      
      // 5. 유저 일정 저장
      if (hasUserScheduleChanges.value) {
        try {
          console.log('저장할 유저 일정 데이터:', changedUserSchedules.value)
          
          await userScheduleApi.saveAllUserSchedules(changedUserSchedules.value)
          hasUserScheduleChanges.value = false
          changedUserSchedules.value = []
          hasAnyChanges = true
          savedItems.push('유저 일정')
        } catch (err) {
          console.error('유저 일정 저장 실패:', err)
          throw new Error('유저 일정 저장에 실패했습니다')
        }
      }
      
      // 결과 메시지 표시
      if (hasAnyChanges) {
        console.log('✅ 저장 완료!')
        alert(`저장이 완료되었습니다!\n저장된 항목: ${savedItems.join(', ')}`)
      } else {
        console.log('⚠️ 저장할 변경사항 없음')
        alert('저장할 변경사항이 없습니다.')
      }
      
    } catch (error) {
      console.error('❌ 저장 실패:', error)
      setError(error.message || '저장에 실패했습니다')
      throw error
    } finally {
      console.log('🟡 saveAll 함수 종료')
      setLoading(false)
    }
  }

  // 유저 일정 데이터 로드
  const loadUserSchedules = async () => {
    await utilLoadUserSchedules(userSchedules)
  }

  // 주차 전환 함수
  const advanceWeek = async () => {
    try {
      console.log('주차 전환 API 호출 시작')
      setLoading(true)
      
      // 백엔드 API 호출하여 주차 전환 실행
      await userScheduleApi.advanceWeek()
      
      // 백엔드에서 주차 전환이 완료되면 프론트엔드 데이터도 다시 로드
      await loadUserSchedules()
      
      // 주차 정보 업데이트 (현재 날짜 기준으로 다시 계산)
      weekInfo.value = calculateWeekInfo()
      
      console.log('주차 전환 완료')
      alert('주차 전환이 완료되었습니다!')
      
    } catch (error) {
      console.error('주차 전환 실패:', error)
      alert('주차 전환에 실패했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    // API 통신 함수들
    loadData,
    loadRaids,
    saveCharacters,
    saveAll,
    loadUserSchedules,
    advanceWeek
  }
}
