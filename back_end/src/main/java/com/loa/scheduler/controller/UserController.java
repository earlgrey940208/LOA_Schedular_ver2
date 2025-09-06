package com.loa.scheduler.controller;

import com.loa.scheduler.entity.User;
import com.loa.scheduler.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = {"http://localhost:19014", "http://192.168.219.100:19014", "http://192.168.219.102:19014", "http://192.168.219.103:19014", "http://1.213.234.164:19014", "http://112.149.7.35:19014", "http://172.30.96.1:19014", "http://localhost:5174"})
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EventController eventController;
    
    // 모든 유저 조회
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        System.out.println("📋 getAllUsers API 호출됨");
        try {
            System.out.println("📋 userRepository 상태: " + (userRepository != null ? "정상" : "null"));
            List<User> users = userRepository.findAllOrderBySeq();
            System.out.println("📋 조회된 유저 수: " + users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.err.println("❌ getAllUsers 에러 발생:");
            e.printStackTrace();
            System.err.println("❌ 에러 메시지: " + e.getMessage());
            System.err.println("❌ 에러 클래스: " + e.getClass().getName());
            return ResponseEntity.status(500).build();
        }
    }
    
    // 특정 유저 조회
    @GetMapping("/{name}")
    public ResponseEntity<User> getUserByName(@PathVariable String name) {
        try {
            Optional<User> user = userRepository.findByName(name);
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get());
            } else {
                return ResponseEntity.status(404).build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    // 유저 생성
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        try {
            if (userRepository.existsByName(user.getName())) {
                return ResponseEntity.status(409).build(); // Conflict
            }
            User savedUser = userRepository.save(user);
            
            // SSE 이벤트 브로드캐스트 (오류 발생해도 응답에는 영향 없음)
            try {
                eventController.broadcastUpdate("user-created", "유저 '" + user.getName() + "'이 추가되었습니다.");
            } catch (Exception e) {
                System.err.println("SSE 브로드캐스트 실패 (유저 생성은 성공): " + e.getMessage());
            }
            
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    // 유저 수정
    @PutMapping("/{name}")
    public ResponseEntity<User> updateUser(@PathVariable String name, @RequestBody User userDetails) {
        try {
            Optional<User> existingUser = userRepository.findByName(name);
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                user.setColor(userDetails.getColor());
                // 이름 변경은 복잡성을 피하기 위해 제한
                User updatedUser = userRepository.save(user);
                
                // SSE 이벤트 브로드캐스트 (오류 발생해도 응답에는 영향 없음)
                try {
                    eventController.broadcastUpdate("user-updated", "유저 '" + name + "'이 수정되었습니다.");
                } catch (Exception e) {
                    System.err.println("SSE 브로드캐스트 실패 (유저 수정은 성공): " + e.getMessage());
                }
                return ResponseEntity.ok(updatedUser);
            } else {
                return ResponseEntity.status(404).build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    // 유저 삭제
    @DeleteMapping("/{name}")
    public ResponseEntity<String> deleteUser(@PathVariable String name) {
        try {
            Optional<User> user = userRepository.findByName(name);
            if (user.isPresent()) {
                userRepository.delete(user.get());
                
                // SSE 이벤트 브로드캐스트 (오류 발생해도 응답에는 영향 없음)
                try {
                    eventController.broadcastUpdate("user-deleted", "유저 '" + name + "'이 삭제되었습니다.");
                } catch (Exception e) {
                    System.err.println("SSE 브로드캐스트 실패 (유저 삭제는 성공): " + e.getMessage());
                }
                
                return ResponseEntity.ok("유저가 삭제되었습니다.");
            } else {
                return ResponseEntity.status(404).body("해당 유저를 찾을 수 없습니다.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("유저 삭제에 실패했습니다.");
        }
    }
}
