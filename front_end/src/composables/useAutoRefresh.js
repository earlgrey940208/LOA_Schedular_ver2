import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/services/api'

export function useAutoRefresh(loadDataFn) {
  const lastUpdated = ref(null)
  const isCheckingUpdates = ref(false)
  
  // 데이터 변화 체크 함수
  const checkForUpdates = async () => {
    if (isCheckingUpdates.value) return
    
    try {
      isCheckingUpdates.value = true
      const serverTimestamp = await api.getLastUpdated()
      
      if (lastUpdated.value && serverTimestamp > lastUpdated.value) {
        console.log('데이터 변화 감지됨, 자동 갱신 중...')
        await loadDataFn()
        lastUpdated.value = serverTimestamp
      } else if (!lastUpdated.value) {
        // 초기값 설정
        lastUpdated.value = serverTimestamp
      }
    } catch (error) {
      console.warn('자동갱신 체크 실패:', error)
    } finally {
      isCheckingUpdates.value = false
    }
  }
  
  // 자동저장 완료 후 체크
  const checkAfterSave = async () => {
    // 잠시 대기 후 체크 (서버 업데이트 완료 대기)
    setTimeout(checkForUpdates, 1000)
  }
  
  // 페이지 포커스 시 체크
  const handleFocus = () => {
    checkForUpdates()
  }
  
  // 이벤트 리스너 등록
  onMounted(() => {
    window.addEventListener('focus', handleFocus)
  })
  
  onUnmounted(() => {
    window.removeEventListener('focus', handleFocus)
  })
  
  return {
    lastUpdated,
    isCheckingUpdates,
    checkForUpdates,
    checkAfterSave
  }
}
