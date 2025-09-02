package com.loa.scheduler.service;

import com.loa.scheduler.entity.UserSchedule;
import com.loa.scheduler.repository.UserScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WeeklyScheduleService {
    
    @Autowired
    private UserScheduleRepository userScheduleRepository;
    
    /**
     * 매주 수요일 오전 5시에 주차 전환 실행
     * cron: 초 분 시 일 월 요일
     * "0 0 5 * * WED" = 매주 수요일 오전 5시
     */
    @Scheduled(cron = "0 0 5 * * WED", zone = "Asia/Seoul")
    @Transactional
    public void advanceWeek() {
        try {
            System.out.println("=== 주차 전환 배치 시작 ===");
            System.out.println("실행 시간: " + LocalDateTime.now());
            
            // 1. 기존 1주차 데이터 삭제
            List<UserSchedule> week1Schedules = userScheduleRepository.findByWeekNumber(1);
            if (!week1Schedules.isEmpty()) {
                userScheduleRepository.deleteAll(week1Schedules);
                System.out.println("기존 1주차 데이터 삭제 완료: " + week1Schedules.size() + "개");
            }
            
            // 2. 2주차 데이터를 1주차로 변경
            List<UserSchedule> week2Schedules = userScheduleRepository.findByWeekNumber(2);
            for (UserSchedule schedule : week2Schedules) {
                schedule.setWeekNumber(1);  // 2주차를 1주차로 변경
            }
            
            if (!week2Schedules.isEmpty()) {
                userScheduleRepository.saveAll(week2Schedules);
                System.out.println("2주차 → 1주차 변환 완료: " + week2Schedules.size() + "개");
            }
            
            // 3. 2주차는 자동으로 비워짐 (기존 2주차 데이터가 1주차로 변경되므로)
            
            System.out.println("=== 주차 전환 배치 완료 ===");
            
        } catch (Exception e) {
            System.err.println("주차 전환 배치 실행 중 오류 발생: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * 수동 주차 전환 (API 호출용)
     */
    @Transactional
    public void manualAdvanceWeek() {
        System.out.println("=== 수동 주차 전환 실행 ===");
        advanceWeek();
    }
}
