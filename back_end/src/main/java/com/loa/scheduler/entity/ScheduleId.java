package com.loa.scheduler.entity;

import java.io.Serializable;
import java.util.Objects;

public class ScheduleId implements Serializable {
    private String id;
    private String raidName;
    private String characterName;
    
    public ScheduleId() {}
    
    public ScheduleId(String id, String raidName, String characterName) {
        this.id = id;
        this.raidName = raidName;
        this.characterName = characterName;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getRaidName() { return raidName; }
    public void setRaidName(String raidName) { this.raidName = raidName; }
    
    public String getCharacterName() { return characterName; }
    public void setCharacterName(String characterName) { this.characterName = characterName; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ScheduleId that = (ScheduleId) o;
        return Objects.equals(id, that.id) &&
               Objects.equals(raidName, that.raidName) &&
               Objects.equals(characterName, that.characterName);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id, raidName, characterName);
    }
    
    @Override
    public String toString() {
        return "ScheduleId{" +
                "id='" + id + '\'' +
                ", raidName='" + raidName + '\'' +
                ", characterName='" + characterName + '\'' +
                '}';
    }
}
