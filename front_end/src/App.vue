<script setup>
import { ref, reactive, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import ScheduleSection from '@/components/ScheduleSection.vue'
import CharacterSection from '@/components/CharacterSection.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import { raidApi, characterApi } from '@/services/api'
import { defaultParties, defaultCharacters, defaultRaids } from '@/utils/constants'

// API 로딩 및 에러 상태 (로컬에서 관리)
const isLoading = ref(false)
const error = ref(null)

// 메인 데이터
const raids = ref([])
const parties = ref([...defaultParties])
const characters = reactive({})
const schedules = ref({})

// 변경 추적
const newCharacters = ref([]) // 새로 추가된 캐릭터들
const deletedCharacters = ref([]) // 삭제할 캐릭터 목록
const modifiedCharacters = ref([]) // 수정된 캐릭터들 (나중에 필요시)

// 데이터 로드 함수들
const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // 변경 추적 상태 초기화
    newCharacters.value = []
    deletedCharacters.value = []
    modifiedCharacters.value = []
    
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
    
    console.log('데이터 로드 완료:', { raids: raids.value, characters })
  } catch (error) {
    console.error('데이터 로드 실패:', error)
    error.value = '데이터를 불러오는데 실패했습니다'
  } finally {
    isLoading.value = false
  }
}

// 컴포넌트가 마운트될 때 데이터 가져오기
onMounted(async () => {
  await loadData()
})

// 스케줄 관련 헬퍼 함수들
const getCharacterRaids = (characterName) => {
  const raidsList = new Set()
  Object.keys(schedules.value).forEach(key => {
    const [party, raid] = key.split('-')
    schedules.value[key].forEach(character => {
      if (character.name === characterName) {
        raidsList.add(raid)
      }
    })
  })
  return Array.from(raidsList)
}

// 캐릭터가 최대 레이드 수에 도달했는지 확인
const isCharacterMaxed = (characterName) => {
  return getCharacterRaids(characterName).length >= 3
}

// 레이드 관련 함수들
const addRaid = (raidName) => {
  if (raidName.trim() && !raids.value.includes(raidName)) {
    raids.value.push(raidName.trim())
  }
}

const deleteRaid = (raidName) => {
  const raidIndex = raids.value.findIndex(raid => raid === raidName)
  if (raidIndex !== -1) {
    raids.value.splice(raidIndex, 1)
    
    // 해당 레이드와 관련된 스케줄도 모두 삭제
    Object.keys(schedules.value).forEach(key => {
      const [party, raid] = key.split('-')
      if (raid === raidName) {
        delete schedules.value[key]
      }
    })
  }
}

// 캐릭터 관련 함수들
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
    
    console.log('캐릭터 로컬 추가 성공:', characterName)
    console.log('새 캐릭터 목록:', newCharacters.value)
  } catch (error) {
    console.error('캐릭터 추가 실패:', error)
    error.value = '캐릭터 추가에 실패했습니다'
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
        console.log('새 캐릭터 삭제:', characterName, '(서버 삭제 불필요)')
      } else {
        // 기존 캐릭터라면 삭제 목록에 추가 (서버에서 삭제 필요)
        deletedCharacters.value.push(characterName)
        console.log('기존 캐릭터 삭제 예약:', characterName)
      }
      
      // 로컬 상태에서 제거
      userCharacters.splice(characterIndex, 1)
    }
  }
}

// 저장 함수
const saveAll = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    console.log('변경사항 저장 시작...')
    console.log('새 캐릭터:', newCharacters.value.length, '개')
    console.log('삭제할 캐릭터:', deletedCharacters.value.length, '개')
    
    // 1. 삭제된 캐릭터들 서버에서 삭제
    if (deletedCharacters.value.length > 0) {
      console.log('삭제할 캐릭터:', deletedCharacters.value)
      for (const characterName of deletedCharacters.value) {
        try {
          await characterApi.deleteCharacter(characterName)
          console.log('캐릭터 삭제 성공:', characterName)
        } catch (err) {
          console.warn('캐릭터 삭제 실패:', characterName, err)
        }
      }
    }
    
    // 2. 새로 추가된 캐릭터들만 서버에 저장
    if (newCharacters.value.length > 0) {
      console.log('새 캐릭터 저장:', newCharacters.value)
      for (const newCharacter of newCharacters.value) {
        try {
          const serverCharacterData = {
            name: newCharacter.name,
            isSupporter: newCharacter.isSupporter ? 'Y' : 'N',
            userId: newCharacter.userId,
            seq: newCharacter.seq
          }
          
          await characterApi.createCharacter(serverCharacterData)
          console.log('새 캐릭터 저장 성공:', newCharacter.name)
        } catch (err) {
          console.error('새 캐릭터 저장 실패:', newCharacter.name, err)
          throw new Error(`캐릭터 "${newCharacter.name}" 저장에 실패했습니다`)
        }
      }
    }
    
    // 3. 성공 후 변경 추적 목록들 초기화
    newCharacters.value = []
    deletedCharacters.value = []
    modifiedCharacters.value = []
    
    console.log('모든 변경사항 저장 완료!')
    
    // TODO: raids, schedules 저장 기능은 추후 구현
    if (raids.value.length > 0 || Object.keys(schedules.value).length > 0) {
      console.log('레이드, 스케줄 저장은 추후 구현 예정:', {
        raids: raids.value,
        schedules: schedules.value
      })
    }
    
  } catch (error) {
    console.error('저장 실패:', error)
    error.value = error.message || '저장에 실패했습니다'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="app">
    <LoadingSpinner v-if="isLoading" />
    <ErrorMessage v-if="error" :message="error" />
    
    <AppHeader />
    
    <div class="container">
      <ScheduleSection 
        :raids="raids"
        :parties="parties"
        :schedules="schedules"
        :getCharacterRaids="getCharacterRaids"
        @add-raid="addRaid"
        @delete-raid="deleteRaid"
      />
      
      <CharacterSection 
        :characters="characters"
        :isCharacterMaxed="isCharacterMaxed"
        @add-character="addCharacter"
        @delete-character="deleteCharacter"
      />
      
      <div class="action-buttons">
        <button class="save-btn" @click="saveAll">저장</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.action-buttons {
  text-align: right;
  margin-bottom: 2rem;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>
