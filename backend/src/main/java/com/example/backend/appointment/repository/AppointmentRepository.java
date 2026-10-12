package com.example.backend.appointment.repository;

import com.example.backend.appointment.entity.Appointment;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    @EntityGraph(attributePaths = {"bookedBy", "branch", "doctor", "department", "specialty", "examPackage"})
    List<Appointment> findAllByBookedByIdOrderByAppointmentDateDescAppointmentTimeDesc(String userId);
}
