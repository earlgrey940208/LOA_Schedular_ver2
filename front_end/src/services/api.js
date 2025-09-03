// API 서비스 모듈
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Docker/프로덕션 환경에서는 nginx proxy 사용
  : 'http://localhost:19013/api'  // 개발 환경 (포트 19013로 변경)

// 기본 fetch 설정
const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// 프론트엔드 → 백엔드 변환 (boolean → String)
const convertToBackend = (character) => {
  return {
    ...character,
    isSupporter: character.isSupporter ? 'Y' : 'N'
  }
}

// 백엔드 → 프론트엔드 변환 (String → boolean)
const convertToFrontend = (character) => {
  return {
    ...character,
    isSupporter: character.isSupporter === 'Y'
  }
}

// API 응답 처리 헬퍼 함수
const handleResponse = async (response) => {
  if (response.ok) {
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    } else {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return { message: text }
      }
    }
  } else {
    const errorText = await response.text()
    try {
      const errorJson = JSON.parse(errorText)
      throw new Error(errorJson.error || errorJson.message || `HTTP Error: ${response.status}`)
    } catch {
      throw new Error(`HTTP Error: ${response.status} - ${errorText}`)
    }
  }
}

// 레이드 관련 API
export const raidApi = {
  // 모든 레이드 조회
  getAllRaids: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/raid`, fetchConfig)
      
      const data = await handleResponse(response)
      
      // seq 순으로 정렬하여 반환
      return data.sort((a, b) => a.seq - b.seq)
    } catch (error) {
      console.error('Error fetching raids:', error)
      // 기본값 반환 (seq 포함)
      return [
        { name: '베히모스', seq: 1 },
        { name: '하기르', seq: 2 },
        { name: '노브', seq: 3 },
        { name: '노르둠', seq: 4 }
      ]
    }
  },

  // 레이드 생성
  createRaid: async (raidName) => {
    try {
      // seq는 백엔드에서 자동 설정되도록 name만 전송
      const raidData = { name: raidName }
      const response = await fetch(`${API_BASE_URL}/raid`, {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify(raidData)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error creating raid:', error)
      throw error
    }
  },

  // 레이드 생성 (seq 지정)
  createRaidWithSeq: async (raidData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/raid`, {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify(raidData)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error creating raid with seq:', error)
      throw error
    }
  },

  // 레이드 삭제
  deleteRaid: async (raidName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/raid/${encodeURIComponent(raidName)}`, {
        ...fetchConfig,
        method: 'DELETE'
      })
      return response.ok
    } catch (error) {
      console.error('Error deleting raid:', error)
      throw error
    }
  },

  // 레이드 순서 업데이트 (seq swap)
  updateRaidOrder: async (raidUpdates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/raid/order`, {
        ...fetchConfig,
        method: 'PUT',
        body: JSON.stringify(raidUpdates)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error updating raid order:', error)
      throw error
    }
  },

  // 개별 레이드 순서 업데이트 (즉시 저장용)
  updateRaidOrderSingle: async (raidName, newSeq) => {
    try {
      const response = await fetch(`${API_BASE_URL}/raid/${encodeURIComponent(raidName)}/order`, {
        ...fetchConfig,
        method: 'PUT',
        body: JSON.stringify({ seq: newSeq })
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error updating single raid order:', error)
      throw error
    }
  }
}

// 캐릭터 관련 API
export const characterApi = {
  // 모든 캐릭터 조회
  getAllCharacters: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/charactors`, fetchConfig)
      
      const data = await handleResponse(response)
      
      // 캐릭터 데이터를 user_id별로 그룹화
      const groupedCharacters = {}
      
      data.forEach(character => {
        const userId = character.userId
        
        if (!groupedCharacters[userId]) {
          groupedCharacters[userId] = []
        }
        
        groupedCharacters[userId].push(convertToFrontend(character))
      })
      
      return groupedCharacters
    } catch (error) {
      console.error('Error fetching characters:', error)
      // 기본값 반환
      return {
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
      }
    }
  },

  // 캐릭터 생성
  createCharacter: async (characterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/charactors`, {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify(convertToBackend(characterData))
      })
      return convertToFrontend(await handleResponse(response))
    } catch (error) {
      console.error('Error creating character:', error)
      throw error
    }
  },

  // 캐릭터 삭제 (이름 기반)
  deleteCharacter: async (characterName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/charactors/${encodeURIComponent(characterName)}`, {
        ...fetchConfig,
        method: 'DELETE'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error deleting character:', error)
      throw error
    }
  },

  // 캐릭터 업데이트 (개별 저장용)
  updateCharacter: async (characterName, characterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/charactors/${encodeURIComponent(characterName)}`, {
        ...fetchConfig,
        method: 'PUT',
        body: JSON.stringify(convertToBackend(characterData))
      })
      return convertToFrontend(await handleResponse(response))
    } catch (error) {
      console.error('Error updating character:', error)
      throw error
    }
  },

  // 캐릭터 일괄 저장
  saveAllCharacters: async (characters) => {
    try {
      const backendCharacters = characters.map(convertToBackend)
      const response = await fetch(`${API_BASE_URL}/charactors/batch`, {
        ...fetchConfig,
        method: 'PUT',
        body: JSON.stringify(backendCharacters)
      })
      const result = await handleResponse(response)
      return result.map(convertToFrontend)
    } catch (error) {
      console.error('Error saving all characters:', error)
      throw error
    }
  }
}

