package com.example.backend.department.repository;

import com.example.backend.department.entity.Department;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, String> {
    List<Department> findAllByActiveTrueOrderByName();
}
