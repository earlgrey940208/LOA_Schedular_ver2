package com.loa.scheduler.controller;

import com.loa.scheduler.entity.Schedule;
import com.loa.scheduler.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = "http://localhost:5173")
public class ScheduleController {
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    // 모든 스케줄 조회
    @GetMapping
    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }
    
    // 레이드별 스케줄 조회
    @GetMapping("/raid/{raidName}")
    public List<Schedule> getSchedulesByRaidName(@PathVariable String raidName) {
        return scheduleRepository.findByRaidName(raidName);
    }
    
    // 캐릭터별 스케줄 조회
    @GetMapping("/character/{characterName}")
    public List<Schedule> getSchedulesByCharacterName(@PathVariable String characterName) {
        return scheduleRepository.findByCharacterName(characterName);
    }
    
    // 완료 여부별 스케줄 조회
    @GetMapping("/status/{isFinish}")
    public List<Schedule> getSchedulesByStatus(@PathVariable Boolean isFinish) {
        return scheduleRepository.findByIsFinish(isFinish);
    }
    
    // 스케줄 ID로 조회
    @GetMapping("/{id}")
    public ResponseEntity<Schedule> getScheduleById(@PathVariable Long id) {
        Optional<Schedule> schedule = scheduleRepository.findById(id);
        return schedule.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    
    // 스케줄 생성
    @PostMapping
    public ResponseEntity<Schedule> createSchedule(@Valid @RequestBody Schedule schedule) {
        Schedule savedSchedule = scheduleRepository.save(schedule);
        return ResponseEntity.ok(savedSchedule);
    }
    
    // 스케줄 수정
    @PutMapping("/{id}")
    public ResponseEntity<Schedule> updateSchedule(@PathVariable Long id, @Valid @RequestBody Schedule scheduleDetails) {
        Optional<Schedule> optionalSchedule = scheduleRepository.findById(id);
        if (optionalSchedule.isPresent()) {
            Schedule schedule = optionalSchedule.get();
            schedule.setRaidName(scheduleDetails.getRaidName());
            schedule.setCharacterName(scheduleDetails.getCharacterName());
            schedule.setIsFinish(scheduleDetails.getIsFinish());
            Schedule updatedSchedule = scheduleRepository.save(schedule);
            return ResponseEntity.ok(updatedSchedule);
        }
        return ResponseEntity.notFound().build();
    }
    
    // 스케줄 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        if (scheduleRepository.existsById(id)) {
            scheduleRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}