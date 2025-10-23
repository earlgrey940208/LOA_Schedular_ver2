<script setup>
import { ref, nextTick } from 'vue'
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
  scheduleFinish: {
    type: Object,
    required: true
  },
  // 변경 추적 상태들
  newRaids: {
    type: Array,
    required: true
  },
  deletedRaids: {
    type: Array,
    required: true
  },
  raidOrderChanges: {
    type: Array,
    required: true
  },
  hasScheduleChanges: {
    type: Object,
    required: true
  },
  // Phase 3: 비활성화 상태 props 추가
  disabledCharacters: {
    type: Object,
    required: true
  },
  disabledCells: {
    type: Object,
    required: true
  },
  getScheduledCharacters: {
    type: Function,
    required: true
  },
  getCharacterRaids: {
    type: Function,
    required: true
  },
  isScheduleFinished: {
    type: Function,
    required: true
  },
  toggleScheduleFinish: {
    type: Function,
    required: true
  },
  markScheduleAsChanged: {
    type: Function,
    required: true
  },
  onDragOver: {
    type: Function,
    required: true
  },
  onScheduleDrop: {
    type: Function,
    required: true
  },
  onRightClick: {
    type: Function,
    required: true
  },
  onCharacterDoubleClick: {
    type: Function,
    required: true
  },
  onRaidDragStart: {
    type: Function,
    required: true
  },
  onRaidDrop: {
    type: Function,
    required: true
  },
  onPartyDragStart: {
    type: Function,
    required: true
  },
  onPartyDrop: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['update:raids', 'update:newRaids', 'update:deletedRaids', 'update:raidOrderChanges'])

// 레이드 추가 관련 상태
const newRaidInput = ref('')
const isAddingRaid = ref(false)

// 스케줄 헬퍼 함수 - props에서 받은 함수 사용
const getScheduledCharacters = (party, raid) => {
  return props.getScheduledCharacters(party, raid)
}

// 셀 우클릭 헬퍼 함수 - 셀 배경에서 우클릭 시 완료 토글
const onCellRightClick = (event, party, raid) => {
  // 캐릭터 요소에서 온 이벤트는 무시
  if (event.target.classList.contains('scheduled-character')) {
    console.log('캐릭터에서 온 이벤트 - 셀 우클릭 무시')
    return
  }
  
  // 셀 배경을 클릭한 경우만 완료 상태 토글
  console.log('셀 배경 우클릭 - 완료 상태 토글')
  props.onRightClick(event, party, raid, null)
}

// Phase 3: 캐릭터 우클릭 핸들러 (기존 기능과 완전 독립)
const onCharacterRightClick = (event, characterName, party, raid) => {
  event.preventDefault()
  event.stopPropagation() // 셀 우클릭 이벤트와 분리
  event.stopImmediatePropagation() // 추가로 즉시 전파 중단
  
  // 위치별 고유 키 생성 (party-raid-characterName)
  const uniqueKey = `${party}-${raid}-${characterName}`
  
  // 해당 위치의 캐릭터만 비활성화 상태 토글
  if (props.disabledCharacters.has(uniqueKey)) {
    props.disabledCharacters.delete(uniqueKey)
  } else {
    props.disabledCharacters.add(uniqueKey)
  }
  
  console.log('캐릭터 우클릭:', uniqueKey, '비활성화:', props.disabledCharacters.has(uniqueKey))
  return false // 이벤트 완전 차단
}

// Phase 4: 셀 상태 체크 함수
const isCellAllDisabled = (party, raid) => {
  const characters = getScheduledCharacters(party, raid)
  if (characters.length === 0) return false // 빈 셀은 비활성화 안함
  
  // 셀의 모든 캐릭터가 비활성화되었는지 체크
  return characters.every(character => {
    const uniqueKey = `${party}-${raid}-${character.name}`
    return props.disabledCharacters.has(uniqueKey)
  })
}

