<script setup>
import { ref, nextTick, computed } from 'vue'
import { userColors } from '@/utils/constants'
import { characterApi } from '@/services/api'

const props = defineProps({
  characters: {
    type: Object,
    required: true
  },
  isCharacterMaxed: {
    type: Function,
    required: true
  },
  newCharacters: {
    type: Array,
    required: true
  },
  deletedCharacters: {
    type: Array,
    required: true
  },
  onCharacterDragStart: {
    type: Function,
    required: true
  },
  onCharacterOrderDragStart: {
    type: Function,
    required: true
  },
  onCharacterOrderDrop: {
    type: Function,
    required: true
  },
  onDragOver: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['add-character', 'delete-character', 'update:newCharacters', 'update:deletedCharacters'])

// 캐릭터 드래그 시작 디버깅
const handleCharacterDragStart = (character) => {
  return props.onCharacterDragStart(character)
}

// 캐릭터 추가 관련 상태
const newCharacterInput = ref('')
const editingUser = ref(null)

// 변경사항이 있는지 확인하는 computed
const hasChanges = computed(() => {
  return props.newCharacters.length > 0 || props.deletedCharacters.length > 0
})

// 캐릭터 추가 모드 시작
const startAddingCharacter = (userName) => {
  editingUser.value = userName
  newCharacterInput.value = ''
  
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
    emit('add-character', userName, newCharacterInput.value.trim())
  }
  
  editingUser.value = null
  newCharacterInput.value = ''
}

// 캐릭터 추가 취소
const cancelAddingCharacter = () => {
  editingUser.value = null
  newCharacterInput.value = ''
}

// 캐릭터 삭제
const deleteCharacter = (userName, characterName) => {
  emit('delete-character', userName, characterName)
}

// 저장 함수 - 변경된 캐릭터만 처리
const saveCharacters = async () => {
  try {
    let hasChanges = false
    
    console.log('=== 캐릭터 저장 시작 ===')
    console.log('새 캐릭터 목록:', props.newCharacters)
    console.log('삭제 예정 캐릭터 목록:', props.deletedCharacters)
    
    // 새로 추가된 캐릭터들 저장
    if (props.newCharacters.length > 0) {
      console.log('새 캐릭터 저장 중...')
      for (const character of props.newCharacters) {
        // 서버 전송용 데이터 포맷으로 변환 (isSupporter: boolean -> string)
        const serverCharacterData = {
          name: character.name,
          isSupporter: character.isSupporter ? 'Y' : 'N',
          userId: character.userId,
          seq: character.seq
        }
        console.log('저장할 캐릭터:', serverCharacterData)
        await characterApi.createCharacter(serverCharacterData)
        console.log('캐릭터 저장 성공:', character.name)
      }
      emit('update:newCharacters', []) // 저장 후 초기화
      hasChanges = true
    }
    
    // 삭제된 캐릭터들 처리
    if (props.deletedCharacters.length > 0) {
      console.log('캐릭터 삭제 중...')
      for (const characterName of props.deletedCharacters) {
        console.log('삭제할 캐릭터:', characterName)
        await characterApi.deleteCharacter(characterName)
        console.log('캐릭터 삭제 성공:', characterName)
      }
      emit('update:deletedCharacters', []) // 저장 후 초기화
      hasChanges = true
    }
    
    console.log('=== 캐릭터 저장 완료 ===')
    
    // 변경사항 여부를 App.vue에 반환 (alert은 App.vue에서 처리)
    return hasChanges
    
  } catch (error) {
    console.error('캐릭터 저장 실패:', error)
    alert('캐릭터 저장에 실패했습니다: ' + error.message)
    throw error // App.vue의 전체 저장에서 에러를 받을 수 있도록
  }
}

// Expose methods for parent component
defineExpose({
  saveCharacters
})
</script>

<template>
  <section class="character-section">
    <div class="section-header">
      <h2>캐릭터 선택</h2>
      <div class="change-info" v-if="hasChanges">
        <span v-if="props.newCharacters.length > 0" class="new-count">
          새 캐릭터: {{ props.newCharacters.length }}개
        </span>
        <span v-if="props.deletedCharacters.length > 0" class="deleted-count">
          삭제 예정: {{ props.deletedCharacters.length }}개
        </span>
      </div>
    </div>
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
                  @dragstart="!isCharacterMaxed(character.name) ? handleCharacterDragStart(character) : onCharacterOrderDragStart($event, character, userName, index)"
                  @dragover="onDragOver"
                  @drop="onCharacterOrderDrop($event, userName, index, characters)"
                  @dragenter="onDragOver"
                >
                  {{ character.name }}
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
</template>

<style scoped>
.character-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.character-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.change-info {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.new-count {
  color: #28a745;
  font-weight: 500;
  background-color: rgba(40, 167, 69, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.deleted-count {
  color: #dc3545;
  font-weight: 500;
  background-color: rgba(220, 53, 69, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.character-table table {
  width: 100%;
  border-collapse: collapse;
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
  min-height: 50px;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.character-tags:hover {
  background-color: rgba(102, 126, 234, 0.05);
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
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.character-tag.supporter {
  text-decoration: underline;
}

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

.drag-target {
  cursor: move;
  transition: all 0.2s ease;
}

.drag-target:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.drag-target:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.character-tag.dragging {
  opacity: 0.6;
  transform: rotate(2deg) scale(1.05);
  z-index: 1000;
}
</style>
