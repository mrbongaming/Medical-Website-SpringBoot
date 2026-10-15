package com.example.backend.exampackage.service;

import com.example.backend.exampackage.dto.ExamPackageResponse;
import com.example.backend.exampackage.repository.ExamPackageRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ExamPackageService {
    private final ExamPackageRepository packages;

    public ExamPackageService(ExamPackageRepository packages) {
        this.packages = packages;
    }

    public List<ExamPackageResponse> findAllActive() {
        return packages.findAllByActiveTrueOrderByName().stream()
                .map(ExamPackageResponse::from)
                .toList();
    }
}