// 스케줄 관련 API
export const scheduleApi = {
  // 모든 스케줄 조회
  getAllSchedules: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Schedule`, fetchConfig)
      
      const data = await handleResponse(response)
      return data
    } catch (error) {
      console.error('Error fetching schedules:', error)
      return []
    }
  },

  // 스케줄 생성
  createSchedule: async (scheduleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Schedule`, {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify(scheduleData)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error creating schedule:', error)
      throw error
    }
  },

  // 스케줄 일괄 저장 (프론트엔드 전체 스케줄 저장)
  saveAllSchedules: async (schedules, scheduleFinish) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Schedule/batch`, {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify({
          schedules: schedules,
          scheduleFinish: scheduleFinish
        })
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error saving all schedules:', error)
      throw error
    }
  },

  // 스케줄 완료 상태 업데이트
  updateScheduleFinish: async (partyName, raidName, isFinish) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Schedule/finish/${encodeURIComponent(partyName)}/${encodeURIComponent(raidName)}`, {
        ...fetchConfig,
        method: 'PUT',
        body: JSON.stringify({ isFinish: isFinish })
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error updating schedule finish:', error)
      throw error
    }
  },

  // 스케줄 삭제
  deleteSchedule: async (scheduleId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Schedule/${scheduleId}`, {
        ...fetchConfig,
        method: 'DELETE'
      })
      return response.ok
    } catch (error) {
      console.error('Error deleting schedule:', error)
      throw error
    }
  },

  // 특정 파티와 레이드의 스케줄 삭제
  deleteScheduleByPartyAndRaid: async (partyName, raidName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Schedule/party/${encodeURIComponent(partyName)}/raid/${encodeURIComponent(raidName)}`, {
        ...fetchConfig,
        method: 'DELETE'
      })
      return response.ok
    } catch (error) {
      console.error('Error deleting schedule by party and raid:', error)
      throw error
    }
  },

  // 특정 파티-레이드 조합의 모든 스케줄 삭제 (개별 저장용)
  deleteSchedulesByPartyAndRaid: async (partyName, raidName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Schedule/party/${encodeURIComponent(partyName)}/raid/${encodeURIComponent(raidName)}`, {
        ...fetchConfig,
        method: 'DELETE'
      })
      return response.ok
    } catch (error) {
      console.error('Error deleting schedules by party and raid:', error)
      throw error
    }
  }
}

// 전체 API 객체 내보내기
export const api = {
  raid: raidApi,
  character: characterApi,
  schedule: scheduleApi
}

// 유저 API
export const userApi = {
  // 모든 유저 조회
  getAllUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, fetchConfig)
      const data = await handleResponse(response)
      return data
    } catch (error) {
      console.error('Error fetching all users:', error)
      // 기본 유저 데이터 반환
      return [
        { name: '혀니', color: '#9d4edd' },
        { name: '샷건', color: '#f4d03f' },
        { name: '도당', color: '#85c1e9' }
      ]
    }
  },

  // 특정 유저 조회
  getUserByName: async (name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${encodeURIComponent(name)}`, fetchConfig)
      return await handleResponse(response)
    } catch (error) {
      console.error(`Error fetching user ${name}:`, error)
      throw error
    }
  },

  // 유저 생성
  createUser: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify(userData)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  // 유저 수정
  updateUser: async (name, userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${encodeURIComponent(name)}`, {
        ...fetchConfig,
        method: 'PUT',
        body: JSON.stringify(userData)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  // 유저 삭제
  deleteUser: async (name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${encodeURIComponent(name)}`, {
        ...fetchConfig,
        method: 'DELETE'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }
}

