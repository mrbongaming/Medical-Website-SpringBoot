package com.example.backend.specialty.repository;

import com.example.backend.specialty.entity.Specialty;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpecialtyRepository extends JpaRepository<Specialty, String> {
    List<Specialty> findAllByActiveTrueOrderByName();
}
