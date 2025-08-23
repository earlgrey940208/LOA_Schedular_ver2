package com.loa.scheduler.repository;

import com.loa.scheduler.entity.Charactors;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CharactorsRepository extends JpaRepository<Charactors, String> {
    List<Charactors> findByUserId(String userId);
    List<Charactors> findByUserIdOrderBySeqAsc(String userId);
    Optional<Charactors> findByName(String name);
    boolean existsByName(String name);
    
    @Query("SELECT MAX(c.seq) FROM Charactors c WHERE c.userId = :userId")
    Optional<Integer> findMaxSeqByUserId(@Param("userId") String userId);
}