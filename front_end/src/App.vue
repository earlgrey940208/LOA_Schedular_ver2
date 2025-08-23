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

// 데이터 로드 함수들
const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
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
const addCharacter = (userName, characterName) => {
  if (!characters[userName]) {
    characters[userName] = []
  }
  
  const userCharacters = characters[userName]
  const userId = userCharacters[0]?.userId || userName
  
  characters[userName].push({
    name: characterName,
    isSupporter: false,
    userId: userId
  })
}

const deleteCharacter = (userName, characterName) => {
  const userCharacters = characters[userName]
  if (userCharacters) {
    const characterIndex = userCharacters.findIndex(char => char.name === characterName)
    if (characterIndex !== -1) {
      userCharacters.splice(characterIndex, 1)
    }
  }
}

// 저장 함수
const saveAll = () => {
  console.log('저장 기능 구현 예정:', {
    raids: raids.value,
    characters,
    schedules: schedules.value
  })
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
