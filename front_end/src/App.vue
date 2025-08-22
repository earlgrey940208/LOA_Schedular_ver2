<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useDragDrop } from '@/composables/useDragDrop'

// useApi composable 사용
const { loadRaids, loadCharacters, loadSchedules, loadAllData, isLoading, error } = useApi()

// useDragDrop composable 사용
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
  onScheduleDrop,
  onRightClick,
  resetDragState
} = useDragDrop()

// 샘플 데이터 - raids를 빈 배열로 초기화
const raids = ref([])
const parties = ref(['1파티', '2파티', '3파티', '4파티', '5파티', '6파티'])

// reactive로 감싸서 반응형으로 만들기 - 초기값을 빈 객체로 설정
const characters = reactive({})

// 유저별 색상
const userColors = {
  '혀니': '#9d4edd',
  '샷건': '#f4d03f',
  '도당': '#85c1e9'
}

// 스케줄 데이터 (파티별, 레이드별로 배치된 캐릭터들)
const schedules = ref({})

// 데이터 로드 함수들
const loadData = async () => {
  try {
    const raidsData = await loadRaids()
    raids.value = raidsData
    
    const charactersData = await loadCharacters()
    // reactive 객체에 데이터 할당
    Object.keys(characters).forEach(key => {
      delete characters[key]
    })
    Object.keys(charactersData).forEach(userId => {
      characters[userId] = charactersData[userId]
    })
    
    console.log('데이터 로드 완료:', { raids: raids.value, characters })
  } catch (error) {
    console.error('데이터 로드 실패:', error)
    setDefaultCharacters()
  }
}

// 기본 캐릭터 데이터 설정 함수
const setDefaultCharacters = () => {
  // 기존 characters 객체 초기화
  Object.keys(characters).forEach(key => {
    delete characters[key]
  })
  
  // 기본값 설정
  characters['혀니'] = [
    { name: '비내', isSupporter: false, userId: '혀니' },
    { name: '메딕', isSupporter: true, userId: '혀니' }
  ]
  characters['샷건'] = [
    { name: '샷건', isSupporter: false, userId: '샷건' },
    { name: '마리', isSupporter: false, userId: '샷건' },
    { name: '붓먹', isSupporter: true, userId: '샷건' }
  ]
  characters['도당'] = [
    { name: '포우', isSupporter: false, userId: '도당' },
    { name: '포포', isSupporter: false, userId: '도당' }
  ]
}

// 컴포넌트가 마운트될 때 데이터 가져오기
onMounted(async () => {
  await loadData()
})

// 스케줄 관련 헬퍼 함수들
// 해당 셀의 캐릭터들 가져오기
const getScheduledCharacters = (party, raid) => {
  const key = `${party}-${raid}`
  return schedules.value[key] || []
}

// 캐릭터가 배치된 레이드 목록 가져오기
const getCharacterRaids = (characterName) => {
  const raids = new Set()
  Object.keys(schedules.value).forEach(key => {
    const [party, raid] = key.split('-')
    schedules.value[key].forEach(character => {
      if (character.name === characterName) {
        raids.add(raid)
      }
    })
  })
  return Array.from(raids)
}

// 캐릭터가 최대 레이드 수에 도달했는지 확인
const isCharacterMaxed = (characterName) => {
  return getCharacterRaids(characterName).length >= 3
}

// 새 캐릭터 입력 상태 관리
const newCharacterInput = ref('')
const editingUser = ref(null)

// 캐릭터 추가 모드 시작
const startAddingCharacter = (userName) => {
  editingUser.value = userName
  newCharacterInput.value = ''
  
  // 다음 틱에서 input에 포커스
  nextTick(() => {
    const inputElement = document.querySelector('.new-character-input')
    if (inputElement) {
      inputElement.focus()
    }
  })
}

// 새 캐릭터 추가
const addNewCharacter = (userName) => {
  if (newCharacterInput.value.trim()) {
    const userCharacters = characters[userName]
    const userId = userCharacters[0]?.userId || `user${Object.keys(characters).indexOf(userName) + 1}`
    
    characters[userName].push({
      name: newCharacterInput.value.trim(),
      isSupporter: false,
      userId: userId
    })
  }
  
  editingUser.value = null
  newCharacterInput.value = ''
}

