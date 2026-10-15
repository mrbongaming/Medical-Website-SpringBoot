package com.example.backend.doctor.controller;

import com.example.backend.doctor.dto.DoctorResponse;
import com.example.backend.doctor.service.DoctorService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/doctors")
public class DoctorController {
    private final DoctorService service;

    public DoctorController(DoctorService service) {
        this.service = service;
    }

    @GetMapping
    public List<DoctorResponse> findAllActive() {
        return service.findAllActive();
    }
}