// 레이드 관리 함수들
const addRaid = (raidName) => {
  if (raidName.trim() && !props.raids.some(raid => raid.name === raidName)) {
    // 현재 저장된 레이드들만 고려 (newRaids는 제외)
    const savedRaids = props.raids.filter(raid => 
      !props.newRaids.some(newRaid => newRaid.name === raid.name)
    )
    
    const maxSeq = savedRaids.length > 0 
      ? Math.max(...savedRaids.map(raid => raid.seq || 0))
      : 0
    
    // 이미 추가된 새 레이드들의 개수를 고려
    const newSeq = maxSeq + props.newRaids.length + 1
    
    const newRaid = {
      name: raidName.trim(),
      seq: newSeq
    }
    
    // 화면에 즉시 추가
    const updatedRaids = [...props.raids, newRaid]
    emit('update:raids', updatedRaids)
    
    // 변경 추적에 추가
    const updatedNewRaids = [...props.newRaids, newRaid]
    emit('update:newRaids', updatedNewRaids)
    
  } else {
    console.warn('레이드 추가 실패 - 이미 존재하거나 빈 이름:', raidName)
  }
}

const deleteRaid = (raidName) => {
  const raidIndex = props.raids.findIndex(raid => raid.name === raidName)
  if (raidIndex !== -1) {
    const deletedRaid = props.raids[raidIndex]
    
    // 화면에서 즉시 삭제
    const updatedRaids = [...props.raids]
    updatedRaids.splice(raidIndex, 1)
    emit('update:raids', updatedRaids)
    
    // 해당 레이드와 관련된 스케줄도 모두 삭제
    Object.keys(props.schedules).forEach(key => {
      const [party, raid] = key.split('-')
      if (raid === raidName) {
        delete props.schedules[key]
      }
    })
    
    // 변경 추적에 추가 (새로 추가된 레이드인지 확인)
    const newRaidIndex = props.newRaids.findIndex(raid => raid.name === raidName)
    if (newRaidIndex !== -1) {
      // 새로 추가된 레이드를 삭제하는 경우 - newRaids에서만 제거
      const updatedNewRaids = [...props.newRaids]
      updatedNewRaids.splice(newRaidIndex, 1)
      emit('update:newRaids', updatedNewRaids)
    } else {
      // 기존 레이드를 삭제하는 경우 - deletedRaids에 추가
      const updatedDeletedRaids = [...props.deletedRaids, deletedRaid]
      emit('update:deletedRaids', updatedDeletedRaids)
    }
    
    // 스케줄 변경사항 추적
    props.markScheduleAsChanged()
    
  } else {
    console.warn('삭제할 레이드를 찾을 수 없음:', raidName)
  }
}

const swapRaidOrder = (fromIndex, toIndex) => {
  if (fromIndex === toIndex) return
  
  const updatedRaids = [...props.raids]
  
  // 로컬 배열에서 순서 변경
  const raid1 = updatedRaids[fromIndex]
  const raid2 = updatedRaids[toIndex]
  
  // seq 값 교환
  const tempSeq = raid1.seq
  raid1.seq = raid2.seq
  raid2.seq = tempSeq
  
  // 배열 순서 변경
  updatedRaids.splice(fromIndex, 1, raid2)
  updatedRaids.splice(toIndex, 1, raid1)
  
  emit('update:raids', updatedRaids)
  
  // 변경 사항 추적에 추가
  const changeIndex = props.raidOrderChanges.findIndex(change => 
    change.name === raid1.name || change.name === raid2.name
  )
  
  const updatedRaidOrderChanges = [...props.raidOrderChanges]
  
  if (changeIndex !== -1) {
    // 기존 변경사항 업데이트
    updatedRaidOrderChanges[changeIndex] = { name: raid1.name, seq: raid1.seq }
    updatedRaidOrderChanges.push({ name: raid2.name, seq: raid2.seq })
  } else {
    // 새로운 변경사항 추가
    updatedRaidOrderChanges.push(
      { name: raid1.name, seq: raid1.seq },
      { name: raid2.name, seq: raid2.seq }
    )
  }
  
  emit('update:raidOrderChanges', updatedRaidOrderChanges)
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
    addRaid(newRaidInput.value.trim())
  }
  
  isAddingRaid.value = false
  newRaidInput.value = ''
}

// 레이드 추가 취소
const cancelAddingRaid = () => {
  isAddingRaid.value = false
  newRaidInput.value = ''
}

