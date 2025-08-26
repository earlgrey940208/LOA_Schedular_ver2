package com.loa.scheduler.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_schedule")
@EntityListeners(AuditingEntityListener.class)
public class UserSchedule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "사용자 ID는 필수입니다")
    @Column(nullable = false, name = "user_id")
    private String userId;
    
    @NotBlank(message = "요일은 필수입니다")
    @Column(nullable = false, name = "day_of_week")
    private String dayOfWeek;
    
    @Column(columnDefinition = "TEXT", name = "schedule_text")
    private String scheduleText;
    
    @NotNull(message = "활성화 상태는 필수입니다")
    @Column(nullable = false, name = "enabled")
    private String enabled = "Y";
    
    @CreatedDate
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // 생성자
    public UserSchedule() {}
    
    public UserSchedule(String userId, String dayOfWeek, String scheduleText, String enabled) {
        this.userId = userId;
        this.dayOfWeek = dayOfWeek;
        this.scheduleText = scheduleText;
        this.enabled = enabled;
    }
    
    // Getter & Setter
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getDayOfWeek() {
        return dayOfWeek;
    }
    
    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }
    
    public String getScheduleText() {
        return scheduleText;
    }
    
    public void setScheduleText(String scheduleText) {
        this.scheduleText = scheduleText;
    }
    
    public String getEnabled() {
        return enabled;
    }
    
    public void setEnabled(String enabled) {
        this.enabled = enabled;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
