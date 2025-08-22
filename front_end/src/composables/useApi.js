// useApi composable - API 호출 로직을 관리하는 컴포저블
import { ref, reactive } from 'vue'
import { raidApi, characterApi, scheduleApi } from '@/services/api'

export function useApi() {
  // 로딩 상태 관리
  const isLoading = ref(false)
  const error = ref(null)

  // 에러 처리 헬퍼 함수
  const handleError = (err, fallbackValue = null) => {
    console.error('API Error:', err)
    error.value = err.message || 'An error occurred'
    return fallbackValue
  }

  // 레이드 관련 API 호출
  const loadRaids = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const raidsData = await raidApi.getAllRaids()
      return raidsData
    } catch (err) {
      return handleError(err, ['베히모스', '하기르', '노브', '노르둠'])
    } finally {
      isLoading.value = false
    }
  }

  // 캐릭터 관련 API 호출
  const loadCharacters = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const charactersData = await characterApi.getAllCharacters()
      return charactersData
    } catch (err) {
      return handleError(err, {
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
      })
    } finally {
      isLoading.value = false
    }
  }

  // 스케줄 관련 API 호출
  const loadSchedules = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const schedulesData = await scheduleApi.getAllSchedules()
      return schedulesData
    } catch (err) {
      return handleError(err, [])
    } finally {
      isLoading.value = false
    }
  }

  // 레이드 생성
  const createRaid = async (raidData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await raidApi.createRaid(raidData)
      return result
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 레이드 삭제
  const deleteRaid = async (raidId) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await raidApi.deleteRaid(raidId)
      return result
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 캐릭터 생성
  const createCharacter = async (characterData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await characterApi.createCharacter(characterData)
      return result
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 캐릭터 삭제
  const deleteCharacter = async (characterId) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await characterApi.deleteCharacter(characterId)
      return result
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 스케줄 생성
  const createSchedule = async (scheduleData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await scheduleApi.createSchedule(scheduleData)
      return result
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 스케줄 삭제
  const deleteSchedule = async (scheduleId) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await scheduleApi.deleteSchedule(scheduleId)
      return result
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 모든 데이터를 한 번에 로드하는 헬퍼 함수
  const loadAllData = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const [raidsData, charactersData, schedulesData] = await Promise.all([
        loadRaids(),
        loadCharacters(),
        loadSchedules()
      ])
      
      return {
        raids: raidsData,
        characters: charactersData,
        schedules: schedulesData
      }
    } catch (err) {
      handleError(err)
      return {
        raids: ['베히모스', '하기르', '노브', '노르둠'],
        characters: {},
        schedules: []
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 상태
    isLoading,
    error,
    
    // 데이터 로드
    loadRaids,
    loadCharacters,
    loadSchedules,
    loadAllData,
    
    // CRUD operations
    createRaid,
    deleteRaid,
    createCharacter,
    deleteCharacter,
    createSchedule,
    deleteSchedule
  }
}