// Hover 관련 함수들
const onHeaderHover = (raidIndex, isEnter) => {
  const cells = document.querySelectorAll(`.raid-cell[data-raid-index="${raidIndex}"]`)
  cells.forEach(cell => {
    if (isEnter) {
      cell.classList.add('column-hover')
    } else {
      cell.classList.remove('column-hover')
    }
  })
}

const onPartyHover = (partyIndex, isEnter) => {
  const cells = document.querySelectorAll(`.raid-cell[data-party-index="${partyIndex}"]`)
  cells.forEach(cell => {
    if (isEnter) {
      cell.classList.add('row-hover')
    } else {
      cell.classList.remove('row-hover')
    }
  })
}
</script>

<template>
  <section class="schedule-section">
    <div class="section-header">
      <h2>⚔️ 레이드 일정관리</h2>
      <p class="section-description">드래그&드롭: 캐릭터등록 | 우클릭: 레이드 완료여부 | 더블클릭: 캐릭터삭제</p>
    </div>
    
    <div class="schedule-table-container">
      <div class="schedule-table">
      <table>
        <thead>
          <tr>
            <th>파티</th>
            <th 
              v-for="(raid, index) in raids" 
              :key="raid.name || raid"
              class="raid-header draggable-header"
              draggable="true"
              @dragstart="onRaidDragStart($event, raid, index)"
              @dragover="onDragOver"
              @drop="(event) => props.onRaidDrop(event, index, raids, swapRaidOrder)"
              @mouseenter="onHeaderHover(index, true)"
              @mouseleave="onHeaderHover(index, false)"
            >
              {{ raid.name || raid }}
              <button 
                class="delete-raid-btn"
                @click="deleteRaid(raid.name || raid)"
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
            <td class="party-cell" @mouseenter="onPartyHover(index, true)" @mouseleave="onPartyHover(index, false)">{{ party }}</td>
            <td 
              v-for="(raid, raidIndex) in raids" 
              :key="raid.name || raid" 
              class="raid-cell"
              :data-raid-index="raidIndex"
              :data-party-index="index"
              :class="{ 
                'finished': isScheduleFinished(party, raid.name || raid),
                'readonly': isScheduleFinished(party, raid.name || raid),
                'cell-disabled': isCellAllDisabled(party, raid.name || raid)
              }"
              @dragover="!isScheduleFinished(party, raid.name || raid) ? onDragOver($event) : null"
              @drop="onScheduleDrop($event, party, raid.name || raid)"
              @contextmenu="onCellRightClick($event, party, raid.name || raid)"
            >
              <div class="scheduled-characters">
                <span
                  v-for="(character, index) in getScheduledCharacters(party, raid.name || raid)"
                  :key="character.scheduleId"
                  class="scheduled-character"
                  :style="{ backgroundColor: userColors[character.userId] }"
                  :class="{ 
                    supporter: character.isSupporter,
                    'character-disabled': disabledCharacters.has(`${party}-${raid.name || raid}-${character.name}`)
                  }"
                  @dblclick="onCharacterDoubleClick($event, party, raid.name || raid, index)"
                  @contextmenu="onCharacterRightClick($event, character.name, party, raid.name || raid)"
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
    </div>
  </section>
</template>

<style scoped>
.schedule-section {
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
  transition: background-color 0.3s ease;
}

.raid-cell.column-hover {
  background-color: rgba(102, 126, 234, 0.3);
}

.raid-cell.row-hover {
  background-color: rgba(102, 126, 234, 0.3);
}

.raid-cell.finished {
  background-color: #e9ecef;
  /* border-color: #adb5bd; */
}

.raid-cell.finished:hover {
  background-color: #e9ecef;
}

.raid-cell.readonly {
  cursor: not-allowed;
}

.raid-cell.finished .scheduled-character {
  opacity: 0.7;
  filter: grayscale(0.3);
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

.draggable-row {
  cursor: move;
  user-select: none;
}

/* Phase 2: 캐릭터/셀 비활성화 스타일 (기존 기능에 영향 없음) */
.character-disabled {
  opacity: 0.5 !important;
  filter: grayscale(100%) !important;
  cursor: not-allowed;
}

.cell-disabled {
  background-color: #e9ecef !important;
}
</style>
