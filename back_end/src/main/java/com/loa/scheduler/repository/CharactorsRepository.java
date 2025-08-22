package com.loa.scheduler.repository;

import com.loa.scheduler.entity.Charactors;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CharactorsRepository extends JpaRepository<Charactors, Long> {
    List<Charactors> findByUserId(String userId);
    Optional<Charactors> findByName(String name);
    boolean existsByName(String name);
}