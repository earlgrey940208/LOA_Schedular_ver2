package com.loa.scheduler.repository;

import com.loa.scheduler.entity.UserSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    
    // 주간 리셋을 위한 메서드들
    // 1주차 데이터 삭제
    @Modifying
    @Query("DELETE FROM UserSchedule us WHERE us.weekNumber = 1")
    void deleteWeek1Data();
    
    // 2주차 데이터를 1주차로 이동
    @Modifying
    @Query("UPDATE UserSchedule us SET us.weekNumber = 1 WHERE us.weekNumber = 2")
    void moveWeek2ToWeek1();
}
