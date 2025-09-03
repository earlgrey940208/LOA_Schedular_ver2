// 2주차 시스템 지원 - 주차 정보 (현재 날짜 기준으로 계산)
export const calculateWeekInfo = () => {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=일요일, 1=월요일, ..., 6=토요일
  
  // 로스트아크 주간 리셋은 수요일이므로, 수요일을 기준으로 주차 계산
  // 수요일(3)을 주의 시작점으로 설정
  const daysFromWednesday = (dayOfWeek + 4) % 7 // 수요일부터의 경과 일수
  const thisWednesday = new Date(today)
  thisWednesday.setDate(today.getDate() - daysFromWednesday)
  
  // 1주차: 이번 주 수요일 ~ 다음 주 화요일
  const week1Start = new Date(thisWednesday)
  const week1End = new Date(thisWednesday)
  week1End.setDate(week1Start.getDate() + 6)
  
  // 2주차: 다음 주 수요일 ~ 그 다음 주 화요일  
  const week2Start = new Date(week1Start)
  week2Start.setDate(week1Start.getDate() + 7)
  const week2End = new Date(week2Start)
  week2End.setDate(week2Start.getDate() + 6)
  
  return {
    week1DateRange: `${week1Start.getMonth()+1}/${week1Start.getDate()}~${week1End.getMonth()+1}/${week1End.getDate()}`,
    week2DateRange: `${week2Start.getMonth()+1}/${week2Start.getDate()}~${week2End.getMonth()+1}/${week2End.getDate()}`
  }
}
