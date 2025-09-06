package com.loa.scheduler.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:19014"})
public class EventController {
    
    // 연결된 모든 클라이언트를 저장
    private final CopyOnWriteArraySet<SseEmitter> emitters = new CopyOnWriteArraySet<>();
    
    // 동일 IP 연결 제한 로직 - IP별 연결 수 추적
    private final ConcurrentHashMap<String, Integer> ipConnectionCount = new ConcurrentHashMap<>();
    
    // 최대 연결 수 제한
    private static final int MAX_CONNECTIONS = 50;
    
    // 동일 IP 연결 제한 로직 - 같은 IP에서 최대 5개 연결만 허용
    private static final int MAX_CONNECTIONS_PER_IP = 5;
    
    // 하트비트 메커니즘 - 30초마다 ping 전송
    private static final int HEARTBEAT_INTERVAL = 30; // seconds
    
    // 마지막 업데이트 시간
    private volatile LocalDateTime lastUpdated = LocalDateTime.now();
    
    // 하트비트 메커니즘 - 주기적 ping 전송을 위한 스케줄러
    private final ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor();
    
    /**
     * 하트비트 메커니즘 - 생성자에서 주기적 ping 시작
     */
    public EventController() {
        // 하트비트 메커니즘 - 30초마다 모든 연결에 ping 전송
        heartbeatScheduler.scheduleAtFixedRate(this::sendHeartbeat, 
            HEARTBEAT_INTERVAL, HEARTBEAT_INTERVAL, TimeUnit.SECONDS);
    }
    
