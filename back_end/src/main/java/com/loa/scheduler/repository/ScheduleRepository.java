package com.loa.scheduler.repository;

import com.loa.scheduler.entity.Schedule;
import com.loa.scheduler.entity.ScheduleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, ScheduleId> {
    
    // 특정 파티와 레이드로 스케줄 조회
    List<Schedule> findByIdAndRaidName(String id, String raidName);
    
    // 특정 파티의 모든 스케줄 조회
    List<Schedule> findById(String id);
    
    // 특정 레이드의 모든 스케줄 조회
    List<Schedule> findByRaidName(String raidName);
    
    // 특정 캐릭터의 모든 스케줄 조회
    List<Schedule> findByCharacterName(String characterName);
    
    // 특정 파티와 레이드의 모든 스케줄 삭제
    @Modifying
    @Query("DELETE FROM Schedule s WHERE s.id = :id AND s.raidName = :raidName")
    void deleteByIdAndRaidName(@Param("id") String id, @Param("raidName") String raidName);
    
    // 특정 파티, 레이드, 캐릭터의 스케줄 삭제
    @Modifying
    @Query("DELETE FROM Schedule s WHERE s.id = :id AND s.raidName = :raidName AND s.characterName = :characterName")
    void deleteByIdAndRaidNameAndCharacterName(@Param("id") String id, @Param("raidName") String raidName, @Param("characterName") String characterName);
    
    // 특정 파티와 레이드의 완료 상태 업데이트
    @Modifying
    @Query("UPDATE Schedule s SET s.isFinish = :isFinish WHERE s.id = :id AND s.raidName = :raidName")
    void updateIsFinishByIdAndRaidName(@Param("id") String id, @Param("raidName") String raidName, @Param("isFinish") String isFinish);
}