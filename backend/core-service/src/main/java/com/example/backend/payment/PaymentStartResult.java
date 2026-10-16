package com.example.backend.payment;

public record PaymentStartResult(String status, String paymentUrl, String message) {}
