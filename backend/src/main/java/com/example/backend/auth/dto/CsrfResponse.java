package com.example.backend.auth.dto;

public record CsrfResponse(String headerName, String parameterName, String token) {}
