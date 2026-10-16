package com.example.backend.payment;

import java.math.BigDecimal;

public interface PaymentGateway {
    PaymentStartResult createPayment(
            String attemptId, String appointmentId, BigDecimal amount, String clientIp);
}
