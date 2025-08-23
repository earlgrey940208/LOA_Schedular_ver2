<script setup>
import { ref, nextTick } from 'vue'
import { useDragDrop } from '@/composables/useDragDrop'
import { userColors } from '@/utils/constants'

const props = defineProps({
  raids: {
    type: Array,
    required: true
  },
  parties: {
    type: Array,
    required: true
  },
  schedules: {
    type: Object,
    required: true
  },
  getCharacterRaids: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['add-raid', 'delete-raid', 'swap-raid-order'])

// useDragDrop composable 사용
const {
  onPartyDragStart,
  onDragOver,
  onPartyDrop,
  onScheduleDrop,
  onRightClick
} = useDragDrop()

// 레이드 드래그 관련 상태
const draggedRaid = ref(null)
const draggedRaidIndex = ref(null)

// 레이드 드래그 시작
const onRaidDragStart = (event, raid, index) => {
  draggedRaid.value = raid
  draggedRaidIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

// 레이드 드롭 처리
const onRaidDrop = (event, targetIndex) => {
  event.preventDefault()
  
  if (draggedRaidIndex.value !== null && draggedRaidIndex.value !== targetIndex) {
    // App.vue의 swapRaidOrder 함수 호출
    emit('swap-raid-order', draggedRaidIndex.value, targetIndex)
  }
  
  // 드래그 상태 초기화
  draggedRaid.value = null
  draggedRaidIndex.value = null
}

// 레이드 추가 관련 상태
const newRaidInput = ref('')
const isAddingRaid = ref(false)

// 스케줄 헬퍼 함수
const getScheduledCharacters = (party, raid) => {
  const key = `${party}-${raid}`
  return props.schedules[key] || []
}

// 레이드 추가 모드 시작
const startAddingRaid = () => {
  isAddingRaid.value = true
  newRaidInput.value = ''
  
  nextTick(() => {
    const inputElement = document.querySelector('.new-raid-input')
    if (inputElement) {
      inputElement.focus()
    }
  })
}

// 새 레이드 추가
const addNewRaid = () => {
  if (newRaidInput.value.trim()) {
    emit('add-raid', newRaidInput.value.trim())
  }
  
  isAddingRaid.value = false
  newRaidInput.value = ''
}

// 레이드 추가 취소
const cancelAddingRaid = () => {
  isAddingRaid.value = false
  newRaidInput.value = ''
}

// 레이드 삭제
const deleteRaid = (raidName) => {
  emit('delete-raid', raidName)
}
</script>

<template>
  <section class="schedule-section">
    <h2>일정관리</h2>
    <div class="schedule-table">
      <table>
        <thead>
          <tr>
            <th>파티</th>
            <th 
              v-for="(raid, index) in raids" 
              :key="raid.name"
              class="raid-header draggable-header"
              draggable="true"
              @dragstart="onRaidDragStart($event, raid, index)"
              @dragover="onDragOver"
              @drop="onRaidDrop($event, index)"
            >
              {{ raid.name }}
              <button 
                class="delete-raid-btn"
                @click="deleteRaid(raid.name)"
                @click.stop
              >
                ×
              </button>
            </th>
            <th class="add-raid-header">
              <input
                v-if="isAddingRaid"
                v-model="newRaidInput"
                class="new-raid-input"
                placeholder="레이드명 입력"
                @keyup.enter="addNewRaid"
                @keyup.esc="cancelAddingRaid"
                @blur="cancelAddingRaid"
              />
              <button 
                v-else
                class="add-raid-btn"
                @click="startAddingRaid"
              >
                +
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(party, index) in parties" 
            :key="party"
            class="draggable-row"
            draggable="true"
            @dragstart="onPartyDragStart($event, party, index)"
            @dragover="onDragOver"
            @drop="onPartyDrop($event, index, parties)"
          >
            <td class="party-cell">{{ party }}</td>
            <td 
              v-for="raid in raids" 
              :key="raid.name" 
              class="raid-cell"
              @dragover="onDragOver"
              @drop="onScheduleDrop($event, party, raid.name, schedules, getCharacterRaids)"
            >
              <div class="scheduled-characters">
                <span
                  v-for="(character, index) in getScheduledCharacters(party, raid.name)"
                  :key="character.scheduleId"
                  class="scheduled-character"
                  :style="{ backgroundColor: userColors[character.userId] }"
                  :class="{ supporter: character.isSupporter }"
                  @contextmenu="onRightClick($event, party, raid, index, schedules)"
                >
                  {{ character.name }}
                </span>
              </div>
            </td>
            <td class="empty-cell"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.schedule-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.schedule-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.schedule-table table {
  width: 100%;
  border-collapse: collapse;
}

.schedule-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  text-align: center;
  font-weight: 600;
}

.schedule-table th:first-child {
  border-top-left-radius: 8px;
}

.schedule-table th:last-child {
  border-top-right-radius: 8px;
}

.party-cell {
  background-color: #f8f9fa;
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  border: 1px solid #e9ecef;
}

.raid-cell {
  padding: 1rem;
  border: 1px solid #e9ecef;
  min-height: 60px;
  background-color: white;
  position: relative;
}

.raid-cell:hover {
  background-color: #f8f9fa;
}

.scheduled-characters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.scheduled-character {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 15px;
  color: white;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.scheduled-character:hover {
  transform: scale(1.05);
}

.scheduled-character.supporter {
  text-decoration: underline;
}

.raid-header {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  text-align: center;
  font-weight: 600;
}

.delete-raid-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(220, 53, 69, 0.9);
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  color: white;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  z-index: 10;
}

.raid-header:hover .delete-raid-btn {
  opacity: 1;
}

.delete-raid-btn:hover {
  background-color: rgba(220, 53, 69, 1);
  transform: scale(1.1);
}

.add-raid-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  width: 120px;
}

.add-raid-btn {
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  color: white;
  transition: background-color 0.2s;
}

.add-raid-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.new-raid-input {
  padding: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  background-color: rgba(255, 255, 255, 0.9);
  color: #333;
  width: 100px;
}

.new-raid-input:focus {
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.empty-cell {
  padding: 1rem;
  border: 1px solid #e9ecef;
  background-color: #f8f9fa;
  width: 120px;
}

.draggable-header {
  cursor: move;
  user-select: none;
}

.draggable-header:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4c9a 100%) !important;
}

.draggable-row {
  cursor: move;
  user-select: none;
}

.draggable-row:hover {
  background-color: rgba(102, 126, 234, 0.1);
}

.draggable-row:hover .party-cell {
  background-color: rgba(102, 126, 234, 0.2);
}

.schedule-table th:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.draggable-row:hover td {
  border-color: #667eea;
}
</style>
