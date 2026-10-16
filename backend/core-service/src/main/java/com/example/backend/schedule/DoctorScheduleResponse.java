package com.example.backend.schedule;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record DoctorScheduleResponse(
        String id,
        String branchId,
        String doctorId,
        LocalDate date,
        List<LocalTime> times) {}
