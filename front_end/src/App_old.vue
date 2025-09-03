<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import ScheduleSection from '@/components/ScheduleSection.vue'
import CharacterSection from '@/components/CharacterSection.vue'
import UserScheduleSection from '@/components/UserScheduleSection.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import { useDragDrop } from '@/composables/useDragDrop'
import { useAppData } from '@/composables/useAppData'
import { useApiIntegration } from '@/composables/useApiIntegration'
import { useBusinessLogic } from '@/composables/useBusinessLogic'
import { useBusinessLogic } from '@/composables/useBusinessLogic'

// 앱 데이터 관리 (컴포저블로 분리)
const appData = useAppData()
const {
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
} = appData

// API 통신 로직 (컴포저블로 분리)
const {
  loadData,
  loadRaids,
  saveCharacters,
  saveAll,
  loadUserSchedules,
  advanceWeek
} = useApiIntegration(appData)

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

// 비즈니스 로직 (컴포저블로 분리)
const {
  // 스케줄 관리
  getScheduledCharactersWrapper,
  getCharacterRaidsWrapper,
  isCharacterMaxedWrapper,
  isScheduleFinished,
  toggleScheduleFinish,
  markScheduleAsChanged,
  onScheduleDrop,
  onRightClick,
  onCharacterDoubleClick,
  // 캐릭터 관리
  addCharacter,
  deleteCharacter,
  // 유저 일정 관리
  updateUserScheduleText,
  toggleUserScheduleEnabled
} = useBusinessLogic(appData, { originalOnScheduleDrop, originalOnRightClick })



// 컴포넌트가 마운트될 때 데이터 가져오기
onMounted(async () => {
  await loadData()
})

// 저장 함수 - CharacterSection에 캐릭터 저장을 위임하는 방식
const characterSectionRef = ref(null)

// 기존 saveAll 함수는 useApiIntegration으로 이동
/*
const saveAll = async () => {
  console.log('🟡 saveAll 함수 시작')
  console.log('🟡 hasChanges:', hasChanges.value)
  console.log('🟡 변경사항 체크:', {
    newCharacters: newCharacters.value.length,
    deletedCharacters: deletedCharacters.value.length,
    raidOrderChanges: raidOrderChanges.value.length,
    newRaids: newRaids.value.length,
    deletedRaids: deletedRaids.value.length,
    hasScheduleChanges: hasScheduleChanges.value,
    hasUserScheduleChanges: hasUserScheduleChanges.value,
    changedUserSchedules: changedUserSchedules.value.length
  })
  
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
        console.log('저장할 유저 일정 데이터:', changedUserSchedules.value)
        
        await userScheduleApi.saveAllUserSchedules(changedUserSchedules.value)
        hasUserScheduleChanges.value = false // 저장 후 초기화
        changedUserSchedules.value = [] // 변경된 일정 목록 초기화
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
    error.value = error.message || '저장에 실패했습니다'
  } finally {
    console.log('🟡 saveAll 함수 종료')
    isLoading.value = false
  }
}
*/

