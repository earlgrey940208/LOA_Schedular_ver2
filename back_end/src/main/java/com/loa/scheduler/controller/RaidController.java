package com.loa.scheduler.controller;

import com.loa.scheduler.entity.Raid;
import com.loa.scheduler.repository.RaidRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/raid")
@CrossOrigin(origins = {"http://localhost:19014", "http://192.168.219.100:19014", "http://192.168.219.102:19014", "http://192.168.219.103:19014", "http://1.213.234.164:19014", "http://112.149.7.35:19014", "http://172.30.96.1:19014", "http://localhost:5174"})
public class RaidController {
    
    @Autowired
    private RaidRepository raidRepository;
    
    // 모든 레이드 조회 (seq 순으로 정렬)
    @GetMapping
    public List<Raid> getAllRaids() {
        return raidRepository.findAllOrderBySeq();
    }
    
    // 레이드 생성
    @PostMapping
    public ResponseEntity<Raid> createRaid(@Valid @RequestBody Raid raid) {
        if (raidRepository.existsByName(raid.getName())) {
            return ResponseEntity.badRequest().build();
        }
        
        // seq가 설정되지 않은 경우 자동으로 최대값 + 1로 설정
        if (raid.getSeq() == null) {
            Long maxSeq = raidRepository.findMaxSeq();
            raid.setSeq(maxSeq + 1);
        }
        
        Raid savedRaid = raidRepository.save(raid);
        return ResponseEntity.ok(savedRaid);
    }
    
    // 레이드 수정
    @PutMapping("/{name}")
    public ResponseEntity<Raid> updateRaid(@PathVariable String name, @Valid @RequestBody Raid raidDetails) {
        Optional<Raid> optionalRaid = raidRepository.findById(name);
        if (optionalRaid.isPresent()) {
            Raid raid = optionalRaid.get();
            // name은 primary key이므로 변경 불가, seq만 수정
            raid.setSeq(raidDetails.getSeq());
            Raid updatedRaid = raidRepository.save(raid);
            return ResponseEntity.ok(updatedRaid);
        }
        return ResponseEntity.notFound().build();
    }
    
    // 레이드 삭제
    @DeleteMapping("/{name}")
    public ResponseEntity<Void> deleteRaid(@PathVariable String name) {
        if (raidRepository.existsById(name)) {
            raidRepository.deleteById(name);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // 레이드 순서 업데이트 (일괄)
    @PutMapping("/order")
    public ResponseEntity<List<Raid>> updateRaidOrder(@Valid @RequestBody List<RaidOrderUpdate> updates) {
        try {
            for (RaidOrderUpdate update : updates) {
                Optional<Raid> optionalRaid = raidRepository.findById(update.getName());
                if (optionalRaid.isPresent()) {
                    Raid raid = optionalRaid.get();
                    raid.setSeq(Long.valueOf(update.getSeq()));
                    raidRepository.save(raid);
                }
            }
            
            // 업데이트된 전체 레이드 목록을 seq 순으로 반환
            List<Raid> updatedRaids = raidRepository.findAll();
            updatedRaids.sort((a, b) -> Long.compare(a.getSeq(), b.getSeq()));
            return ResponseEntity.ok(updatedRaids);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 레이드 순서 업데이트를 위한 DTO 클래스
    public static class RaidOrderUpdate {
        private String name;
        private Integer seq;
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Integer getSeq() { return seq; }
        public void setSeq(Integer seq) { this.seq = seq; }
    }
}