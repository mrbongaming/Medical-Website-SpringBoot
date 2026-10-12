package com.example.backend.appointment.controller;

import com.example.backend.appointment.dto.AppointmentResponse;
import com.example.backend.appointment.service.AppointmentQueryService;
import com.example.backend.auth.model.AuthenticatedUser;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    private final AppointmentQueryService service;

    public AppointmentController(AppointmentQueryService service) {
        this.service = service;
    }

    @GetMapping
    public List<AppointmentResponse> currentUserAppointments(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return service.forUser(user.id());
    }
}
