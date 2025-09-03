package com.loa.scheduler.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:19014", "http://192.168.219.100:19014", "http://192.168.219.102:19014", "http://192.168.219.103:19014", "http://1.213.234.164:19014", "http://112.149.7.35:19014", "http://172.30.96.1:19014", "http://localhost:5174"})
public class SystemController {
    
    // 임시로 정적 변수 사용 (실제로는 데이터베이스나 Redis 사용 권장)
    private static volatile Instant lastUpdated = Instant.now();
    
    /**
     * 마지막 업데이트 시간 조회
     * 자동갱신 기능에서 데이터 변화 감지용
     */
    @GetMapping("/last-updated")
    public ResponseEntity<Map<String, Object>> getLastUpdated() {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", lastUpdated.toString());
        response.put("epochMilli", lastUpdated.toEpochMilli());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 마지막 업데이트 시간 갱신
     * 다른 컨트롤러에서 데이터 변경 시 호출
     */
    public static void updateTimestamp() {
        lastUpdated = Instant.now();
    }
}
