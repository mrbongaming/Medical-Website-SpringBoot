package com.example.backend.specialty.service;

import com.example.backend.specialty.dto.SpecialtyResponse;
import com.example.backend.specialty.repository.SpecialtyRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SpecialtyService {
    private final SpecialtyRepository specialties;

    public SpecialtyService(SpecialtyRepository specialties) {
        this.specialties = specialties;
    }

    public List<SpecialtyResponse> findAllActive() {
        return specialties.findAllByActiveTrueOrderByName().stream()
                .map(SpecialtyResponse::from)
                .toList();
    }
}
