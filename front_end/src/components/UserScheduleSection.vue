<template>
  <div class="user-schedule-section">
    <div class="section-header">
      <h2>📅 유저별 주간 일정</h2>
      <div class="header-controls">
        <p class="section-description">클릭: 일정입력 | 우클릭: 가능/불가능 변경 | 매주 수요일 5시 자동 주차 전환</p>
        <button class="advance-week-btn" @click="$emit('advance-week')" title="수동으로 주차 전환 실행 (2주차→1주차, 기존 1주차 삭제)">
          주차 전환 (수동)
        </button>
      </div>
    </div>
    
    <!-- 1주차 테이블 -->
    <div class="week-section">
      <h3 class="week-title">1주차 {{ weekInfo.week1DateRange }}</h3>
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
              <td v-for="day in weekDays" :key="`week1-${userId}-${day}`" class="schedule-cell-container">
                <div 
                  class="schedule-cell"
                  :class="{ 'disabled': !getSchedule(userId, day, 1).isEnabled }"
                  @contextmenu.prevent="toggleEnabled(userId, day, 1)"
                >
                  <textarea
                    v-model="getSchedule(userId, day, 1).text"
                    @input="updateScheduleText(userId, day, 1, $event.target.value)"
                    :disabled="!getSchedule(userId, day, 1).isEnabled"
                    class="schedule-input"
                    rows="2"
                  />
                  <div v-if="!getSchedule(userId, day, 1).isEnabled" class="disabled-overlay">
                    게임 불가
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 2주차 테이블 -->
    <div class="week-section">
      <h3 class="week-title">2주차 {{ weekInfo.week2DateRange }}</h3>
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
              <td v-for="day in weekDays" :key="`week2-${userId}-${day}`" class="schedule-cell-container">
                <div 
                  class="schedule-cell"
                  :class="{ 'disabled': !getSchedule(userId, day, 2).isEnabled }"
                  @contextmenu.prevent="toggleEnabled(userId, day, 2)"
                >
                  <textarea
                    v-model="getSchedule(userId, day, 2).text"
                    @input="updateScheduleText(userId, day, 2, $event.target.value)"
                    :disabled="!getSchedule(userId, day, 2).isEnabled"
                    class="schedule-input"
                    rows="2"
                  />
                  <div v-if="!getSchedule(userId, day, 2).isEnabled" class="disabled-overlay">
                    게임 불가
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { weekDays, userColors } from '@/utils/constants'

// Props
const props = defineProps({
  userSchedules: {
    type: Object,
    default: () => ({})
  },
  users: {
    type: Array,
    default: () => []
  },
  weekInfo: {
    type: Object,
    default: () => {
      // 현재 날짜 기준으로 주차 정보 계산
      const today = new Date()
      const dayOfWeek = today.getDay()
      const daysFromWednesday = (dayOfWeek + 4) % 7
      const thisWednesday = new Date(today)
      thisWednesday.setDate(today.getDate() - daysFromWednesday)
      
      const week1Start = new Date(thisWednesday)
      const week1End = new Date(thisWednesday)
      week1End.setDate(week1Start.getDate() + 6)
      
      const week2Start = new Date(week1Start)
      week2Start.setDate(week1Start.getDate() + 7)
      const week2End = new Date(week2Start)
      week2End.setDate(week2Start.getDate() + 6)
      
      return {
        week1DateRange: `${week1Start.getMonth()+1}/${week1Start.getDate()}~${week1End.getMonth()+1}/${week1End.getDate()}`,
        week2DateRange: `${week2Start.getMonth()+1}/${week2Start.getDate()}~${week2End.getMonth()+1}/${week2End.getDate()}`
      }
    }
  }
})

// Emits
const emit = defineEmits(['update-schedule-text', 'toggle-enabled', 'advance-week'])

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
const getSchedule = (userId, day, weekNumber) => {
  // day는 한글 요일 ('수', '목' 등)이므로 그대로 사용
  const defaultSchedule = { text: '', isEnabled: true }
  
  if (!props.userSchedules[userId]) {
    return defaultSchedule
  }
  
  const weekKey = `week${weekNumber}`
  if (!props.userSchedules[userId][weekKey]) {
    return defaultSchedule
  }
  
  return props.userSchedules[userId][weekKey][day] || defaultSchedule
}

const updateScheduleText = (userId, day, weekNumber, text) => {
  emit('update-schedule-text', userId, day, weekNumber, text)
}

const toggleEnabled = (userId, day, weekNumber) => {
  emit('toggle-enabled', userId, day, weekNumber)
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

.week-section {
  margin-bottom: 2rem;
}

.week-title {
  font-size: 1.2rem;
  color: #495057;
  margin-bottom: 1rem;
  font-weight: 600;
}

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.advance-week-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.advance-week-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
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
