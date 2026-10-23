package com.example.backend.department.service;

import com.example.backend.department.dto.DepartmentResponse;
import com.example.backend.department.repository.DepartmentRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DepartmentService {
    private final DepartmentRepository departments;

    public DepartmentService(DepartmentRepository departments) {
        this.departments = departments;
    }

    public List<DepartmentResponse> findAllActive() {
        return departments.findAllByActiveTrueOrderByName().stream()
                .map(DepartmentResponse::from)
                .toList();
    }
}
