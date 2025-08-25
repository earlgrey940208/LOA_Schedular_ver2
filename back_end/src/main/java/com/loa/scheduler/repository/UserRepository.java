package com.loa.scheduler.repository;

import com.loa.scheduler.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByName(String name);
    
    boolean existsByName(String name);
}
