package com.example.backend.schedule;

import com.example.backend.schedule.entity.DoctorAvailabilityRule;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorAvailabilityRuleRepository
        extends JpaRepository<DoctorAvailabilityRule, String> {
    @EntityGraph(attributePaths = {"branch", "doctor"})
    List<DoctorAvailabilityRule> findAllByActiveTrue();
}
