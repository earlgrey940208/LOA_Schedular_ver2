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
import { useAutoSave } from '@/composables/useAutoSave'
import { useAutoRefresh } from '@/composables/useAutoRefresh'

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

// 자동 갱신 기능
const autoRefresh = useAutoRefresh(loadData)
const {
  lastUpdated,
  isCheckingUpdates,
  isSSEConnected,
  checkForUpdates,
  checkAfterSave
} = autoRefresh

// 자동 저장 기능 (저장 완료 시 자동갱신 트리거)
const autoSave = useAutoSave(checkAfterSave)
const {
  savingStates,
  saveErrors,
  saveCharacterChange,
  saveScheduleChange,
  saveUserScheduleChange,
  saveRaidOrderChange,
  debouncedSaveUserSchedule,
  debouncedSaveSchedule,
  isAnySaving,
  hasAnyError,
  clearErrors
} = autoSave

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
} = useBusinessLogic(appData, dragDropFunctions, autoSave)

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
        <!-- 실시간 연결 상태 표시 -->
        <div v-if="isSSEConnected" class="auto-save-status connected">
          <span>🔗 실시간 연결됨</span>
        </div>
        
        <!-- 자동 저장 상태 표시 -->
        <div v-if="isAnySaving()" class="auto-save-status saving">
          <div class="spinner"></div>
          <span>자동 저장 중...</span>
        </div>
        <div v-else-if="hasAnyError()" class="auto-save-status error">
          <span>❌ 저장 실패</span>
          <button @click="clearErrors" class="retry-btn">재시도</button>
        </div>
        <div v-else-if="isCheckingUpdates" class="auto-save-status refreshing">
          <div class="spinner"></div>
          <span>자동 갱신 중...</span>
        </div>
        <div v-else class="auto-save-status success">
          <span>✅ 자동 저장됨</span>
        </div>
        
        <!-- 기존 저장 버튼 (백업용으로 유지) -->
        <!-- <button class="save-btn backup" @click="() => saveAll(characterSectionRef)" :disabled="!hasChanges">
          <span v-if="hasChanges">
            수동 저장 ({{ totalChanges }}개 변경)
          </span>
          <span v-else>
            수동 저장
          </span>
        </button> -->
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
  max-width: 85%;
  margin: 0 auto;
  padding: 0 1rem;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.auto-save-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.auto-save-status.connected {
  background-color: #e7f5ff;
  color: #1971c2;
  border: 1px solid #74c0fc;
}

.auto-save-status.saving {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.auto-save-status.refreshing {
  background-color: #cce5ff;
  color: #004085;
  border: 1px solid #99d6ff;
}

.auto-save-status.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.auto-save-status.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  background: transparent;
  border: 1px solid currentColor;
  color: inherit;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.retry-btn:hover {
  background: currentColor;
  color: white;
}

.save-btn.backup {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  font-size: 0.9rem;
  padding: 0.6rem 1.5rem;
}
</style>
