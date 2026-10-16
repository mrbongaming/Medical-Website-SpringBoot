package com.example.backend.schedule;

import com.example.backend.schedule.entity.DoctorScheduleException;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorScheduleExceptionRepository
        extends JpaRepository<DoctorScheduleException, String> {
    @EntityGraph(attributePaths = {"branch", "doctor"})
    List<DoctorScheduleException> findAllByExceptionDateBetween(LocalDate from, LocalDate to);
}