// 유저 일정 API
export const userScheduleApi = {
  // 모든 유저 일정 조회
  getAllUserSchedules: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user_schedule`, fetchConfig)
      const data = await handleResponse(response)
      return transformToFrontendFormat(data)
    } catch (error) {
      console.error('Error fetching all user schedules:', error)
      return handleError(error, {})
    }
  },

  // 특정 유저 일정 조회
  getUserSchedules: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user_schedule/${encodeURIComponent(userId)}`, fetchConfig)
      return await handleResponse(response)
    } catch (error) {
      console.error(`Error fetching user schedules for ${userId}:`, error)
      throw error
    }
  },

  // 일정 저장 (생성/업데이트)
  saveUserSchedule: async (userId, dayOfWeek, scheduleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user_schedule`, {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify({
          userId,
          dayOfWeek,
          scheduleText: scheduleData.text || '',
          enabled: scheduleData.isEnabled ? 'Y' : 'N'
        })
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error saving user schedule:', error)
      throw error
    }
  },

  // 전체 일정 일괄 저장
  saveAllUserSchedules: async (userSchedules) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user_schedule/batch`, {
      ...fetchConfig,
      method: 'POST',
      body: JSON.stringify(userSchedules)  // 직접 전송
    })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error saving all user schedules:', error)
      throw error
    }
  },

  // 일정 삭제
  deleteUserSchedule: async (userId, dayOfWeek) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user_schedule/${encodeURIComponent(userId)}/${encodeURIComponent(dayOfWeek)}`, {
        ...fetchConfig,
        method: 'DELETE'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error deleting user schedule:', error)
      throw error
    }
  },

  // 주차 전환 (2주차 → 1주차, 기존 1주차 삭제)
  advanceWeek: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user_schedule/advance-week`, {
        ...fetchConfig,
        method: 'POST'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error advancing week:', error)
      throw error
    }
  },

  // 개별 유저 스케줄 저장 (즉시 저장용)
  saveUserSchedule: async (userScheduleData) => {
    try {
      const { userId, day, weekNumber, text, isEnabled } = userScheduleData
      
      const requestData = {
        userId,
        dayOfWeek: day,
        weekNumber,
        scheduleText: text || '',
        enabled: isEnabled ? 'Y' : 'N'
      }
      
      const response = await fetch(`${API_BASE_URL}/user_schedule/single`, {
        ...fetchConfig,
        method: 'POST',
        body: JSON.stringify(requestData)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error saving single user schedule:', error)
      throw error
    }
  }
}

// 백엔드 데이터를 프론트엔드 형식으로 변환 (2주차 시스템)
const transformToFrontendFormat = (backendData) => {
  const userSchedules = {}
  backendData.forEach(schedule => {
    if (!userSchedules[schedule.userId]) {
      userSchedules[schedule.userId] = {
        week1: {},
        week2: {}
      }
    }
    
    const weekKey = `week${schedule.weekNumber || 1}`
    if (!userSchedules[schedule.userId][weekKey]) {
      userSchedules[schedule.userId][weekKey] = {}
    }
    
    // dayOfWeek는 한글로 저장됨
    userSchedules[schedule.userId][weekKey][schedule.dayOfWeek] = {
      text: schedule.scheduleText || '',
      isEnabled: schedule.enabled === 'Y'
    }
  })
  return userSchedules
}

const transformToBackendFormat = (userSchedules) => {
  const scheduleList = []
  Object.keys(userSchedules).forEach(userId => {
    Object.keys(userSchedules[userId]).forEach(weekKey => {
      if (weekKey.startsWith('week')) {
        const weekNumber = parseInt(weekKey.replace('week', ''))
        Object.keys(userSchedules[userId][weekKey]).forEach(dayOfWeek => {
          const schedule = userSchedules[userId][weekKey][dayOfWeek]
          scheduleList.push({
            userId,
            dayOfWeek, // 한글 요일 그대로 사용
            weekNumber,
            scheduleText: schedule.text || '',
            enabled: schedule.isEnabled ? 'Y' : 'N'
          })
        })
      }
    })
  })
  return scheduleList
}

export default api
