<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import ScheduleSection from '@/components/ScheduleSection.vue'
import CharacterSection from '@/components/CharacterSection.vue'
import UserScheduleSection from '@/components/UserScheduleSection.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import { raidApi, characterApi, scheduleApi } from '@/services/api'
import { userScheduleApi, userApi } from '@/services/api'
import { defaultParties, defaultCharacters, defaultRaids, defaultUserSchedules, updateUserColors } from '@/utils/constants'
import { useDragDrop } from '@/composables/useDragDrop'

// API 로딩 및 에러 상태 (로컬에서 관리)
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
  let total = newCharacters.value.length + deletedCharacters.value.length + raidOrderChanges.value.length + newRaids.value.length + deletedRaids.value.length
  if (hasScheduleChanges.value) total += 1
  if (hasUserScheduleChanges.value) total += 1
  return total
})

// 드래그&드롭 기능
const {
  draggedCharacter,
  dragState,
  onCharacterDragStart,
  onRaidDragStart,
  onPartyDragStart,
  onCharacterOrderDragStart,
  onDragOver,
  onRaidDrop,
  onPartyDrop,
  onCharacterOrderDrop,
  onScheduleDrop: originalOnScheduleDrop,
  onRightClick: originalOnRightClick,
  resetDragState
} = useDragDrop()

// 래핑된 드래그&드롭 함수들
const onScheduleDrop = (event, party, raid, schedules, getCharacterRaids) => {
  const result = originalOnScheduleDrop(event, party, raid, schedules, getCharacterRaids, isScheduleFinished, markScheduleAsChanged)
  return result
}

const onRightClick = (event, party, raid, characterIndex, schedules) => {
  const result = originalOnRightClick(event, party, raid, characterIndex, schedules, toggleScheduleFinish, isScheduleFinished, markScheduleAsChanged)
  return result
}

// 데이터 로드 함수들
const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // 변경 추적 상태 초기화
    newCharacters.value = []
    deletedCharacters.value = []
    modifiedCharacters.value = []
    raidOrderChanges.value = []
    resetScheduleChanges()
    hasUserScheduleChanges.value = false
    
    // 유저 데이터 로드 (다른 데이터보다 먼저 로드)
    try {
      const usersData = await userApi.getAllUsers()
      users.value = usersData
      // 유저 색상 정보 업데이트
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
          scheduleId: Date.now() + Math.random(), // 임시 ID
          raidName: schedule.raidName,
          partyName: schedule.id,
          // 캐릭터 정보는 characters에서 찾아서 추가
          userId: findCharacterUserId(schedule.characterName),
          isSupporter: findCharacterIsSupporter(schedule.characterName)
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
const getScheduledCharacters = (party, raid) => {
  const key = `${party}-${raid}`
  const result = schedules.value[key] || []
  return result
}

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

// 스케줄 완료 상태 관리 함수들
const isScheduleFinished = (party, raid) => {
  const key = `${party}-${raid}`
  return scheduleFinish.value[key] || false
}

const toggleScheduleFinish = (party, raid) => {
  const key = `${party}-${raid}`
  scheduleFinish.value[key] = !scheduleFinish.value[key]
}

// 캐릭터가 최대 레이드 수에 도달했는지 확인
const isCharacterMaxed = (characterName) => {
  return getCharacterRaids(characterName).length >= 3
}

// 레이드 관련 함수들
const addRaid = (raidName) => {
  if (raidName.trim() && !raids.value.some(raid => raid.name === raidName)) {
    // 현재 저장된 레이드들만 고려 (newRaids는 제외)
    const savedRaids = raids.value.filter(raid => 
      !newRaids.value.some(newRaid => newRaid.name === raid.name)
    )
    
    const maxSeq = savedRaids.length > 0 
      ? Math.max(...savedRaids.map(raid => raid.seq || 0))
      : 0
    
    // 이미 추가된 새 레이드들의 개수를 고려
    const newSeq = maxSeq + newRaids.value.length + 1
    
    const newRaid = {
      name: raidName.trim(),
      seq: newSeq
    }
    
    // 화면에 즉시 추가
    raids.value.push(newRaid)
    
    // 변경 추적에 추가
    newRaids.value.push(newRaid)
    
  } else {
    console.warn('레이드 추가 실패 - 이미 존재하거나 빈 이름:', raidName)
  }
}

const deleteRaid = (raidName) => {
  const raidIndex = raids.value.findIndex(raid => raid.name === raidName)
  if (raidIndex !== -1) {
    const deletedRaid = raids.value[raidIndex]
    
    // 화면에서 즉시 삭제
    raids.value.splice(raidIndex, 1)
    
    // 해당 레이드와 관련된 스케줄도 모두 삭제
    Object.keys(schedules.value).forEach(key => {
      const [party, raid] = key.split('-')
      if (raid === raidName) {
        delete schedules.value[key]
      }
    })
    
    // 변경 추적에 추가 (새로 추가된 레이드인지 확인)
    const newRaidIndex = newRaids.value.findIndex(raid => raid.name === raidName)
    if (newRaidIndex !== -1) {
      // 새로 추가된 레이드를 삭제하는 경우 - newRaids에서만 제거
      newRaids.value.splice(newRaidIndex, 1)
    } else {
      // 기존 레이를 삭제하는 경우 - deletedRaids에 추가
      deletedRaids.value.push(deletedRaid)
    }
    
  } else {
    console.warn('삭제할 레이드를 찾을 수 없음:', raidName)
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
      } else {
        // 기존 캐릭터라면 삭제 목록에 추가 (서버에서 삭제 필요)
        deletedCharacters.value.push(characterName) // 이름만 저장
      }
      
      // 로컬 상태에서 제거
      userCharacters.splice(characterIndex, 1)
    } else {
      console.warn('❌ 캐릭터를 찾을 수 없음:', characterName)
    }
  } else {
    console.warn('❌ 사용자를 찾을 수 없음:', userName)
  }
}

