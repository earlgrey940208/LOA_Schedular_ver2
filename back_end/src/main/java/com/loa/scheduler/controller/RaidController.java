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
    @PutMapping("/{id}")
    public ResponseEntity<Raid> updateRaid(@PathVariable Long id, @Valid @RequestBody Raid raidDetails) {
        Optional<Raid> optionalRaid = raidRepository.findById(id);
        if (optionalRaid.isPresent()) {
            Raid raid = optionalRaid.get();
            raid.setName(raidDetails.getName());
            Raid updatedRaid = raidRepository.save(raid);
            return ResponseEntity.ok(updatedRaid);
        }
        return ResponseEntity.notFound().build();
    }
    
    // 레이드 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRaid(@PathVariable Long id) {
        if (raidRepository.existsById(id)) {
            raidRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}