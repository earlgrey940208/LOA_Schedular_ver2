package com.loa.scheduler.repository;

import com.loa.scheduler.entity.UserSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserScheduleRepository extends JpaRepository<UserSchedule, Long> {
    
    List<UserSchedule> findByUserId(String userId);
    
    Optional<UserSchedule> findByUserIdAndDayOfWeek(String userId, String dayOfWeek);
    
    Optional<UserSchedule> findByUserIdAndDayOfWeekAndWeekNumber(String userId, String dayOfWeek, Integer weekNumber);
    
    List<UserSchedule> findByWeekNumber(Integer weekNumber);
    
    void deleteByUserId(String userId);
    
    @Query("SELECT us FROM UserSchedule us JOIN User u ON us.userId = u.name ORDER BY u.seq, us.weekNumber, " +
           "CASE us.dayOfWeek " +
           "WHEN 'WEDNESDAY' THEN 1 " +
           "WHEN 'THURSDAY' THEN 2 " +
           "WHEN 'FRIDAY' THEN 3 " +
           "WHEN 'SATURDAY' THEN 4 " +
           "WHEN 'SUNDAY' THEN 5 " +
           "WHEN 'MONDAY' THEN 6 " +
           "WHEN 'TUESDAY' THEN 7 " +
           "END")
    List<UserSchedule> findAllOrderedByUserAndDay();
}
