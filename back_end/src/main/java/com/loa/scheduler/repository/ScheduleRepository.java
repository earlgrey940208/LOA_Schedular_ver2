package com.loa.scheduler.repository;

import com.loa.scheduler.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByRaidName(String raidName);
    List<Schedule> findByCharacterName(String characterName);
    List<Schedule> findByRaidNameAndCharacterName(String raidName, String characterName);
    List<Schedule> findByIsFinish(Boolean isFinish);
}