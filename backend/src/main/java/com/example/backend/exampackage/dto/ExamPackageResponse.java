package com.example.backend.exampackage.dto;

import com.example.backend.exampackage.entity.ExamPackage;
import java.math.BigDecimal;

public record ExamPackageResponse(
        String id,
        String slug,
        String name,
        String specialtyId,
        BigDecimal price,
        String contents) {

    public static ExamPackageResponse from(ExamPackage examPackage) {
        return new ExamPackageResponse(
                examPackage.getId(),
                examPackage.getSlug(),
                examPackage.getName(),
                examPackage.getSpecialty().getId(),
                examPackage.getPrice(),
                examPackage.getContents());
    }
}
