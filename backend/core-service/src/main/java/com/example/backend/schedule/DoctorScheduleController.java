package com.example.backend.schedule;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/schedules")
public class DoctorScheduleController {
    private final DoctorAvailabilityService availability;

    public DoctorScheduleController(DoctorAvailabilityService availability) {
        this.availability = availability;
    }

    @GetMapping
    public List<DoctorScheduleResponse> availableSchedules() {
        return availability.preview();
    }
}
