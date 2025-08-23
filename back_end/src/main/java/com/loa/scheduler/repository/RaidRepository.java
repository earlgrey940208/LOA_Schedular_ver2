package com.loa.scheduler.repository;

import com.loa.scheduler.entity.Raid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RaidRepository extends JpaRepository<Raid, String> {
    Optional<Raid> findByName(String name);
    boolean existsByName(String name);
}