// 기존 스케줄 변경사항 추적 및 유저 일정 관련 함수들은 useBusinessLogic으로 이동됨
/*
// 스케줄 변경사항 추적 래핑 함수들
const markScheduleAsChanged = () => {
  utilMarkScheduleAsChanged(hasScheduleChanges)
}

// 기존 resetScheduleChanges 함수는 useAppData의 resetDataScheduleChanges로 대체됨

// 유저 일정 관련 함수들 (2주차 시스템)
const updateUserScheduleText = (userId, dayOfWeek, weekNumber, text) => {
  // 2주차 시스템에 맞게 데이터 구조 수정
  if (!userSchedules.value[userId]) {
    userSchedules.value[userId] = {}
  }
  
  const weekKey = `week${weekNumber}`
  if (!userSchedules.value[userId][weekKey]) {
    userSchedules.value[userId][weekKey] = {}
  }
  if (!userSchedules.value[userId][weekKey][dayOfWeek]) {
    userSchedules.value[userId][weekKey][dayOfWeek] = { text: '', isEnabled: true }
  }
  
  userSchedules.value[userId][weekKey][dayOfWeek].text = text

  // 변경된 일정 추적
  const changeKey = `${userId}-${dayOfWeek}-week${weekNumber}`
  const existingIndex = changedUserSchedules.value.findIndex(item => 
    `${item.userId}-${item.dayOfWeek}-week${item.weekNumber}` === changeKey
  )
  const scheduleData = {
    userId,
    dayOfWeek,
    weekNumber,
    scheduleText: text,
    enabled: userSchedules.value[userId][weekKey][dayOfWeek].isEnabled ? 'Y' : 'N'
  }
  if (existingIndex >= 0) {
    changedUserSchedules.value[existingIndex] = scheduleData
  } else {
    changedUserSchedules.value.push(scheduleData)
  }
  hasUserScheduleChanges.value = true
}

const toggleUserScheduleEnabled = (userId, dayOfWeek, weekNumber) => {
  // 2주차 시스템에 맞게 데이터 구조 수정
  if (!userSchedules.value[userId]) {
    userSchedules.value[userId] = {}
  }
  
  const weekKey = `week${weekNumber}`
  if (!userSchedules.value[userId][weekKey]) {
    userSchedules.value[userId][weekKey] = {}
  }
  if (!userSchedules.value[userId][weekKey][dayOfWeek]) {
    userSchedules.value[userId][weekKey][dayOfWeek] = { text: '', isEnabled: true }
  }
  
  // 현재 상태 토글
  const currentEnabled = userSchedules.value[userId][weekKey][dayOfWeek].isEnabled
  userSchedules.value[userId][weekKey][dayOfWeek].isEnabled = !currentEnabled
  
  // 변경된 일정 추적
  const changeKey = `${userId}-${dayOfWeek}-week${weekNumber}`
  const existingIndex = changedUserSchedules.value.findIndex(item => 
    `${item.userId}-${item.dayOfWeek}-week${item.weekNumber}` === changeKey
  )
  const scheduleData = {
    userId,
    dayOfWeek,
    weekNumber,
    scheduleText: userSchedules.value[userId][weekKey][dayOfWeek].text || '',
    enabled: userSchedules.value[userId][weekKey][dayOfWeek].isEnabled ? 'Y' : 'N'
  }
  if (existingIndex >= 0) {
    changedUserSchedules.value[existingIndex] = scheduleData
  } else {
    changedUserSchedules.value.push(scheduleData)
  }
  hasUserScheduleChanges.value = true
}
*/
  if (!userSchedules.value[userId][weekKey][dayOfWeek]) {
    userSchedules.value[userId][weekKey][dayOfWeek] = { text: '', isEnabled: true }
  }
  
  userSchedules.value[userId][weekKey][dayOfWeek].text = text

  // 변경된 일정 추적
  const changeKey = `${userId}-${dayOfWeek}-week${weekNumber}`
  const existingIndex = changedUserSchedules.value.findIndex(item => 
    `${item.userId}-${item.dayOfWeek}-week${item.weekNumber}` === changeKey
  )
  const scheduleData = {
    userId,
    dayOfWeek,
    weekNumber,
    scheduleText: text,
    enabled: userSchedules.value[userId][weekKey][dayOfWeek].isEnabled ? 'Y' : 'N'
  }
  if (existingIndex >= 0) {
    changedUserSchedules.value[existingIndex] = scheduleData
  } else {
    changedUserSchedules.value.push(scheduleData)
  }
  hasUserScheduleChanges.value = true
}
*/

// 기존 advanceWeek과 loadUserSchedules 함수는 useApiIntegration으로 이동
/*
// 주차 전환 함수 (백엔드 API 호출)
const advanceWeek = async () => {
  try {
    console.log('주차 전환 API 호출 시작')
    isLoading.value = true
    
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
    isLoading.value = false
  }
}

// 유저 일정 데이터 로드 래핑 함수
const loadUserSchedules = async () => {
  await utilLoadUserSchedules(userSchedules)
}
*/
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
        :newRaids="newRaids"
        :deletedRaids="deletedRaids"
        :raidOrderChanges="raidOrderChanges"
        :hasScheduleChanges="hasScheduleChanges"
        :getScheduledCharacters="getScheduledCharactersWrapper"
        :getCharacterRaids="getCharacterRaidsWrapper"
        :isScheduleFinished="isScheduleFinished"
        :toggleScheduleFinish="toggleScheduleFinish"
        :markScheduleAsChanged="markScheduleAsChanged"
        :onDragOver="onDragOver"
        :onScheduleDrop="onScheduleDrop"
        :onRightClick="onRightClick"
        :onCharacterDoubleClick="onCharacterDoubleClick"
        :onRaidDragStart="onRaidDragStart"
        :onRaidDrop="onRaidDrop"
        :onPartyDragStart="onPartyDragStart"
        :onPartyDrop="onPartyDrop"
        @update:raids="(value) => raids = value"
        @update:newRaids="(value) => newRaids = value"
        @update:deletedRaids="(value) => deletedRaids = value"
        @update:raidOrderChanges="(value) => raidOrderChanges = value"
      />
      
      <CharacterSection 
        ref="characterSectionRef"
        :characters="characters"
        :isCharacterMaxed="isCharacterMaxedWrapper"
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
        :weekInfo="weekInfo"
        @update-schedule-text="updateUserScheduleText"
        @toggle-enabled="toggleUserScheduleEnabled"
        @advance-week="advanceWeek"
      />
      
      <div class="action-buttons">
        <button class="save-btn" @click="() => saveAll(characterSectionRef)" :disabled="!hasChanges">
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
