package com.loa.scheduler.controller;

import com.loa.scheduler.entity.UserSchedule;
import com.loa.scheduler.repository.UserScheduleRepository;
import com.loa.scheduler.service.WeeklyScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user_schedule")
@CrossOrigin(origins = {"*", "http://localhost:5174"})
public class UserScheduleController {
    
    @Autowired
    private UserScheduleRepository userScheduleRepository;
    
    @Autowired
    private WeeklyScheduleService weeklyScheduleService;
    
    // 모든 유저 일정 조회
    @GetMapping
    public ResponseEntity<List<UserSchedule>> getAllUserSchedules() {
        try {
            List<UserSchedule> schedules = userScheduleRepository.findAllOrderedByUserAndDay();
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    // 특정 유저 일정 조회
    @GetMapping("/{userId}")
    public ResponseEntity<List<UserSchedule>> getUserSchedules(@PathVariable String userId) {
        try {
            List<UserSchedule> schedules = userScheduleRepository.findByUserId(userId);
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    // 일정 저장 (생성/업데이트)
    @PostMapping
    public ResponseEntity<UserSchedule> saveUserSchedule(@RequestBody UserSchedule userSchedule) {
        try {
            // weekNumber가 없으면 기본값 1로 설정
            if (userSchedule.getWeekNumber() == null) {
                userSchedule.setWeekNumber(1);
            }
            
            // 기존 데이터 확인 (userId, dayOfWeek, weekNumber로 찾기)
            Optional<UserSchedule> existing = userScheduleRepository
                .findByUserIdAndDayOfWeekAndWeekNumber(
                    userSchedule.getUserId(), 
                    userSchedule.getDayOfWeek(), 
                    userSchedule.getWeekNumber()
                );
            
            UserSchedule savedSchedule;
            if (existing.isPresent()) {
                // 업데이트
                UserSchedule existingSchedule = existing.get();
                existingSchedule.setScheduleText(userSchedule.getScheduleText());
                existingSchedule.setEnabled(userSchedule.getEnabled());
                savedSchedule = userScheduleRepository.save(existingSchedule);
            } else {
                // 새로 생성
                savedSchedule = userScheduleRepository.save(userSchedule);
            }
            
            return ResponseEntity.ok(savedSchedule);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    // 일괄 저장
    @PostMapping("/batch")
    public ResponseEntity<String> saveAllUserSchedules(@RequestBody List<UserSchedule> userSchedules) {
        try {
            for (UserSchedule userSchedule : userSchedules) {
                // weekNumber가 없으면 기본값 1로 설정
                if (userSchedule.getWeekNumber() == null) {
                    userSchedule.setWeekNumber(1);
                }
                
                // 기존 데이터 확인 (userId, dayOfWeek, weekNumber로 찾기)
                Optional<UserSchedule> existing = userScheduleRepository
                    .findByUserIdAndDayOfWeekAndWeekNumber(
                        userSchedule.getUserId(), 
                        userSchedule.getDayOfWeek(), 
                        userSchedule.getWeekNumber()
                    );
                
                if (existing.isPresent()) {
                    // 업데이트
                    UserSchedule existingSchedule = existing.get();
                    existingSchedule.setScheduleText(userSchedule.getScheduleText());
                    existingSchedule.setEnabled(userSchedule.getEnabled());
                    userScheduleRepository.save(existingSchedule);
                } else {
                    // 새로 생성
                    userScheduleRepository.save(userSchedule);
                }
            }
            
            return ResponseEntity.ok("일정이 성공적으로 저장되었습니다.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("일정 저장에 실패했습니다.");
        }
    }
    
    // 특정 일정 삭제
    @DeleteMapping("/{userId}/{dayOfWeek}/{weekNumber}")
    public ResponseEntity<String> deleteUserSchedule(
            @PathVariable String userId, 
            @PathVariable String dayOfWeek, 
            @PathVariable Integer weekNumber) {
        try {
            Optional<UserSchedule> existing = userScheduleRepository
                .findByUserIdAndDayOfWeekAndWeekNumber(userId, dayOfWeek, weekNumber);
            if (existing.isPresent()) {
                userScheduleRepository.delete(existing.get());
                return ResponseEntity.ok("일정이 삭제되었습니다.");
            } else {
                return ResponseEntity.status(404).body("해당 일정을 찾을 수 없습니다.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("일정 삭제에 실패했습니다.");
        }
    }
    
    // 기존 삭제 메서드 (하위 호환성)
    @DeleteMapping("/{userId}/{dayOfWeek}")
    public ResponseEntity<String> deleteUserScheduleOld(@PathVariable String userId, @PathVariable String dayOfWeek) {
        return deleteUserSchedule(userId, dayOfWeek, 1); // 기본값으로 1주차
    }
    
    // 수동 주차 전환 API
    @PostMapping("/advance-week")
    public ResponseEntity<String> advanceWeek() {
        try {
            weeklyScheduleService.manualAdvanceWeek();
            return ResponseEntity.ok("주차 전환이 완료되었습니다.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("주차 전환에 실패했습니다: " + e.getMessage());
        }
    }
    
    // 개별 유저 스케줄 저장 (즉시 저장용)
    @PostMapping("/single")
    public ResponseEntity<UserSchedule> saveSingleUserSchedule(@RequestBody UserSchedule userSchedule) {
        try {
            // 기존 스케줄이 있는지 확인
            Optional<UserSchedule> existing = userScheduleRepository.findByUserIdAndDayOfWeekAndWeekNumber(
                userSchedule.getUserId(), 
                userSchedule.getDayOfWeek(), 
                userSchedule.getWeekNumber()
            );
            
            UserSchedule scheduleToSave;
            if (existing.isPresent()) {
                // 기존 스케줄 업데이트
                scheduleToSave = existing.get();
                scheduleToSave.setScheduleText(userSchedule.getScheduleText());
                scheduleToSave.setEnabled(userSchedule.getEnabled());
            } else {
                // 새 스케줄 생성
                scheduleToSave = userSchedule;
            }
            
            UserSchedule savedSchedule = userScheduleRepository.save(scheduleToSave);
            return ResponseEntity.ok(savedSchedule);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
