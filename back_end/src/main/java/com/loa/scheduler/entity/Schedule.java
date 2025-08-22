package com.loa.scheduler.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "Schedule")
public class Schedule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "레이드 이름은 필수입니다")
    @Column(nullable = false)
    private String raidName;
    
    @NotBlank(message = "캐릭터 이름은 필수입니다")
    @Column(nullable = false)
    private String characterName;
    
    // @NotNull(message = "완료 여부는 필수입니다")
    // @Column(nullable = false)
    private Boolean isFinish;
    
    // 기본 생성자
    public Schedule() {}
    
    // 생성자
    public Schedule(String raidName, String characterName, Boolean isFinish) {
        this.raidName = raidName;
        this.characterName = characterName;
        this.isFinish = isFinish;
    }
    
    // Getter & Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getRaidName() { return raidName; }
    public void setRaidName(String raidName) { this.raidName = raidName; }
    
    public String getCharacterName() { return characterName; }
    public void setCharacterName(String characterName) { this.characterName = characterName; }
    
    public Boolean getIsFinish() { return isFinish; }
    public void setIsFinish(Boolean isFinish) { this.isFinish = isFinish; }
}