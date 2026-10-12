package com.example.backend.doctor.repository;

import com.example.backend.doctor.entity.Doctor;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorRepository extends JpaRepository<Doctor, String> {
    @EntityGraph(attributePaths = {"branch", "department", "specialty"})
    List<Doctor> findAllByActiveTrueOrderByName();
}
