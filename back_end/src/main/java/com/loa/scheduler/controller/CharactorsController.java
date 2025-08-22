package com.loa.scheduler.controller;

import com.loa.scheduler.entity.Charactors;
import com.loa.scheduler.repository.CharactorsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/charactors")
@CrossOrigin(origins = "http://localhost:5173")
public class CharactorsController {
    
    @Autowired
    private CharactorsRepository CharactorsRepository;
    
    // 모든 캐릭터 조회
    @GetMapping
    public List<Charactors> getAllCharactors() {
        return CharactorsRepository.findAll();
    }
    
    // 사용자별 캐릭터 조회
    @GetMapping("/user/{userId}")
    public List<Charactors> getCharactorsByUserId(@PathVariable String userId) {
        return CharactorsRepository.findByUserId(userId);
    }
    
    // 캐릭터 ID로 조회
    @GetMapping("/{id}")
    public ResponseEntity<Charactors> getCharacterById(@PathVariable Long id) {
        Optional<Charactors> character = CharactorsRepository.findById(id);
        return character.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    
    // 캐릭터 생성
    @PostMapping
    public ResponseEntity<Charactors> createCharacter(@Valid @RequestBody Charactors character) {
        if (CharactorsRepository.existsByName(character.getName())) {
            return ResponseEntity.badRequest().build();
        }
        Charactors savedCharacter = CharactorsRepository.save(character);
        return ResponseEntity.ok(savedCharacter);
    }
    
    // 캐릭터 수정
    @PutMapping("/{id}")
    public ResponseEntity<Charactors> updateCharacter(@PathVariable Long id, @Valid @RequestBody Charactors characterDetails) {
        Optional<Charactors> optionalCharacter = CharactorsRepository.findById(id);
        if (optionalCharacter.isPresent()) {
            Charactors character = optionalCharacter.get();
            character.setName(characterDetails.getName());
            character.setIsSupporter(characterDetails.getIsSupporter());
            character.setUserId(characterDetails.getUserId());
            Charactors updatedCharacter = CharactorsRepository.save(character);
            return ResponseEntity.ok(updatedCharacter);
        }
        return ResponseEntity.notFound().build();
    }
    
    // 캐릭터 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCharacter(@PathVariable Long id) {
        if (CharactorsRepository.existsById(id)) {
            CharactorsRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}