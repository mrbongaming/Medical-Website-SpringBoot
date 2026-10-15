package com.example.backend.exampackage.repository;

import com.example.backend.exampackage.entity.ExamPackage;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamPackageRepository extends JpaRepository<ExamPackage, String> {
    @EntityGraph(attributePaths = "specialty")
    List<ExamPackage> findAllByActiveTrueOrderByName();
}
