package com.example.backend.payment;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VnpayPaymentGateway implements PaymentGateway {
    private final String merchantCode;
    private final String hashSecret;
    private final String paymentUrl;
    private final String returnUrl;

    public VnpayPaymentGateway(
            @Value("${app.payment.vnpay.merchant-code:}") String merchantCode,
            @Value("${app.payment.vnpay.hash-secret:}") String hashSecret,
            @Value("${app.payment.vnpay.payment-url:}") String paymentUrl,
            @Value("${app.payment.vnpay.return-url:}") String returnUrl) {
        this.merchantCode = merchantCode;
        this.hashSecret = hashSecret;
        this.paymentUrl = paymentUrl;
        this.returnUrl = returnUrl;
    }

    @Override
    public PaymentStartResult createPayment(
            String attemptId, String appointmentId, BigDecimal amount, String clientIp) {
        if (merchantCode.isBlank() || hashSecret.isBlank() || paymentUrl.isBlank() || returnUrl.isBlank()) {
            return new PaymentStartResult(
                    "not_configured",
                    "",
                    "VNPay chưa được cấu hình đầy đủ. Hãy điền mã website, khóa bí mật, payment URL và return URL.");
        }
        try {
            var formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
            var now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
            Map<String, String> parameters = new TreeMap<>();
            parameters.put("vnp_Version", "2.1.0");
            parameters.put("vnp_Command", "pay");
            parameters.put("vnp_TmnCode", merchantCode);
            parameters.put("vnp_Amount", amount.movePointRight(2).toBigIntegerExact().toString());
            parameters.put("vnp_CurrCode", "VND");
            parameters.put("vnp_TxnRef", attemptId);
            parameters.put("vnp_OrderInfo", "Thanh toan lich hen " + appointmentId);
            parameters.put("vnp_OrderType", "other");
            parameters.put("vnp_Locale", "vn");
            parameters.put("vnp_ReturnUrl", returnUrl);
            parameters.put("vnp_IpAddr", clientIp == null || clientIp.isBlank() ? "127.0.0.1" : clientIp);
            parameters.put("vnp_CreateDate", formatter.format(now));
            parameters.put("vnp_ExpireDate", formatter.format(now.plusMinutes(15)));

            var signedData = parameters.entrySet().stream()
                    .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                    .reduce((left, right) -> left + "&" + right)
                    .orElseThrow();
            var url = paymentUrl + (paymentUrl.contains("?") ? "&" : "?")
                    + signedData + "&vnp_SecureHash=" + hmacSha512(hashSecret, signedData);
            return new PaymentStartResult("ready", url, "Đã tạo liên kết thanh toán VNPay.");
        } catch (Exception exception) {
            return new PaymentStartResult("error", "", "Không thể tạo liên kết thanh toán VNPay.");
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String hmacSha512(String secret, String data) throws Exception {
        var mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        var digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        var hex = new StringBuilder(digest.length * 2);
        for (byte value : digest) hex.append(String.format("%02x", value & 0xff));
        return hex.toString();
    }

    public boolean verify(Map<String, String> response) {
        var receivedHash = response.getOrDefault("vnp_SecureHash", "");
        if (receivedHash.isBlank() || merchantCode.isBlank() || hashSecret.isBlank()) return false;
        if (!merchantCode.equals(response.get("vnp_TmnCode"))) return false;
        try {
            var fields = new TreeMap<String, String>();
            response.forEach((key, value) -> {
                if (key.startsWith("vnp_")
                        && !"vnp_SecureHash".equals(key)
                        && !"vnp_SecureHashType".equals(key)
                        && value != null
                        && !value.isBlank()) fields.put(key, value);
            });
            var signedData = fields.entrySet().stream()
                    .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                    .reduce((left, right) -> left + "&" + right)
                    .orElse("");
            return receivedHash.equalsIgnoreCase(hmacSha512(hashSecret, signedData));
        } catch (Exception exception) {
            return false;
        }
    }
}
