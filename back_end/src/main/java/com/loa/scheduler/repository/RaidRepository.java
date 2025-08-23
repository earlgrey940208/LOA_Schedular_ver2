package com.loa.scheduler.repository;

import com.loa.scheduler.entity.Raid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RaidRepository extends JpaRepository<Raid, String> {
    Optional<Raid> findByName(String name);
    boolean existsByName(String name);
    
    // seq 순으로 정렬된 모든 레이드 조회
    @Query("SELECT r FROM Raid r ORDER BY r.seq ASC")
    List<Raid> findAllOrderBySeq();
}