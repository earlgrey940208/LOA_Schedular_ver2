package com.loa.scheduler.repository;

import com.loa.scheduler.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    Optional<User> findByName(String name);
    
    boolean existsByName(String name);
    
    // seq 순으로 정렬된 모든 사용자 조회
    @Query("SELECT u FROM User u ORDER BY u.seq ASC")
    List<User> findAllOrderBySeq();
}
