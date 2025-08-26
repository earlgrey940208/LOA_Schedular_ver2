package com.loa.scheduler.controller;

import com.loa.scheduler.entity.UserSchedule;
import com.loa.scheduler.repository.UserScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user_schedule")
@CrossOrigin(origins = "*")
public class UserScheduleController {
    
    @Autowired
    private UserScheduleRepository userScheduleRepository;
    
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
            // 기존 데이터 확인
            Optional<UserSchedule> existing = userScheduleRepository
                .findByUserIdAndDayOfWeek(userSchedule.getUserId(), userSchedule.getDayOfWeek());
            
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
                // 기존 데이터 확인
                Optional<UserSchedule> existing = userScheduleRepository
                    .findByUserIdAndDayOfWeek(userSchedule.getUserId(), userSchedule.getDayOfWeek());
                
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
    @DeleteMapping("/{userId}/{dayOfWeek}")
    public ResponseEntity<String> deleteUserSchedule(@PathVariable String userId, @PathVariable String dayOfWeek) {
        try {
            Optional<UserSchedule> existing = userScheduleRepository.findByUserIdAndDayOfWeek(userId, dayOfWeek);
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
}
