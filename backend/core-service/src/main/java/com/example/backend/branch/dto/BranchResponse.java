package com.example.backend.branch.dto;

import com.example.backend.branch.entity.Branch;

public record BranchResponse(
        String id,
        String slug,
        String name,
        String address,
        String phone,
        String image,
        String hours,
        String description) {

    public static BranchResponse from(Branch branch) {
        return new BranchResponse(
                branch.getId(),
                branch.getSlug(),
                branch.getName(),
                branch.getAddress(),
                branch.getPhone(),
                branch.getImage(),
                branch.getHours(),
                branch.getDescription());
    }
}
