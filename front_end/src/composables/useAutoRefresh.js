import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/services/api'

export function useAutoRefresh(loadDataFn) {
  const lastUpdated = ref(null)
  const isCheckingUpdates = ref(false)
  const isSSEConnected = ref(false)
  let eventSource = null
  
  // SSE 연결 설정
  const setupSSE = () => {
    try {
      const sseUrl = process.env.NODE_ENV === 'production' 
        ? '/api/events/updates'
        : 'http://localhost:19013/api/events/updates'
      
      eventSource = new EventSource(sseUrl)
      
      eventSource.onopen = () => {
        console.log('🔗 SSE 연결 성공')
        isSSEConnected.value = true
      }
      
      eventSource.onmessage = (event) => {
        console.log('📨 SSE 메시지 수신:', event.data)
      }
      
      // 연결 성공 이벤트
      eventSource.addEventListener('connected', (event) => {
        console.log('✅ SSE 연결 확인:', event.data)
      })
      
      // 마지막 업데이트 시간 수신
      eventSource.addEventListener('lastUpdated', (event) => {
        const serverTimestamp = new Date(event.data)
        console.log('🕐 서버 업데이트 시간:', serverTimestamp)
        
        if (lastUpdated.value && serverTimestamp > lastUpdated.value) {
          console.log('🔄 데이터 변화 감지됨, 자동 갱신 중...')
          triggerAutoRefresh()
        }
        lastUpdated.value = serverTimestamp
      })
      
      // 캐릭터 관련 이벤트들
      eventSource.addEventListener('character-created', (event) => {
        console.log('👤 캐릭터 생성:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('character-updated', (event) => {
        console.log('✏️ 캐릭터 수정:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('character-deleted', (event) => {
        console.log('🗑️ 캐릭터 삭제:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('character-batch-saved', (event) => {
        console.log('💾 캐릭터 일괄저장:', event.data)
        triggerAutoRefresh()
      })
      
      // 스케줄 관련 이벤트들
      eventSource.addEventListener('schedule-created', (event) => {
        console.log('📅 스케줄 생성:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('schedule-batch-saved', (event) => {
        console.log('💾 스케줄 일괄저장:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('schedule-finish-updated', (event) => {
        console.log('✅ 스케줄 완료상태:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('schedule-deleted', (event) => {
        console.log('🗑️ 스케줄 삭제:', event.data)
        triggerAutoRefresh()
      })
      
      // 레이드 관련 이벤트들
      eventSource.addEventListener('raid-created', (event) => {
        console.log('🏔️ 레이드 생성:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('raid-updated', (event) => {
        console.log('✏️ 레이드 수정:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('raid-deleted', (event) => {
        console.log('🗑️ 레이드 삭제:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('raid-order-updated', (event) => {
        console.log('🔄 레이드 순서변경:', event.data)
        triggerAutoRefresh()
      })
      
      // 유저 일정 관련 이벤트들
      eventSource.addEventListener('user-schedule-created', (event) => {
        console.log('👤📅 유저일정 생성:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('user-schedule-updated', (event) => {
        console.log('✏️📅 유저일정 수정:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('user-schedule-deleted', (event) => {
        console.log('🗑️📅 유저일정 삭제:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('user-schedule-batch-saved', (event) => {
        console.log('💾📅 유저일정 일괄저장:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('week-advanced', (event) => {
        console.log('📅🔄 주차전환:', event.data)
        triggerAutoRefresh()
      })
      
      // 유저 관련 이벤트들
      eventSource.addEventListener('user-created', (event) => {
        console.log('👤 유저 생성:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('user-updated', (event) => {
        console.log('✏️ 유저 수정:', event.data)
        triggerAutoRefresh()
      })
      
      eventSource.addEventListener('user-deleted', (event) => {
        console.log('🗑️ 유저 삭제:', event.data)
        triggerAutoRefresh()
      })
      
      // 연결 에러 처리
      eventSource.onerror = (error) => {
        console.error('❌ SSE 연결 에러:', error)
        isSSEConnected.value = false
        
        // 연결이 끊어지면 잠시 후 재연결 시도
        setTimeout(() => {
          if (eventSource && eventSource.readyState === EventSource.CLOSED) {
            console.log('🔄 SSE 재연결 시도...')
            setupSSE()
          }
        }, 5000)
      }
      
    } catch (error) {
      console.error('❌ SSE 설정 실패:', error)
      // SSE 실패 시 폴백으로 기존 방식 사용
      setupFallbackPolling()
    }
  }
  
  // SSE가 실패했을 때 폴백 폴링
  const setupFallbackPolling = () => {
    console.log('🔄 SSE 실패, 폴링 방식으로 전환')
    const pollInterval = setInterval(async () => {
      await checkForUpdates()
    }, 10000) // 10초마다 체크
    
    // 컴포넌트 언마운트 시 정리
    onUnmounted(() => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    })
  }
  
  // 자동 갱신 트리거
  const triggerAutoRefresh = async () => {
    if (isCheckingUpdates.value) return
    
    try {
      isCheckingUpdates.value = true
      await loadDataFn()
    } catch (error) {
      console.warn('자동갱신 실패:', error)
    } finally {
      isCheckingUpdates.value = false
    }
  }
  
  // 기존 수동 체크 함수 (폴백용)
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
    // SSE가 연결되어 있으면 서버에서 자동으로 알림이 올 것이므로 별도 체크 불필요
    if (!isSSEConnected.value) {
      setTimeout(checkForUpdates, 1000)
    }
  }
  
  // 페이지 포커스 시 체크
  const handleFocus = () => {
    if (!isSSEConnected.value) {
      checkForUpdates()
    }
  }
  
  // 이벤트 리스너 등록 및 SSE 시작
  onMounted(() => {
    window.addEventListener('focus', handleFocus)
    setupSSE()
  })
  
  onUnmounted(() => {
    window.removeEventListener('focus', handleFocus)
    
    // SSE 연결 정리
    if (eventSource) {
      console.log('🔌 SSE 연결 종료')
      eventSource.close()
      eventSource = null
    }
  })
  
  return {
    lastUpdated,
    isCheckingUpdates,
    isSSEConnected,
    checkForUpdates,
    checkAfterSave
  }
}
