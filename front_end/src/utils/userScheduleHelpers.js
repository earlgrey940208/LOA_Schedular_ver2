// 유저 일정 관련 헬퍼 함수들
import { userScheduleApi } from '@/services/api'
import { defaultUserSchedules } from '@/utils/constants'

// 유저 일정 데이터 로드 함수
export const loadUserSchedules = async (userSchedules) => {
  try {
    const userSchedulesData = await userScheduleApi.getAllUserSchedules()
    userSchedules.value = userSchedulesData
  } catch (err) {
    console.warn('유저 일정 API 실패, 기본값 사용:', err)
    userSchedules.value = { ...defaultUserSchedules }
  }
}
