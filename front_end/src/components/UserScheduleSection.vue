<template>
  <div class="user-schedule-section">
    <div class="section-header">
      <h2>📅 유저별 주간 일정</h2>
      <p class="section-description">클릭: 일정입력 | 우클릭: 가능/불가능 변경</p>
    </div>
    
    <div class="schedule-table-container">
      <table class="schedule-table">
        <thead>
          <tr>
            <th class="user-column">유저</th>
            <th v-for="day in weekDays" :key="day" class="day-column">{{ day }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="userId in userIds" :key="userId">
            <td class="user-name" :style="{ color: getUserColor(userId) }">
              {{ userId }}
            </td>
            <td v-for="day in weekDays" :key="`${userId}-${day}`" class="schedule-cell-container">
              <div 
                class="schedule-cell"
                :class="{ 'disabled': !getSchedule(userId, day).isEnabled }"
                @contextmenu.prevent="toggleEnabled(userId, day)"
              >
                <textarea
                  v-model="getSchedule(userId, day).text"
                  @input="updateScheduleText(userId, day, $event.target.value)"
                  :disabled="!getSchedule(userId, day).isEnabled"
                  class="schedule-input"
                  rows="2"
                />
                <div v-if="!getSchedule(userId, day).isEnabled" class="disabled-overlay">
                  게임 불가
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { weekDays, dayOfWeekMapping, userColors } from '@/utils/constants'

// Props
const props = defineProps({
  userSchedules: {
    type: Object,
    default: () => ({})
  },
  users: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update-schedule-text', 'toggle-enabled'])

// Computed
const userIds = computed(() => {
  return props.users.length > 0 
    ? props.users.map(user => user.name)
    : ['혀니', '도당', '샷건'] // 기본 유저 목록
})

const getUserColor = (userId) => {
  const user = props.users.find(u => u.name === userId)
  return user ? user.color : (userColors[userId] || '#333')
}

// Methods
const getSchedule = (userId, day) => {
  // day는 한글 요일 ('수', '목' 등)이므로 그대로 사용
  const defaultSchedule = { text: '', isEnabled: true }
  
  if (!props.userSchedules[userId]) {
    return defaultSchedule
  }
  
  return props.userSchedules[userId][day] || defaultSchedule
}

const updateScheduleText = (userId, day, text) => {
  const dayOfWeek = dayOfWeekMapping[day]
  emit('update-schedule-text', userId, dayOfWeek, text)
}

const toggleEnabled = (userId, day) => {
  const dayOfWeek = dayOfWeekMapping[day]
  emit('toggle-enabled', userId, dayOfWeek)
}
</script>

<style scoped>
.user-schedule-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 1.5rem;
  text-align: left;
}

.section-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.section-description {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.schedule-table-container {
  overflow-x: auto;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.schedule-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 0.5rem;
  text-align: center;
  font-weight: 600;
  border: 1px solid #dee2e6;
}

.user-column {
  width: 80px;
  min-width: 80px;
}

.day-column {
  width: 100px;
  min-width: 100px;
}

.schedule-table td {
  border: 1px solid #dee2e6;
  padding: 0;
}

.user-name {
  background-color: #f8f9fa;
  font-weight: 600;
  text-align: center;
  padding: 0.75rem 0.5rem;
  font-size: 1rem;
}

.schedule-cell-container {
  position: relative;
  padding: 0;
}

.schedule-cell {
  position: relative;
  height: 60px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schedule-cell.disabled {
  background-color: #f1f3f4;
  opacity: 0.6;
}

.schedule-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0.25rem;
  resize: none;
  font-size: 0.8rem;
  background: transparent;
  text-align: center;
}

.schedule-input:disabled {
  background-color: transparent;
  color: #aaa;
  cursor: not-allowed;
}

.schedule-input:focus {
  background-color: #fff3cd;
  box-shadow: inset 0 0 0 2px #ffc107;
}

.disabled-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(108, 117, 125, 0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  pointer-events: none;
  z-index: 1;
}

/* 반응형 */
@media (max-width: 768px) {
  .schedule-table-container {
    overflow-x: scroll;
  }
  
  .user-column {
    width: 70px;
    min-width: 70px;
  }
  
  .day-column {
    width: 85px;
    min-width: 85px;
  }
  
  .schedule-cell {
    height: 50px;
  }
  
  .schedule-input {
    font-size: 0.75rem;
    padding: 0.2rem;
  }
}
</style>