// 캐릭터 정보를 찾는 헬퍼 함수들
const findCharacterUserId = (characterName) => {
  for (const [userId, userCharacters] of Object.entries(characters)) {
    if (userCharacters.some(char => char.name === characterName)) {
      return userId
    }
  }
  return 'Unknown' // 찾지 못한 경우 기본값
}

const findCharacterIsSupporter = (characterName) => {
  for (const userCharacters of Object.values(characters)) {
    const character = userCharacters.find(char => char.name === characterName)
    if (character) {
      return character.isSupporter
    }
  }
  return false // 찾지 못한 경우 기본값
}

// 레이드 순서 변경 함수
const swapRaidOrder = (fromIndex, toIndex) => {
  if (fromIndex === toIndex) return
  
  // 로컬 배열에서 순서 변경
  const raid1 = raids.value[fromIndex]
  const raid2 = raids.value[toIndex]
  
  // seq 값 교환
  const tempSeq = raid1.seq
  raid1.seq = raid2.seq
  raid2.seq = tempSeq
  
  // 배열 순서 변경
  raids.value.splice(fromIndex, 1, raid2)
  raids.value.splice(toIndex, 1, raid1)
  
  // 변경 사항 추적에 추가
  const changeIndex = raidOrderChanges.value.findIndex(change => 
    change.name === raid1.name || change.name === raid2.name
  )
  
  if (changeIndex !== -1) {
    // 기존 변경사항 업데이트
    raidOrderChanges.value[changeIndex] = { name: raid1.name, seq: raid1.seq }
    raidOrderChanges.value.push({ name: raid2.name, seq: raid2.seq })
  } else {
    // 새로운 변경사항 추가
    raidOrderChanges.value.push(
      { name: raid1.name, seq: raid1.seq },
      { name: raid2.name, seq: raid2.seq }
    )
  }
}

// 저장 함수 - CharacterSection에 캐릭터 저장을 위임하는 방식
const characterSectionRef = ref(null)

