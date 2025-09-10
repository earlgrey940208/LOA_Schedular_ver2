package com.loa.scheduler.util;

import com.loa.scheduler.repository.ScheduleRepository;
import com.loa.scheduler.repository.UserScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class WeeklyResetTask {
    @Autowired
    private ScheduleRepository scheduleRepository;
    @Autowired
    private UserScheduleRepository userScheduleRepository;

    // 매주 수요일 오전 5시마다 실행
    @Scheduled(cron = "0 0 5 ? * WED", zone = "Asia/Seoul")
    @Transactional
    public void resetSchedulesAndUserSchedules() {
        // 1. raid_schedule의 is_finish를 N으로 일괄 변경
        scheduleRepository.updateAllIsFinishToN();
        
        // 2. user_schedule 주간 데이터 이동
        // 2-1. 1주차 데이터 삭제
        userScheduleRepository.deleteWeek1Data();
        // 2-2. 2주차 데이터를 1주차로 이동
        userScheduleRepository.moveWeek2ToWeek1();
    }
}
