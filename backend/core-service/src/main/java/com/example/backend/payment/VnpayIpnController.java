package com.example.backend.payment;

import java.util.Map;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/payments/vnpay")
public class VnpayIpnController {
    private final PaymentAttemptRepository repository;
    private final VnpayPaymentGateway gateway;

    public VnpayIpnController(PaymentAttemptRepository repository, VnpayPaymentGateway gateway) {
        this.repository = repository;
        this.gateway = gateway;
    }

    @GetMapping("/ipn")
    @Transactional
    public Map<String, String> ipn(@RequestParam Map<String, String> parameters) {
        if (!gateway.verify(parameters)) return response("97", "Invalid checksum");
        var attempt = repository.findById(parameters.getOrDefault("vnp_TxnRef", "")).orElse(null);
        if (attempt == null) return response("01", "Order not found");
        if ("paid".equals(attempt.getStatus())) return response("02", "Order already confirmed");

        var expectedAmount = attempt.getAmount().movePointRight(2).toBigIntegerExact().toString();
        if (!expectedAmount.equals(parameters.get("vnp_Amount"))) {
            return response("04", "Invalid amount");
        }
        var transactionId = parameters.getOrDefault("vnp_TransactionNo", "");
        if ("00".equals(parameters.get("vnp_ResponseCode"))
                && "00".equals(parameters.get("vnp_TransactionStatus"))) {
            attempt.markPaid(transactionId);
            attempt.getAppointment().confirmBookingPayment();
        } else {
            attempt.markFailed(transactionId);
        }
        return response("00", "Confirm success");
    }

    private static Map<String, String> response(String code, String message) {
        return Map.of("RspCode", code, "Message", message);
    }
}
