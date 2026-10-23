package com.example.backend.department.dto;

import com.example.backend.department.entity.Department;

public record DepartmentResponse(
        String id,
        String branchId,
        String specialtyId,
        String name) {

    public static DepartmentResponse from(Department department) {
        return new DepartmentResponse(
                department.getId(),
                department.getBranch().getId(),
                department.getSpecialty().getId(),
                department.getName());
    }
}
