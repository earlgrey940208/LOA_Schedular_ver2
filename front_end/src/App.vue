<script setup>
import { ref, nextTick } from 'vue'

// 샘플 데이터
const raids = ['베히모스', '하기르', '노브', '노르둠']
const parties = ['1파티', '2파티', '3파티', '4파티', '5파티', '6파티']

const characters = {
  '비내': [
    { name: '비내', isSupporter: false, userId: 'user1' },
    { name: '메딕', isSupporter: true, userId: 'user1' }
  ],
  '샷건': [
    { name: '샷건', isSupporter: false, userId: 'user2' },
    { name: '마리', isSupporter: false, userId: 'user2' },
    { name: '붓먹', isSupporter: true, userId: 'user2' }
  ],
  '도당': [
    { name: '포우', isSupporter: false, userId: 'user3' },
    { name: '포포', isSupporter: false, userId: 'user3' }
  ]
}

// 유저별 색상
const userColors = {
  'user1': '#9d4edd',
  'user2': '#f4d03f',
  'user3': '#85c1e9'
}

// 스케줄 데이터 (파티별, 레이드별로 배치된 캐릭터들)
const schedules = ref({})

// 드래그 중인 캐릭터 정보
const draggedCharacter = ref(null)

// 드래그 시작
const onDragStart = (character) => {
  draggedCharacter.value = character
}

// 드롭 허용
const onDragOver = (event) => {
  event.preventDefault()
}

// 드롭 처리
const onDrop = (event, party, raid) => {
  event.preventDefault()
  
  if (draggedCharacter.value) {
    const key = `${party}-${raid}`
    
    // 스케줄에 해당 키가 없으면 빈 배열로 초기화
    if (!schedules.value[key]) {
      schedules.value[key] = []
    }
    
    // 이미 배치된 캐릭터인지 확인 (같은 셀 내 중복 방지)
    const isAlreadyScheduled = schedules.value[key].some(
      char => char.name === draggedCharacter.value.name
    )
    
    // 동일한 레이드의 다른 파티에 이미 배치되어 있는지 확인
    const isAlreadyInSameRaid = Object.keys(schedules.value).some(scheduleKey => {
      const [existingParty, existingRaid] = scheduleKey.split('-')
      // 같은 레이드이지만 다른 파티인 경우
      if (existingRaid === raid && existingParty !== party) {
        return schedules.value[scheduleKey].some(
          char => char.name === draggedCharacter.value.name
        )
      }
      return false
    })
    
    // 캐릭터가 이미 3개 레이드에 배치되어 있는지 확인
    const characterRaids = getCharacterRaids(draggedCharacter.value.name)
    const isCharacterAtMaxRaids = characterRaids.length >= 3 && !characterRaids.includes(raid)
    
    // 같은 유저의 다른 캐릭터가 이미 해당 셀에 배치되어 있는지 확인
    const isSameUserInSameRaid = schedules.value[key].some(
      char => char.userId === draggedCharacter.value.userId
    )
    
    if (!isAlreadyScheduled && !isAlreadyInSameRaid && !isCharacterAtMaxRaids && !isSameUserInSameRaid) {
      schedules.value[key].push({
        ...draggedCharacter.value,
        scheduleId: Date.now(), // 임시 ID
        raidName: raid,
        partyName: party
      })
    } else if (isAlreadyInSameRaid) {
      // 25.08.19 JHH : 테스트를 위한 주석처리
      // 동일한 레이드의 다른 파티에 이미 배치된 경우 경고 메시지
      // alert(`${draggedCharacter.value.name} 캐릭터는 이미 ${raid} 레이드의 다른 파티에 배치되어 있습니다.`)
    } else if (isCharacterAtMaxRaids) {
      // 25.08.19 JHH : 테스트를 위한 주석처리
      // alert(`${draggedCharacter.value.name} 캐릭터는 이미 3개의 레이드에 배치되어 있습니다.`)
    } else if (isSameUserInSameRaid) {
      // 25.08.19 JHH : 테스트를 위한 주석처리
      // alert(`같은 유저의 캐릭터가 이미 ${party} ${raid}에 배치되어 있습니다.`)
    }
    
    draggedCharacter.value = null
  }
}

// 우클릭으로 캐릭터 삭제
const onRightClick = (event, party, raid, characterIndex) => {
  event.preventDefault()
  const key = `${party}-${raid}`
  
  if (schedules.value[key]) {
    schedules.value[key].splice(characterIndex, 1)
    
    // 배열이 비어있으면 키 삭제
    if (schedules.value[key].length === 0) {
      delete schedules.value[key]
    }
  }
}

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
</script>

<template>
  <div class="app">
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
                <th v-for="raid in raids" :key="raid">{{ raid }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="party in parties" :key="party">
                <td class="party-cell">{{ party }}</td>
                <td 
                  v-for="raid in raids" 
                  :key="raid" 
                  class="raid-cell"
                  @dragover="onDragOver"
                  @drop="onDrop($event, party, raid)"
                >
                  <div class="scheduled-characters">
                    <span
                      v-for="(character, index) in getScheduledCharacters(party, raid)"
                      :key="character.scheduleId"
                      class="scheduled-character"
                      :style="{ backgroundColor: userColors[character.userId] }"
                      :class="{ supporter: character.isSupporter }"
                      @contextmenu="onRightClick($event, party, raid, index)"
                    >
                      {{ character.name }}
                    </span>
                  </div>
                </td>
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
                      v-for="character in characterList" 
                      :key="character.name"
                      class="character-tag"
                      :style="{ backgroundColor: userColors[character.userId] }"
                      :class="{ 
                        supporter: character.isSupporter,
                        disabled: isCharacterMaxed(character.name)
                      }"
                      :draggable="!isCharacterMaxed(character.name)"
                      @dragstart="onDragStart(character)"
                    >
                      {{ character.name }}
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
  pointer-events: none;
}

.character-tag.disabled:hover {
  transform: none;
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
  transition: transform 0.2s;
}

.save-btn:hover {
  transform: translateY(-2px);
}
</style>
