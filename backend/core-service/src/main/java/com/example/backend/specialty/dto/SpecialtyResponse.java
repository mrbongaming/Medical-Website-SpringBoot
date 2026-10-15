package com.example.backend.specialty.dto;

import com.example.backend.specialty.entity.Specialty;

public record SpecialtyResponse(String id, String name) {
    public static SpecialtyResponse from(Specialty specialty) {
        return new SpecialtyResponse(specialty.getId(), specialty.getName());
    }
}
