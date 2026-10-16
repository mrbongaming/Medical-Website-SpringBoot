package com.example.backend.payment;

import com.example.backend.appointment.entity.Appointment;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "payment_attempts")
public class PaymentAttempt {
    @Id private String id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "appointment_id") private Appointment appointment;
    private String provider;
    private BigDecimal amount;
    private String status;
    @Column(name = "provider_transaction_id") private String providerTransactionId;
    @Column(name = "request_id") private String requestId;
    @Column(name = "payment_url", columnDefinition = "text") private String paymentUrl;
    @Column(name = "expires_at") private OffsetDateTime expiresAt;
    @Column(name = "created_at") private OffsetDateTime createdAt;
    @Column(name = "updated_at") private OffsetDateTime updatedAt;

    protected PaymentAttempt() {}

    public static PaymentAttempt pending(
            String id,
            Appointment appointment,
            BigDecimal amount,
            String paymentUrl,
            OffsetDateTime expiresAt) {
        var attempt = new PaymentAttempt();
        attempt.id = id;
        attempt.appointment = appointment;
        attempt.provider = "vnpay";
        attempt.amount = amount;
        attempt.status = "pending";
        attempt.requestId = id;
        attempt.paymentUrl = paymentUrl;
        attempt.expiresAt = expiresAt;
        attempt.createdAt = OffsetDateTime.now();
        attempt.updatedAt = attempt.createdAt;
        return attempt;
    }

    public String getId() { return id; }
    public Appointment getAppointment() { return appointment; }
    public BigDecimal getAmount() { return amount; }
    public String getStatus() { return status; }

    public void markPaid(String transactionId) {
        this.status = "paid";
        this.providerTransactionId = transactionId;
        this.updatedAt = OffsetDateTime.now();
    }

    public void markFailed(String transactionId) {
        this.status = "failed";
        this.providerTransactionId = transactionId;
        this.updatedAt = OffsetDateTime.now();
    }
}
