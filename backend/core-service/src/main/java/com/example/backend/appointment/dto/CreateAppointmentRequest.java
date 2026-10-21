package com.example.backend.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record CreateAppointmentRequest(
        @NotBlank String branchId,
        @NotBlank String specialtyId,
        String doctorId,
        String packageId,
        @NotNull LocalDate date,
        LocalTime time,
        @NotBlank String recipientType,
        String relationship,
        @NotBlank String patientName,
        @NotBlank String phone,
        LocalDate patientBirthDate,
        String patientAddress,
        String notes) {}
