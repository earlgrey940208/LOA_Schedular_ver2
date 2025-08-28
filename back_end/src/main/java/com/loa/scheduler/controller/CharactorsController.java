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
@CrossOrigin(origins = {"http://localhost:19014", "http://192.168.219.100:19014", "http://192.168.219.102:19014", "http://192.168.219.103:19014", "http://1.213.234.164:19014"})
public class CharactorsController {
    
    @Autowired
    private CharactorsRepository CharactorsRepository;
    
    // 모든 캐릭터 조회 (user seq 순으로 정렬)
    @GetMapping
    public List<Charactors> getAllCharactors() {
        return CharactorsRepository.findAllOrderByUserSeqAndCharacterSeq();
    }
    
    // 사용자별 캐릭터 조회 (seq 순서대로)
    @GetMapping("/user/{userId}")
    public List<Charactors> getCharactorsByUserId(@PathVariable String userId) {
        return CharactorsRepository.findByUserIdOrderBySeqAsc(userId);
    }
    
    // 캐릭터 이름으로 조회
    @GetMapping("/{name}")
    public ResponseEntity<Charactors> getCharacterByName(@PathVariable String name) {
        Optional<Charactors> character = CharactorsRepository.findById(name);
        return character.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    
    // 캐릭터 생성 (seq 자동 생성)
    @PostMapping
    public ResponseEntity<Charactors> createCharacter(@RequestBody Charactors character) {
        // seq 자동 생성: 해당 userId의 max seq + 1
        Optional<Integer> maxSeq = CharactorsRepository.findMaxSeqByUserId(character.getUserId());
        int nextSeq = maxSeq.orElse(0) + 1;
        character.setSeq(nextSeq);
        
        // 캐릭터 이름 중복 체크
        if (CharactorsRepository.existsByName(character.getName())) {
            return ResponseEntity.badRequest().build();
        }
        
        Charactors savedCharacter = CharactorsRepository.save(character);
        return ResponseEntity.ok(savedCharacter);
    }
    
    // 캐릭터 수정
    @PutMapping("/{name}")
    public ResponseEntity<Charactors> updateCharacter(@PathVariable String name, @Valid @RequestBody Charactors characterDetails) {
        Optional<Charactors> optionalCharacter = CharactorsRepository.findById(name);
        if (optionalCharacter.isPresent()) {
            Charactors character = optionalCharacter.get();
            // name은 primary key이므로 변경 불가
            character.setIsSupporter(characterDetails.getIsSupporter());
            character.setUserId(characterDetails.getUserId());
            character.setSeq(characterDetails.getSeq());
            Charactors updatedCharacter = CharactorsRepository.save(character);
            return ResponseEntity.ok(updatedCharacter);
        }
        return ResponseEntity.notFound().build();
    }
    
    // 캐릭터 삭제
    @DeleteMapping("/{name}")
    public ResponseEntity<Void> deleteCharacter(@PathVariable String name) {
        if (CharactorsRepository.existsById(name)) {
            CharactorsRepository.deleteById(name);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // 캐릭터 일괄 저장 (upsert)
    @PutMapping("/batch")
    public ResponseEntity<List<Charactors>> saveAllCharacters(@RequestBody List<Charactors> characters) {
        try {
            // 각 캐릭터별로 seq 설정 (신규 캐릭터의 경우)
            for (Charactors character : characters) {
                if (!CharactorsRepository.existsById(character.getName())) {
                    // 신규 캐릭터인 경우 seq 자동 생성
                    Optional<Integer> maxSeq = CharactorsRepository.findMaxSeqByUserId(character.getUserId());
                    int nextSeq = maxSeq.orElse(0) + 1;
                    character.setSeq(nextSeq);
                }
            }
            
            List<Charactors> savedCharacters = CharactorsRepository.saveAll(characters);
            return ResponseEntity.ok(savedCharacters);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}