<script setup>
import { ref, onMounted } from 'vue'
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
  totalChanges
} = appData

// API 통신 로직 (컴포저블로 분리)
const {
  loadData,
  saveAll,
  advanceWeek
} = useApiIntegration(appData)

// 드래그&드롭 기능
const dragDropFunctions = useDragDrop()
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
  resetDragState
} = dragDropFunctions

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
} = useBusinessLogic(appData, dragDropFunctions)

// 저장 함수 - CharacterSection에 캐릭터 저장을 위임하는 방식
const characterSectionRef = ref(null)

// 컴포넌트가 마운트될 때 데이터 가져오기
onMounted(async () => {
  await loadData()
})
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
