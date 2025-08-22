// API 서비스 모듈
const API_BASE_URL = 'http://localhost:8080/api'

// 기본 fetch 설정
const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// API 응답 처리 헬퍼 함수
const handleResponse = async (response) => {
  if (response.ok) {
    return await response.json()
  } else {
    throw new Error(`HTTP Error: ${response.status}`)
  }
}

// 레이드 관련 API
export const raidApi = {
  // 모든 레이드 조회
  getAllRaids: async () => {
    try {
      console.log('API 호출 시작: getAllRaids')
      const response = await fetch(`${API_BASE_URL}/Raid`, fetchConfig)
      console.log('레이드 응답 상태:', response.status)
      
      const data = await handleResponse(response)
      console.log('받은 레이드 데이터:', data)
      return data.map(raid => raid.name)
    } catch (error) {
      console.error('Error fetching raids:', error)
      // 기본값 반환
      return ['베히모스', '하기르', '노브', '노르둠']
    }
  },

  // 레이드 생성
  createRaid: async (raidData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Raid`, {
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

  // 레이드 삭제
  deleteRaid: async (raidId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Raid/${raidId}`, {
        ...fetchConfig,
        method: 'DELETE'
      })
      return response.ok
    } catch (error) {
      console.error('Error deleting raid:', error)
      throw error
    }
  }
}

// 캐릭터 관련 API
export const characterApi = {
  // 모든 캐릭터 조회
  getAllCharacters: async () => {
    try {
      console.log('API 호출 시작: getAllCharacters')
      const response = await fetch(`${API_BASE_URL}/charactors`, fetchConfig)
      console.log('캐릭터 응답 상태:', response.status)
      
      const data = await handleResponse(response)
      console.log('받은 캐릭터 데이터:', data)
      
      // 캐릭터 데이터를 user_id별로 그룹화
      const groupedCharacters = {}
      
      data.forEach(character => {
        const userId = character.userId
        
        if (!groupedCharacters[userId]) {
          groupedCharacters[userId] = []
        }
        
        groupedCharacters[userId].push({
          name: character.name,
          isSupporter: character.isSupporter === 'Y',
          userId: character.userId
        })
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
        body: JSON.stringify(characterData)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Error creating character:', error)
      throw error
    }
  },

  // 캐릭터 삭제
  deleteCharacter: async (characterId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/charactors/${characterId}`, {
        ...fetchConfig,
        method: 'DELETE'
      })
      return response.ok
    } catch (error) {
      console.error('Error deleting character:', error)
      throw error
    }
  }
}

// 스케줄 관련 API
export const scheduleApi = {
  // 모든 스케줄 조회
  getAllSchedules: async () => {
    try {
      console.log('API 호출 시작: getAllSchedules')
      const response = await fetch(`${API_BASE_URL}/Schedule`, fetchConfig)
      console.log('스케줄 응답 상태:', response.status)
      
      const data = await handleResponse(response)
      console.log('받은 스케줄 데이터:', data)
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
  }
}

// 전체 API 객체 내보내기
export const api = {
  raid: raidApi,
  character: characterApi,
  schedule: scheduleApi
}

export default api
