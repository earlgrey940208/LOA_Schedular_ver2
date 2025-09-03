import { ref, reactive, computed } from 'vue'
import { defaultParties } from '@/utils/constants'
import { calculateWeekInfo } from '@/utils/weekUtils'

export function useAppData() {
  // API 로딩 및 에러 상태
  const isLoading = ref(false)
  const error = ref(null)

  // 메인 데이터
  const raids = ref([])
  const parties = ref([...defaultParties])
  const characters = reactive({})
  const schedules = ref({})
  const scheduleFinish = ref({}) // 스케줄 완료 상태 관리 {party-raid: true/false}
  const userSchedules = ref({}) // 유저 일정 데이터
  const users = ref([]) // 유저 목록

  // 변경 추적
  const newCharacters = ref([]) // 새로 추가된 캐릭터들
  const deletedCharacters = ref([]) // 삭제할 캐릭터 목록
  const modifiedCharacters = ref([]) // 수정된 캐릭터들 (나중에 필요시)
  const raidOrderChanges = ref([]) // 레이드 순서 변경 목록
  const newRaids = ref([]) // 새로 추가된 레이드들
  const deletedRaids = ref([]) // 삭제할 레이드 목록
  const hasScheduleChanges = ref(false) // 스케줄 변경 여부
  const hasUserScheduleChanges = ref(false) // 유저 일정 변경 여부
  const changedUserSchedules = ref([]) // 변경된 유저 일정들만 추적

  const weekInfo = ref(calculateWeekInfo())

  // 변경사항이 있는지 확인하는 computed
  const hasChanges = computed(() => {
    const result = newCharacters.value.length > 0 || 
           deletedCharacters.value.length > 0 || 
           raidOrderChanges.value.length > 0 || 
           newRaids.value.length > 0 || 
           deletedRaids.value.length > 0 ||
           hasScheduleChanges.value ||
           hasUserScheduleChanges.value
    
    return result
  })

  const totalChanges = computed(() => {
    let total = newCharacters.value.length + 
                deletedCharacters.value.length + 
                raidOrderChanges.value.length + 
                newRaids.value.length + 
                deletedRaids.value.length
    if (hasScheduleChanges.value) total += 1
    if (hasUserScheduleChanges.value) total += 1
    return total
  })

  // 데이터 초기화 함수들
  const resetCharacterChanges = () => {
    newCharacters.value = []
    deletedCharacters.value = []
    modifiedCharacters.value = []
  }

  const resetRaidChanges = () => {
    raidOrderChanges.value = []
    newRaids.value = []
    deletedRaids.value = []
  }

  const resetDataScheduleChanges = () => {
    hasScheduleChanges.value = false
  }

  const resetDataUserScheduleChanges = () => {
    hasUserScheduleChanges.value = false
    changedUserSchedules.value = []
  }

  const resetAllChanges = () => {
    resetCharacterChanges()
    resetRaidChanges()
    resetDataScheduleChanges()
    resetDataUserScheduleChanges()
  }

  // 에러 및 로딩 상태 관리
  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const setError = (errorMessage) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  // 주간 정보 업데이트
  const updateWeekInfo = () => {
    weekInfo.value = calculateWeekInfo()
  }

  return {
    // 상태
    isLoading,
    error,
    raids,
    parties,
    characters,
    schedules,
    scheduleFinish,
    userSchedules,
    users,
    newCharacters,
    deletedCharacters,
    modifiedCharacters,
    raidOrderChanges,
    newRaids,
    deletedRaids,
    hasScheduleChanges,
    hasUserScheduleChanges,
    changedUserSchedules,
    weekInfo,

    // computed
    hasChanges,
    totalChanges,

    // 메서드
    resetCharacterChanges,
    resetRaidChanges,
    resetDataScheduleChanges,
    resetDataUserScheduleChanges,
    resetAllChanges,
    setLoading,
    setError,
    clearError,
    updateWeekInfo
  }
}