// 캐릭터 추가 취소
const cancelAddingCharacter = () => {
  editingUser.value = null
  newCharacterInput.value = ''
}

// 캐릭터 삭제 함수 - 더 안전한 방식으로 수정
const deleteCharacter = (userName, characterName) => {
  const userCharacters = characters[userName]
  const characterIndex = userCharacters.findIndex(char => char.name === characterName)
  if (characterIndex !== -1) {
    // 배열에서 해당 요소 제거
    userCharacters.splice(characterIndex, 1)
  }
}

// 새 레이드 입력 상태 관리
const newRaidInput = ref('')
const isAddingRaid = ref(false)

// 레이드 추가 모드 시작
const startAddingRaid = () => {
  isAddingRaid.value = true
  newRaidInput.value = ''
  
  // 다음 틱에서 input에 포커스
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
    raids.value.push(newRaidInput.value.trim())
  }
  
  isAddingRaid.value = false
  newRaidInput.value = ''
}

// 레이드 추가 취소
const cancelAddingRaid = () => {
  isAddingRaid.value = false
  newRaidInput.value = ''
}

// 레이드 삭제 함수
const deleteRaid = (raidName) => {
  const raidIndex = raids.value.findIndex(raid => raid === raidName)
  if (raidIndex !== -1) {
    // 레이드 삭제
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
</script>

<template>
  <div class="app">
    <!-- 로딩 상태 표시 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>
    </div>

    <!-- 에러 상태 표시 -->
    <div v-if="error" class="error-message">
      <p>⚠️ {{ error }}</p>
    </div>

    <!-- 헤더 -->
    <header class="header">
      <h1>로스트아크 스케줄러</h1>
    </header>

    <div class="container">
      <!-- 일정관리 영역 -->
      <section class="schedule-section">
        <h2>일정관리</h2>
        <div class="schedule-table">
          <table>
            <thead>
              <tr>
                <th>파티</th>
                <th 
                  v-for="(raid, index) in raids" 
                  :key="raid"
                  class="raid-header draggable-header"
                  draggable="true"
                  @dragstart="onRaidDragStart($event, raid, index)"
                  @dragover="onDragOver"
                  @drop="onRaidDrop($event, index, raids)"
                >
                  {{ raid }}
                  <!-- x 버튼 추가 -->
                  <button 
                    class="delete-raid-btn"
                    @click="deleteRaid(raid)"
                    @click.stop
                  >
                    ×
                  </button>
                </th>
                <!-- 새 레이드 입력 또는 + 버튼 -->
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
                  :key="raid" 
                  class="raid-cell"
                  @dragover="onDragOver"
                  @drop="onScheduleDrop($event, party, raid, schedules, getCharacterRaids)"
                >
                  <div class="scheduled-characters">
                    <span
                      v-for="(character, index) in getScheduledCharacters(party, raid)"
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
                <!-- 빈 셀 추가 (새 레이드 컬럼용) -->
                <td class="empty-cell"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 캐릭터 선택 영역 -->
      <section class="character-section">
        <h2>캐릭터 선택</h2>
        <div class="character-table">
          <table>
            <tbody>
              <tr v-for="(characterList, userName) in characters" :key="userName">
                <td class="user-cell">{{ userName }}</td>
                <td class="characters-cell">
                  <div class="character-tags">
                    <span 
                      v-for="(character, index) in characterList" 
                      :key="`${character.name}-${index}`"
                      class="character-tag"
                      :style="{ backgroundColor: userColors[character.userId] }"
                      :class="{ 
                        supporter: character.isSupporter,
                        disabled: isCharacterMaxed(character.name),
                        'drag-target': true
                      }"
                      :draggable="!isCharacterMaxed(character.name)"
                      @dragstart="!isCharacterMaxed(character.name) ? onCharacterDragStart(character) : onCharacterOrderDragStart($event, character, userName, index)"
                      @dragover="onDragOver"
                      @drop="onCharacterOrderDrop($event, userName, index, characters)"
                      @dragenter="onDragOver"
                    >
                      {{ character.name }}
                      <!-- x 버튼 추가 -->
                      <button 
                        class="delete-btn"
                        @click="deleteCharacter(userName, character.name)"
                        @click.stop
                      >
                        ×
                      </button>
                    </span>
                    
                    <!-- 새 캐릭터 입력 -->
                    <input
                      v-if="editingUser === userName"
                      v-model="newCharacterInput"
                      ref="newCharacterInputRef"
                      class="new-character-input"
                      :style="{ borderColor: userColors[characterList[0]?.userId] }"
                      placeholder="캐릭터명 입력"
                      @keyup.enter="addNewCharacter(userName)"
                      @keyup.esc="cancelAddingCharacter"
                      @blur="cancelAddingCharacter"
                    />
                    
                    <button 
                      class="add-btn"
                      @click="startAddingCharacter(userName)"
                      v-if="editingUser !== userName"
                    >
                      +
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 저장 버튼 -->
      <div class="action-buttons">
        <button class="save-btn">저장</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.schedule-section,
.character-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.schedule-section h2,
.character-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.schedule-table table,
.character-table table {
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

.user-cell {
  padding: 1rem;
  font-weight: 600;
  color: #2c3e50;
  border: 1px solid #e9ecef;
  background-color: #f8f9fa;
  width: 120px;
}

.characters-cell {
  padding: 1rem;
  border: 1px solid #e9ecef;
}

.character-tags {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.character-tag {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: grab;
  transition: transform 0.2s;
  user-select: none;
  position: relative;
}

.character-tag:active {
  cursor: grabbing;
}

.character-tag:hover {
  transform: scale(1.05);
}

.character-tag.supporter {
  text-decoration: underline;
}

.character-tag.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(100%);
  pointer-events: auto;
}

.character-tag.disabled:hover {
  transform: none;
}

.character-tag.disabled:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: rgba(220, 53, 69, 0.9);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.character-tag:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background-color: rgba(220, 53, 69, 1);
  transform: scale(1.1);
}

.character-tag.disabled:hover .delete-btn {
  opacity: 1;
}

.add-btn {
  background-color: #e9ecef;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  color: #6c757d;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background-color: #dee2e6;
}

.new-character-input {
  padding: 0.5rem 1rem;
  border: 2px solid;
  border-radius: 20px;
  font-size: 0.9rem;
  outline: none;
  background-color: white;
  min-width: 120px;
}

.new-character-input:focus {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
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

/* 드래그 가능한 요소 스타일 */
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

/* 캐릭터 순서 변경을 위한 스타일 */
.character-tag.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

.character-tag:hover {
  transform: scale(1.05);
  cursor: move;
}

/* 드래그 오버 효과 */
.schedule-table th:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.draggable-row:hover td {
  border-color: #667eea;
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

/* 캐릭터 드래그 앤 드롭 개선 */
.character-tag.drag-target {
  cursor: move;
  transition: all 0.2s ease;
}

.character-tag.drag-target:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.character-tag.drag-target:active {
  cursor: grabbing;
  transform: scale(0.95);
}

/* 드래그 중인 캐릭터 스타일 */
.character-tag.dragging {
  opacity: 0.6;
  transform: rotate(2deg) scale(1.05);
  z-index: 1000;
}

/* 드롭 대상 영역 스타일 */
.character-tags {
  min-height: 50px;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.character-tags:hover {
  background-color: rgba(102, 126, 234, 0.05);
}

/* 비활성화된 캐릭터도 순서 변경 가능하도록 */
.character-tag.disabled {
  opacity: 0.5;
  cursor: move !important;
  filter: grayscale(100%);
  pointer-events: auto;
}

.character-tag.disabled:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* 로딩 오버레이 스타일 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 300px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner p {
  margin: 0;
  color: #666;
  font-size: 1rem;
}

/* 에러 메시지 스타일 */
.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  margin: 1rem;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
  text-align: center;
}

.error-message p {
  margin: 0;
  font-weight: 500;
}
</style>
