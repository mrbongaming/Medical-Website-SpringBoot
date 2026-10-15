package com.example.backend.appointment.service;

import com.example.backend.appointment.dto.AppointmentResponse;
import com.example.backend.appointment.repository.AppointmentRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AppointmentQueryService {
    private final AppointmentRepository repository;

    public AppointmentQueryService(AppointmentRepository repository) {
        this.repository = repository;
    }

    public List<AppointmentResponse> forUser(String userId) {
        return repository.findAllByBookedByIdOrderByAppointmentDateDescAppointmentTimeDesc(userId)
                .stream().map(AppointmentResponse::from).toList();
    }
}
