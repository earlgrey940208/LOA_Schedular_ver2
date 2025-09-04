package com.loa.scheduler.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:19014"})
public class EventController {
    
    // 연결된 모든 클라이언트를 저장
    private final CopyOnWriteArraySet<SseEmitter> emitters = new CopyOnWriteArraySet<>();
    
    // 마지막 업데이트 시간
    private volatile LocalDateTime lastUpdated = LocalDateTime.now();
    
    /**
     * SSE 연결 엔드포인트
     */
    @GetMapping(value = "/updates", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        
        try {
            // 연결 성공 메시지 전송
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("SSE 연결 성공")
                .id(String.valueOf(System.currentTimeMillis())));
            
            // 현재 마지막 업데이트 시간 전송
            emitter.send(SseEmitter.event()
                .name("lastUpdated")
                .data(lastUpdated.toString())
                .id(String.valueOf(System.currentTimeMillis())));
            
            emitters.add(emitter);
            System.out.println("SSE 클라이언트 연결됨. 총 연결 수: " + emitters.size());
            
        } catch (IOException e) {
            emitter.completeWithError(e);
            return emitter;
        }
        
        // 연결 종료 시 정리
        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            System.out.println("SSE 클라이언트 연결 종료. 총 연결 수: " + emitters.size());
        });
        
        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            System.out.println("SSE 클라이언트 타임아웃. 총 연결 수: " + emitters.size());
        });
        
        emitter.onError((ex) -> {
            emitters.remove(emitter);
            System.out.println("SSE 클라이언트 에러: " + ex.getMessage());
        });
        
        return emitter;
    }
    
    /**
     * 모든 클라이언트에게 업데이트 알림 브로드캐스트
     */
    public void broadcastUpdate(String eventType, String data) {
        lastUpdated = LocalDateTime.now();
        
        // 죽은 연결 제거용 임시 리스트
        CopyOnWriteArraySet<SseEmitter> deadEmitters = new CopyOnWriteArraySet<>();
        
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                    .name(eventType)
                    .data(data)
                    .id(String.valueOf(System.currentTimeMillis())));
                    
                // 업데이트 시간도 함께 전송
                emitter.send(SseEmitter.event()
                    .name("lastUpdated")
                    .data(lastUpdated.toString())
                    .id(String.valueOf(System.currentTimeMillis())));
                    
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }
        
        // 죽은 연결 정리
        emitters.removeAll(deadEmitters);
        
        if (!deadEmitters.isEmpty()) {
            System.out.println("죽은 SSE 연결 " + deadEmitters.size() + "개 제거됨");
        }
        
        System.out.println("SSE 브로드캐스트: " + eventType + " - 활성 연결 수: " + emitters.size());
    }
    
    /**
     * 현재 마지막 업데이트 시간 조회
     */
    @GetMapping("/last-updated")
    public String getLastUpdated() {
        return lastUpdated.toString();
    }
}
