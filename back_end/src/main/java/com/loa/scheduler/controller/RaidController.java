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
@CrossOrigin(origins = "http://localhost:5173")
public class RaidController {
    
    @Autowired
    private RaidRepository raidRepository;
    
    // 모든 레이드 조회
    @GetMapping
    public List<Raid> getAllRaids() {
        return raidRepository.findAll();
    }
    
    // 레이드 생성
    @PostMapping
    public ResponseEntity<Raid> createRaid(@Valid @RequestBody Raid raid) {
        if (raidRepository.existsByName(raid.getName())) {
            return ResponseEntity.badRequest().build();
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
}