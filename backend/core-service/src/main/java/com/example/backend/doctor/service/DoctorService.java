package com.example.backend.doctor.service;

import com.example.backend.doctor.dto.DoctorResponse;
import com.example.backend.doctor.repository.DoctorRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DoctorService {
    private final DoctorRepository doctors;

    public DoctorService(DoctorRepository doctors) {
        this.doctors = doctors;
    }

    public List<DoctorResponse> findAllActive() {
        return doctors.findAllByActiveTrueOrderByName().stream()
                .map(DoctorResponse::from)
                .toList();
    }
}
