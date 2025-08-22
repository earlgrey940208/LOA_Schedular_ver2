package com.loa.scheduler.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "Charactors")
public class Charactors {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "캐릭터 이름은 필수입니다")
    @Column(nullable = false)
    private String name;
    
    @NotNull(message = "서포터 여부는 필수입니다")
    @Column(nullable = false)
    private Boolean isSupporter;
    
    @NotBlank(message = "사용자 ID는 필수입니다")
    @Column(nullable = false)
    private String userId;
    
    // 기본 생성자
    public Charactors() {}
    
    // 생성자
    public Charactors(String name, Boolean isSupporter, String userId) {
        this.name = name;
        this.isSupporter = isSupporter;
        this.userId = userId;
    }
    
    // Getter & Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public Boolean getIsSupporter() { return isSupporter; }
    public void setIsSupporter(Boolean isSupporter) { this.isSupporter = isSupporter; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}