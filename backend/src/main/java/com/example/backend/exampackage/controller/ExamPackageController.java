package com.example.backend.exampackage.controller;

import com.example.backend.exampackage.dto.ExamPackageResponse;
import com.example.backend.exampackage.service.ExamPackageService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/packages")
public class ExamPackageController {
    private final ExamPackageService service;

    public ExamPackageController(ExamPackageService service) {
        this.service = service;
    }

    @GetMapping
    public List<ExamPackageResponse> findAllActive() {
        return service.findAllActive();
    }
}