    /**
     * 동일 IP 연결 제한 로직 - 클라이언트 IP 추출
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * 하트비트 메커니즘 - 모든 연결에 ping 전송하여 죽은 연결 감지
     */
    private void sendHeartbeat() {
        CopyOnWriteArraySet<SseEmitter> deadEmitters = new CopyOnWriteArraySet<>();
        
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                    .name("heartbeat")
                    .data("ping"));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }
        
        // 하트비트 메커니즘 - 응답하지 않는 연결들 정리
        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
            System.out.println("하트비트로 감지된 죽은 연결 " + deadEmitters.size() + "개 제거됨");
        }
    }
    /**
     * SSE 연결 엔드포인트
     */
    @GetMapping(value = "/updates", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(HttpServletRequest request) {
        // 동일 IP 연결 제한 로직 - 클라이언트 IP 확인
        String clientIp = getClientIp(request);
        int currentIpConnections = ipConnectionCount.getOrDefault(clientIp, 0);
        
        // 동일 IP 연결 제한 로직 - IP별 연결 수 체크
        if (currentIpConnections >= MAX_CONNECTIONS_PER_IP) {
            SseEmitter rejectedEmitter = new SseEmitter(1000L);
            try {
                rejectedEmitter.send(SseEmitter.event()
                    .name("error")
                    .data("동일 IP에서 너무 많은 연결 (" + currentIpConnections + "/" + MAX_CONNECTIONS_PER_IP + ")"));
                rejectedEmitter.complete();
            } catch (IOException e) {
                // 무시
            }
            System.out.println("IP " + clientIp + " 연결 제한 초과: " + currentIpConnections);
            return rejectedEmitter;
        }
        
        // 연결 수 제한 체크
        if (emitters.size() >= MAX_CONNECTIONS) {
            // 오래된 연결들을 정리
            cleanupOldConnections();
            
            // 여전히 제한을 초과하면 새 연결 거부
            if (emitters.size() >= MAX_CONNECTIONS) {
                SseEmitter emitter = new SseEmitter(1000L); // 짧은 타임아웃
                try {
                    emitter.send(SseEmitter.event()
                        .name("error")
                        .data("연결 수 제한 초과"));
                    emitter.complete();
                } catch (IOException e) {
                    // 무시
                }
                return emitter;
            }
        }
        
        SseEmitter emitter = new SseEmitter(300000L); // 5분 타임아웃
        
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
            
            // 동일 IP 연결 제한 로직 - IP별 연결 수 증가
            ipConnectionCount.put(clientIp, currentIpConnections + 1);
            
            System.out.println("SSE 클라이언트 연결됨 [IP: " + clientIp + "] 총 연결 수: " + emitters.size() + ", IP별 연결 수: " + (currentIpConnections + 1));
            
        } catch (IOException e) {
            System.err.println("SSE 연결 초기화 실패: " + e.getMessage());
            emitter.completeWithError(e);
            return emitter;
        }
        
        // 연결 종료 시 정리
        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            // 동일 IP 연결 제한 로직 - IP별 연결 수 감소
            decreaseIpConnectionCount(clientIp);
            System.out.println("SSE 클라이언트 연결 종료 [IP: " + clientIp + "] 총 연결 수: " + emitters.size());
        });
        
        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            // 동일 IP 연결 제한 로직 - IP별 연결 수 감소
            decreaseIpConnectionCount(clientIp);
            System.out.println("SSE 클라이언트 타임아웃 [IP: " + clientIp + "] 총 연결 수: " + emitters.size());
        });
        
        emitter.onError((ex) -> {
            emitters.remove(emitter);
            // 동일 IP 연결 제한 로직 - IP별 연결 수 감소
            decreaseIpConnectionCount(clientIp);
            System.out.println("SSE 클라이언트 에러 [IP: " + clientIp + "]: " + ex.getMessage());
        });
        
        return emitter;
    }
    
    /**
     * 동일 IP 연결 제한 로직 - IP별 연결 수 감소
     */
    private void decreaseIpConnectionCount(String ip) {
        ipConnectionCount.compute(ip, (key, count) -> {
            if (count == null || count <= 1) {
                return null; // 맵에서 제거
            }
            return count - 1;
        });
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
                // 하트비트 메커니즘 - 연결 상태 먼저 체크 (불필요한 전송 방지)
                if (isEmitterClosed(emitter)) {
                    deadEmitters.add(emitter);
                    continue;
                }
                
                emitter.send(SseEmitter.event()
                    .name(eventType)
                    .data(data)
                    .id(String.valueOf(System.currentTimeMillis())));
                    
                // 업데이트 시간도 함께 전송
                emitter.send(SseEmitter.event()
                    .name("lastUpdated")
                    .data(lastUpdated.toString())
                    .id(String.valueOf(System.currentTimeMillis())));
                    
            } catch (Exception e) {
                // 모든 예외를 잡아서 deadEmitters에 추가
                deadEmitters.add(emitter);
                System.err.println("SSE 전송 실패: " + e.getMessage());
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
     * 하트비트 메커니즘 - 오래된 연결들을 적극적으로 정리
     */
    private void cleanupOldConnections() {
        CopyOnWriteArraySet<SseEmitter> deadEmitters = new CopyOnWriteArraySet<>();
        
        for (SseEmitter emitter : emitters) {
            try {
                // 하트비트 메커니즘 - ping 메시지로 연결 상태 확인
                emitter.send(SseEmitter.event()
                    .name("ping")
                    .data("connection-check"));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }
        
        emitters.removeAll(deadEmitters);
        System.out.println("정리된 오래된 연결 수: " + deadEmitters.size());
    }
    
    /**
     * 하트비트 메커니즘 - Emitter가 닫혔는지 확인 (간접적으로)
     */
    private boolean isEmitterClosed(SseEmitter emitter) {
        try {
            // 매우 작은 데이터를 보내서 연결 상태 확인
            emitter.send(SseEmitter.event()
                .name("check")
                .data(""));
            return false;
        } catch (Exception e) {
            return true;
        }
    }
    
    /**
     * 현재 마지막 업데이트 시간 조회
     */
    @GetMapping("/last-updated")
    public String getLastUpdated() {
        return lastUpdated.toString();
    }
}
