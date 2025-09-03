// useDragDrop composable - 드래그&드롭 로직을 관리하는 컴포저블
import { ref } from 'vue'

export function useDragDrop() {
  // 드래그 중인 캐릭터 정보
  const draggedCharacter = ref(null)

  // 드래그 상태 관리
  const dragState = ref({
    type: null, // 'character', 'raid', 'party', 'character-order'
    data: null,
    sourceIndex: null,
    userName: null
  })

  // 캐릭터 드래그 시작
  const onCharacterDragStart = (character) => {
    draggedCharacter.value = character
    dragState.value = { type: 'character', data: character }
  }

  // 레이드 헤더 드래그 시작
  const onRaidDragStart = (event, raid, index) => {
    dragState.value = {
      type: 'raid',
      data: raid,
      sourceIndex: index
    }
    event.dataTransfer.effectAllowed = 'move'
  }

  // 파티 행 드래그 시작
  const onPartyDragStart = (event, party, index) => {
    dragState.value = {
      type: 'party',
      data: party,
      sourceIndex: index
    }
    event.dataTransfer.effectAllowed = 'move'
  }

  // 캐릭터 순서 드래그 시작
  const onCharacterOrderDragStart = (event, character, userName, index) => {
    dragState.value = {
      type: 'character-order',
      data: character,
      userName: userName,
      sourceIndex: index
    }
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', '') // 일부 브라우저 호환성을 위해
  }

  // 드롭 허용
  const onDragOver = (event) => {
    event.preventDefault()
  }

  // 레이드 헤더 드롭
  const onRaidDrop = (event, targetIndex, raids) => {
    event.preventDefault()
    
    if (dragState.value.type === 'raid') {
      const sourceIndex = dragState.value.sourceIndex
      if (sourceIndex !== targetIndex) {
        // raids가 ref 객체인지 확인하고 적절히 접근
        const raidsArray = raids.value || raids
        
        // 레이드 순서 변경
        const raidList = [...raidsArray]
        const [movedRaid] = raidList.splice(sourceIndex, 1)
        raidList.splice(targetIndex, 0, movedRaid)
        
        // raids가 ref 객체인지 확인하고 적절히 업데이트
        if (raids.value !== undefined) {
          raids.value = raidList
        } else {
          // raids 배열 자체를 직접 수정 (splice 사용)
          raids.splice(0, raids.length, ...raidList)
        }
      }
    }
    
    resetDragState()
  }

  // 파티 행 드롭
  const onPartyDrop = (event, targetIndex, parties) => {
    event.preventDefault()
    
    if (dragState.value.type === 'party') {
      const sourceIndex = dragState.value.sourceIndex
      if (sourceIndex !== targetIndex) {
        // parties가 ref 객체인지 확인하고 적절히 접근
        const partiesArray = parties.value || parties
        
        // 파티 순서 변경
        const partyList = [...partiesArray]
        const [movedParty] = partyList.splice(sourceIndex, 1)
        partyList.splice(targetIndex, 0, movedParty)
        
        // parties가 ref 객체인지 확인하고 적절히 업데이트
        if (parties.value !== undefined) {
          parties.value = partyList
        } else {
          // parties 배열 자체를 직접 수정 (splice 사용)
          parties.splice(0, parties.length, ...partyList)
        }
      }
    }
    
    resetDragState()
  }

  // 캐릭터 순서 드롭
  const onCharacterOrderDrop = (event, userName, targetIndex, characters) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (dragState.value.type === 'character-order' && dragState.value.userName === userName) {
      const sourceIndex = dragState.value.sourceIndex
      if (sourceIndex !== targetIndex && sourceIndex !== undefined) {
        // 캐릭터 순서 변경
        const characterList = [...characters[userName]]
        const [movedCharacter] = characterList.splice(sourceIndex, 1)
        characterList.splice(targetIndex, 0, movedCharacter)
        characters[userName] = characterList
      }
    }
    
    resetDragState()
  }

  // 캐릭터를 스케줄에 배치하는 드롭 처리
  const onScheduleDrop = (event, party, raid, schedules, getCharacterRaids, isScheduleFinished, markScheduleAsChanged) => {
    event.preventDefault()
    
    // 캐릭터 배치 드롭인 경우에만 처리
    if (draggedCharacter.value && dragState.value.type === 'character') {
      // 스케줄이 완료된 상태면 드롭 불가
      if (isScheduleFinished && isScheduleFinished(party, raid)) {
        resetDragState()
        return false
      }
      
      // schedules가 제대로 전달되었는지 확인
      if (!schedules || typeof schedules !== 'object') {
        resetDragState()
        return false
      }
      
      // schedules가 ref 객체인지 확인하고 .value로 접근
      const schedulesData = schedules.value || schedules
      
      const key = `${party}-${raid}`
      
      // 스케줄에 해당 키가 없으면 빈 배열로 초기화
      if (!schedulesData[key]) {
        schedulesData[key] = []
      }
      
      // 1. 이미 배치된 캐릭터인지 확인 (같은 셀 내 중복 방지)
      const isAlreadyScheduled = schedulesData[key].some(
        char => char.name === draggedCharacter.value.name
      )
      
      // 2. 동일한 레이드의 다른 파티에 이미 배치되어 있는지 확인
      const isAlreadyInSameRaid = Object.keys(schedulesData).some(scheduleKey => {
        const [existingParty, existingRaid] = scheduleKey.split('-')
        // 같은 레이드이지만 다른 파티인 경우
        if (existingRaid === raid && existingParty !== party) {
          return schedulesData[scheduleKey].some(
            char => char.name === draggedCharacter.value.name
          )
        }
        return false
      })
      
      // 3. 캐릭터가 이미 3개 레이드에 배치되어 있는지 확인
      const characterRaids = getCharacterRaids ? getCharacterRaids(draggedCharacter.value.name) : []
      const isCharacterAtMaxRaids = characterRaids.length >= 3 && !characterRaids.includes(raid)
      
      // 4. 같은 유저의 다른 캐릭터가 이미 해당 셀에 배치되어 있는지 확인
      const isSameUserInSameRaid = schedulesData[key].some(
        char => char.userId === draggedCharacter.value.userId
      )
      
      if (!isAlreadyScheduled && !isAlreadyInSameRaid && !isCharacterAtMaxRaids && !isSameUserInSameRaid) {
        schedulesData[key].push({
          ...draggedCharacter.value,
          scheduleId: Date.now(),
          raidName: raid,
          partyName: party
        })
        
        // 스케줄 변경사항 추적
        if (markScheduleAsChanged) {
          markScheduleAsChanged()
        } else {
          console.warn('⚠️ markScheduleAsChanged 함수가 전달되지 않음')
        }
        
        resetDragState()
        return true // 성공적으로 배치됨
      }
    }
    
    resetDragState()
    return false // 배치되지 않음
  }

  // 드래그 상태 초기화
  const resetDragState = () => {
    draggedCharacter.value = null
    dragState.value = { type: null, data: null, sourceIndex: null, userName: null }
  }

  // 우클릭 처리 - 스케줄 완료 토글만 (캐릭터 삭제는 더블클릭으로)
  const onRightClick = (event, party, raid, characterIndex, schedules, toggleScheduleFinish, isScheduleFinished, markScheduleAsChanged) => {
    event.preventDefault()
    
    // 캐릭터가 있는 경우에도 우클릭은 무시하고, 빈 셀에서만 완료 상태 토글
    if (characterIndex === undefined || characterIndex === null) {
      // 빈 셀이면 스케줄 완료 상태 토글
      if (toggleScheduleFinish) {
        toggleScheduleFinish(party, raid)
        // 완료 상태 변경도 스케줄 변경사항으로 추적
        if (markScheduleAsChanged) {
          markScheduleAsChanged()
        }
        return true // 상태가 변경됨
      }
    }
    return false // 상태가 변경되지 않음
  }

  return {
    // 상태
    draggedCharacter,
    dragState,
    
    // 드래그 시작 함수들
    onCharacterDragStart,
    onRaidDragStart,
    onPartyDragStart,
    onCharacterOrderDragStart,
    
    // 드롭 함수들
    onDragOver,
    onRaidDrop,
    onPartyDrop,
    onCharacterOrderDrop,
    onScheduleDrop,
    onRightClick,
    
    // 유틸리티
    resetDragState
  }
}
