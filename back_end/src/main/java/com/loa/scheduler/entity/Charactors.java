package com.loa.scheduler.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "charactors")
public class Charactors {
    
    @Id
    @NotBlank(message = "캐릭터 이름은 필수입니다")
    @Column(name = "name", nullable = false)
    private String name;
    
    @NotNull(message = "서포터 여부는 필수입니다")
    @Column(name = "is_supporter", nullable = false)
    private String isSupporter;
    
    @NotBlank(message = "사용자 ID는 필수입니다")
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    // @Column(nullable = false)
    @Column(name = "seq", nullable = false)
    private Integer seq;
    
    // 기본 생성자
    public Charactors() {}
    
    // 생성자
    public Charactors(String name, String isSupporter, String userId, Integer seq) {
        this.name = name;
        this.isSupporter = isSupporter;
        this.userId = userId;
        this.seq = seq;
    }
    
    // Getter & Setter
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getIsSupporter() { return isSupporter; }
    public void setIsSupporter(String isSupporter) { this.isSupporter = isSupporter; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public Integer getSeq() { return seq; }
    public void setSeq(Integer seq) { this.seq = seq; }
}