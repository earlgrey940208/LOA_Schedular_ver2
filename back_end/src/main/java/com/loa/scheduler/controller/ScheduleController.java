package com.loa.scheduler.controller;

import com.loa.scheduler.entity.Schedule;
import com.loa.scheduler.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/Schedule")
@CrossOrigin(origins = {"http://localhost:19014", "http://192.168.219.100:19014", "http://192.168.219.103:19014", "http://1.213.234.164:19014"})
public class ScheduleController {
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    // 모든 스케줄 조회
    @GetMapping
    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }
    
    // 파티별 스케줄 조회
    @GetMapping("/party/{partyName}")
    public List<Schedule> getSchedulesByParty(@PathVariable String partyName) {
        return scheduleRepository.findById(partyName);
    }
    
    // 레이드별 스케줄 조회
    @GetMapping("/raid/{raidName}")
    public List<Schedule> getSchedulesByRaidName(@PathVariable String raidName) {
        return scheduleRepository.findByRaidName(raidName);
    }
    
    // 특정 파티와 레이드의 스케줄 조회
    @GetMapping("/party/{partyName}/raid/{raidName}")
    public List<Schedule> getSchedulesByPartyAndRaid(@PathVariable String partyName, @PathVariable String raidName) {
        return scheduleRepository.findByIdAndRaidName(partyName, raidName);
    }
    
    // 캐릭터별 스케줄 조회
    @GetMapping("/character/{characterName}")
    public List<Schedule> getSchedulesByCharacterName(@PathVariable String characterName) {
        return scheduleRepository.findByCharacterName(characterName);
    }
    
    // 스케줄 생성
    @PostMapping
    public ResponseEntity<Schedule> createSchedule(@Valid @RequestBody Schedule schedule) {
        Schedule savedSchedule = scheduleRepository.save(schedule);
        return ResponseEntity.ok(savedSchedule);
    }
    
    // 스케줄 일괄 저장 (프론트엔드에서 사용)
    @PostMapping("/batch")
    @Transactional
    public ResponseEntity<String> saveSchedules(@RequestBody Map<String, Object> scheduleData) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> schedules = (Map<String, Object>) scheduleData.get("schedules");
            @SuppressWarnings("unchecked")
            Map<String, Boolean> scheduleFinish = (Map<String, Boolean>) scheduleData.get("scheduleFinish");
            
            // 기존 스케줄 모두 삭제
            scheduleRepository.deleteAll();
            
            // 새 스케줄 저장
            for (Map.Entry<String, Object> entry : schedules.entrySet()) {
                String key = entry.getKey(); // "1파티-하기르" 형태
                String[] parts = key.split("-");
                if (parts.length == 2) {
                    String partyName = parts[0];
                    String raidName = parts[1];
                    
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> characters = (List<Map<String, Object>>) entry.getValue();
                    
                    // 완료 상태 확인
                    String isFinish = (scheduleFinish != null && scheduleFinish.getOrDefault(key, false)) ? "Y" : "N";
                    
                    // 각 캐릭터를 별도 행으로 저장
                    for (Map<String, Object> character : characters) {
                        String characterName = (String) character.get("name");
                        
                        if (characterName != null && !characterName.trim().isEmpty()) {
                            Schedule schedule = new Schedule(partyName, raidName, characterName, isFinish);
                            scheduleRepository.save(schedule);
                            System.out.println("저장된 스케줄: " + partyName + "-" + raidName + "-" + characterName);
                        }
                    }
                }
            }
            
            return ResponseEntity.ok().body("{\"message\": \"스케줄이 성공적으로 저장되었습니다.\"}");
        } catch (Exception e) {
            e.printStackTrace(); // 상세 오류 로그
            return ResponseEntity.badRequest().body("{\"error\": \"스케줄 저장 실패: " + e.getMessage() + "\"}");
        }
    }
    
    // 특정 파티와 레이드의 완료 상태 업데이트
    @PutMapping("/finish/{partyName}/{raidName}")
    @Transactional
    public ResponseEntity<String> updateScheduleFinish(@PathVariable String partyName, @PathVariable String raidName, @RequestBody Map<String, Boolean> request) {
        try {
            Boolean isFinish = request.get("isFinish");
            String finishStatus = (isFinish != null && isFinish) ? "Y" : "N";
            scheduleRepository.updateIsFinishByIdAndRaidName(partyName, raidName, finishStatus);
            return ResponseEntity.ok().body("{\"message\": \"완료 상태가 업데이트되었습니다.\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"완료 상태 업데이트 실패: " + e.getMessage() + "\"}");
        }
    }
    
    // 특정 파티와 레이드의 스케줄 삭제
    @DeleteMapping("/party/{partyName}/raid/{raidName}")
    @Transactional
    public ResponseEntity<String> deleteScheduleByPartyAndRaid(@PathVariable String partyName, @PathVariable String raidName) {
        try {
            scheduleRepository.deleteByIdAndRaidName(partyName, raidName);
            return ResponseEntity.ok().body("{\"message\": \"스케줄이 삭제되었습니다.\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"스케줄 삭제 실패: " + e.getMessage() + "\"}");
        }
    }
}