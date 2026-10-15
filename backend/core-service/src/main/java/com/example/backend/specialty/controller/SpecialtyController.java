package com.example.backend.specialty.controller;

import com.example.backend.specialty.dto.SpecialtyResponse;
import com.example.backend.specialty.service.SpecialtyService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/specialties")
public class SpecialtyController {
    private final SpecialtyService service;

    public SpecialtyController(SpecialtyService service) {
        this.service = service;
    }

    @GetMapping
    public List<SpecialtyResponse> findAllActive() {
        return service.findAllActive();
    }
}
