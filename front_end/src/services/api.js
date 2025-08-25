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
        
        groupedCharacters[userId].push({
          name: character.name,
          isSupporter: character.isSupporter === 'Y',
          userId: character.userId,
          seq: character.seq
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

  // 캐릭터 삭제 (이름 기반)
  deleteCharacter: async (characterName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/charactors/${encodeURIComponent(characterName)}`, {
        ...fetchConfig,
        method: 'DELETE'
      })
      return response.ok
    } catch (error) {
      console.error('Error deleting character:', error)
      throw error
    }
  },

  // 캐릭터 삭제 (이름 기반) - 중복 제거됨
  deleteCharacterByName: async (characterName) => {
    return characterApi.deleteCharacter(characterName)
  },

  // 캐릭터 일괄 저장
  saveAllCharacters: async (characters) => {
    try {
      const response = await fetch(`${API_BASE_URL}/charactors/batch`, {
        ...fetchConfig,
        method: 'PUT',
        body: JSON.stringify(characters)
      })
      return await handleResponse(response)
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
