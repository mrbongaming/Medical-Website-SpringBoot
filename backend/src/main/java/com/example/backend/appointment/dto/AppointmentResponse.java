package com.example.backend.appointment.dto;

import com.example.backend.appointment.entity.Appointment;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentResponse(
        String id,
        String branchId,
        String doctorId,
        String specialtyId,
        String bookingMode,
        LocalDate date,
        LocalTime time,
        String status,
        String serviceName,
        BigDecimal quotedPrice) {

    public static AppointmentResponse from(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getBranch().getId(),
                appointment.getDoctor() == null ? null : appointment.getDoctor().getId(),
                appointment.getSpecialty().getId(),
                appointment.getBookingMode(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                appointment.getStatus(),
                appointment.getServiceName(),
                appointment.getQuotedPrice());
    }
}
