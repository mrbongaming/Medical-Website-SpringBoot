package com.example.backend.payment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.servlet.http.HttpServletRequest;
import com.example.backend.appointment.repository.AppointmentRepository;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/vnpay")
public class PaymentController {
    private final AppointmentRepository appointmentRepository;
    private final PaymentAttemptRepository paymentAttemptRepository;
    private final PaymentGateway paymentGateway;

    public PaymentController(
            AppointmentRepository appointmentRepository,
            PaymentAttemptRepository paymentAttemptRepository,
            PaymentGateway paymentGateway) {
        this.appointmentRepository = appointmentRepository;
        this.paymentAttemptRepository = paymentAttemptRepository;
        this.paymentGateway = paymentGateway;
    }

    @PostMapping("/create")
    @Transactional
    public ResponseEntity<PaymentStartResult> create(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest servletRequest) {
        var appointment = appointmentRepository.findById(request.appointmentId()).orElse(null);
        if (appointment == null || !appointment.getBookedBy().getId().equals(jwt.getSubject())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new PaymentStartResult("not_found", "", "Không tìm thấy lịch hẹn."));
        }
        if (!"awaiting_payment".equals(appointment.getStatus())
                || !"pending".equals(appointment.getPaymentStatus())
                || appointment.getPrepaymentAmount() == null
                || appointment.getPrepaymentAmount().signum() <= 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new PaymentStartResult(
                            "invalid_state", "", "Lịch hẹn không ở trạng thái có thể thanh toán."));
        }
        if (appointment.getSlotHoldExpiresAt() != null
                && appointment.getSlotHoldExpiresAt().isBefore(OffsetDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE)
                    .body(new PaymentStartResult("expired", "", "Thời gian giữ lịch đã hết."));
        }

        var attemptId = UUID.randomUUID().toString().replace("-", "");
        var clientIp = clientIp(servletRequest);
        var result = paymentGateway.createPayment(
                attemptId, appointment.getId(), appointment.getPrepaymentAmount(), clientIp);
        if (!"ready".equals(result.status())) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(result);
        }
        paymentAttemptRepository.save(PaymentAttempt.pending(
                attemptId,
                appointment,
                appointment.getPrepaymentAmount(),
                result.paymentUrl(),
                OffsetDateTime.now().plusMinutes(15)));
        return ResponseEntity.ok(result);
    }

    private static String clientIp(HttpServletRequest request) {
        var forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }

    public record CreatePaymentRequest(@NotBlank String appointmentId) {}
}