const saveAll = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    let hasAnyChanges = false
    let savedItems = []
    
    // 1. 캐릭터 저장 (CharacterSection에 위임)
    if (characterSectionRef.value) {
      const hasCharacterChanges = await characterSectionRef.value.saveCharacters()
      if (hasCharacterChanges) {
        hasAnyChanges = true
        savedItems.push('캐릭터')
      }
    }
    
    // 2. 레이드 추가/삭제 저장
    if (newRaids.value.length > 0 || deletedRaids.value.length > 0) {
      
      // 새 레이드 추가 (seq 충돌 방지를 위해 미리 계산)
      if (newRaids.value.length > 0) {
        // 현재 저장된 레이드들만 고려 (newRaids는 제외)
        const savedRaids = raids.value.filter(raid => 
          !newRaids.value.some(newRaid => newRaid.name === raid.name)
        )
        
        const currentMaxSeq = savedRaids.length > 0 
          ? Math.max(...savedRaids.map(raid => raid.seq || 0))
          : 0
        
        for (let i = 0; i < newRaids.value.length; i++) {
          const raid = newRaids.value[i]
          try {
            // seq를 미리 계산해서 전송 (현재 최대값 + 인덱스 + 1)
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
        raidOrderChanges.value = [] // 저장 후 초기화
        hasAnyChanges = true
        savedItems.push('레이드 순서')
      } catch (err) {
        console.error('레이드 순서 저장 실패:', err)
        throw new Error('레이드 순서 저장에 실패했습니다')
      }
    }
    
    // 4. 스케줄 저장 (간단화된 로직)
    if (hasScheduleChanges.value) {
      try {
        console.log('저장할 스케줄 데이터:', schedules.value)
        console.log('저장할 완료 상태:', scheduleFinish.value)
        
        await scheduleApi.saveAllSchedules(schedules.value, scheduleFinish.value)
        hasScheduleChanges.value = false // 저장 후 초기화
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
        console.log('저장할 유저 일정 데이터:', userSchedules.value)
        
        await userScheduleApi.saveAllUserSchedules(userSchedules.value)
        hasUserScheduleChanges.value = false // 저장 후 초기화
        hasAnyChanges = true
        savedItems.push('유저 일정')
      } catch (err) {
        console.error('유저 일정 저장 실패:', err)
        throw new Error('유저 일정 저장에 실패했습니다')
      }
    }
    
    // 결과 메시지 표시
    if (hasAnyChanges) {
      alert(`저장이 완료되었습니다!\n저장된 항목: ${savedItems.join(', ')}`)
    } else {
      alert('저장할 변경사항이 없습니다.')
    }
    
  } catch (error) {
    console.error('저장 실패:', error)
    error.value = error.message || '저장에 실패했습니다'
  } finally {
    isLoading.value = false
  }
}

// 스케줄 변경사항 추적 함수들
const markScheduleAsChanged = () => {
  hasScheduleChanges.value = true
}

const resetScheduleChanges = () => {
  hasScheduleChanges.value = false
}

// 유저 일정 관련 함수들
const updateUserScheduleText = (userId, dayOfWeek, text) => {
  if (!userSchedules.value[userId]) {
    userSchedules.value[userId] = {}
  }
  if (!userSchedules.value[userId][dayOfWeek]) {
    userSchedules.value[userId][dayOfWeek] = { text: '', isEnabled: true }
  }
  userSchedules.value[userId][dayOfWeek].text = text
  hasUserScheduleChanges.value = true
}

const toggleUserScheduleEnabled = (userId, dayOfWeek) => {
  if (!userSchedules.value[userId]) {
    userSchedules.value[userId] = {}
  }
  if (!userSchedules.value[userId][dayOfWeek]) {
    userSchedules.value[userId][dayOfWeek] = { text: '', isEnabled: true }
  }
  userSchedules.value[userId][dayOfWeek].isEnabled = !userSchedules.value[userId][dayOfWeek].isEnabled
  hasUserScheduleChanges.value = true
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
        :scheduleFinish="scheduleFinish"
        :getScheduledCharacters="getScheduledCharacters"
        :getCharacterRaids="getCharacterRaids"
        :isScheduleFinished="isScheduleFinished"
        :toggleScheduleFinish="toggleScheduleFinish"
        :onDragOver="onDragOver"
        :onScheduleDrop="onScheduleDrop"
        :onRightClick="onRightClick"
        :onRaidDragStart="onRaidDragStart"
        :onRaidDrop="onRaidDrop"
        :onPartyDragStart="onPartyDragStart"
        :onPartyDrop="onPartyDrop"
        @add-raid="addRaid"
        @delete-raid="deleteRaid"
        @swap-raid-order="swapRaidOrder"
      />
      
      <CharacterSection 
        ref="characterSectionRef"
        :characters="characters"
        :isCharacterMaxed="isCharacterMaxed"
        :newCharacters="newCharacters"
        :deletedCharacters="deletedCharacters"
        :onCharacterDragStart="onCharacterDragStart"
        :onCharacterOrderDragStart="onCharacterOrderDragStart"
        :onCharacterOrderDrop="onCharacterOrderDrop"
        :onDragOver="onDragOver"
        @add-character="addCharacter"
        @delete-character="deleteCharacter"
        @update:newCharacters="(value) => newCharacters = value"
        @update:deletedCharacters="(value) => deletedCharacters = value"
      />
      
      <UserScheduleSection 
        :userSchedules="userSchedules"
        :users="users"
        @update-schedule-text="updateUserScheduleText"
        @toggle-enabled="toggleUserScheduleEnabled"
      />
      
      <div class="action-buttons">
        <button class="save-btn" @click="saveAll" :disabled="!hasChanges">
          <span v-if="hasChanges">
            저장 ({{ totalChanges }}개 변경)
          </span>
          <span v-else>
            저장
          </span>
        </button>
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
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  position: relative;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
