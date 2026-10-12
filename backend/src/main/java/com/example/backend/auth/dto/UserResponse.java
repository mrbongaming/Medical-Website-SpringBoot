package com.example.backend.auth.dto;

import com.example.backend.auth.model.AuthenticatedUser;

public record UserResponse(
        String id,
        String name,
        String phone,
        String role,
        String branchId,
        String doctorId) {

    public static UserResponse from(AuthenticatedUser user) {
        return new UserResponse(
                user.id(), user.name(), user.phone(), user.role(), user.branchId(), user.doctorId());
    }
}
