package com.example.backend.appointment.controller;

import com.example.backend.appointment.dto.AppointmentResponse;
import com.example.backend.appointment.dto.CreateAppointmentRequest;
import com.example.backend.appointment.service.AppointmentBookingService;
import com.example.backend.appointment.service.AppointmentQueryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    private final AppointmentQueryService service;
    private final AppointmentBookingService booking;

    public AppointmentController(AppointmentQueryService service, AppointmentBookingService booking) {
        this.service = service;
        this.booking = booking;
    }

    @GetMapping
    public List<AppointmentResponse> currentUserAppointments(
            @AuthenticationPrincipal Jwt jwt) {
        return service.forUser(jwt.getSubject());
    }

    @PostMapping
    public java.util.Map<String, String> create(@Valid @RequestBody CreateAppointmentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return java.util.Map.of("id", booking.book(request, jwt));
    }
}
