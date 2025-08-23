// filepath: d:\로스트아크 스케줄러ver_2\back_end\src\main\java\com\loa\scheduler\entity\Raid.java
package com.loa.scheduler.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "raid")
public class Raid {
    
    @Id
    @NotBlank(message = "레이드 이름은 필수입니다")
    @Column(nullable = false)
    private String name;

    private Long seq;
    
    // 기본 생성자
    public Raid() {}
    
    // 생성자
    public Raid(String name) {
        this.name = name;
    }
    
    // Getter & Setter
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public Long getSeq() { return seq; }
    public void setSeq(Long seq) { this.seq = seq; }
}