package com.loa.scheduler.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "Schedule")
@IdClass(ScheduleId.class)
public class Schedule {
    
    @Id
    @NotBlank(message = "파티명은 필수입니다")
    @Column(name = "id", nullable = false)
    private String id;
    
    @Id
    @NotBlank(message = "레이드 이름은 필수입니다")
    @Column(name = "raid_name", nullable = false)
    private String raidName;
    
    @Id
    @NotBlank(message = "캐릭터 이름은 필수입니다")
    @Column(name = "character_name", nullable = false)
    private String characterName;
    
    @Column(name = "isFinish", nullable = false)
    private String isFinish = "N"; // 'Y' 또는 'N'
    
    // 기본 생성자
    public Schedule() {}
    
    // 생성자
    public Schedule(String id, String raidName, String characterName, String isFinish) {
        this.id = id;
        this.raidName = raidName;
        this.characterName = characterName;
        this.isFinish = isFinish != null ? isFinish : "N";
    }
    
    // Boolean 타입을 받는 편의 생성자
    public Schedule(String id, String raidName, String characterName, Boolean isFinish) {
        this.id = id;
        this.raidName = raidName;
        this.characterName = characterName;
        this.isFinish = (isFinish != null && isFinish) ? "Y" : "N";
    }
    
    // Getter & Setter
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getRaidName() { return raidName; }
    public void setRaidName(String raidName) { this.raidName = raidName; }
    
    public String getCharacterName() { return characterName; }
    public void setCharacterName(String characterName) { this.characterName = characterName; }
    
    public String getIsFinish() { return isFinish; }
    public void setIsFinish(String isFinish) { this.isFinish = isFinish; }
    
    // Boolean 타입으로 변환하는 편의 메서드
    public Boolean getIsFinishAsBoolean() {
        return "Y".equals(this.isFinish);
    }
    
    public void setIsFinishAsBoolean(Boolean isFinish) {
        this.isFinish = (isFinish != null && isFinish) ? "Y" : "N";
    }
    
    @Override
    public String toString() {
        return "Schedule{" +
                "id='" + id + '\'' +
                ", raidName='" + raidName + '\'' +
                ", characterName='" + characterName + '\'' +
                ", isFinish='" + isFinish + '\'' +
                '}';
    }
}