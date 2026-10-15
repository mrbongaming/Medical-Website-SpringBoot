package com.example.backend.doctor.dto;

import com.example.backend.doctor.entity.Doctor;
import java.math.BigDecimal;

public record DoctorResponse(
        String id,
        String slug,
        String name,
        String branchId,
        String departmentId,
        String specialtyId,
        int experience,
        String qualification,
        String image,
        String bio,
        BigDecimal price) {

    public static DoctorResponse from(Doctor doctor) {
        return new DoctorResponse(
                doctor.getId(),
                doctor.getSlug(),
                doctor.getName(),
                doctor.getBranch().getId(),
                doctor.getDepartment().getId(),
                doctor.getSpecialty().getId(),
                doctor.getExperience(),
                doctor.getQualification(),
                doctor.getImage(),
                doctor.getBio(),
                doctor.getPrice());
    }
}
