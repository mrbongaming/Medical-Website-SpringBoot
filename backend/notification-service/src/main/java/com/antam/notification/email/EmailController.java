package com.antam.notification.email;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/emails")
public class EmailController {
    private final EmailService emails;
    public EmailController(EmailService emails) { this.emails = emails; }

    @PostMapping("/welcome")
    public DeliveryResponse welcome(@Valid @RequestBody WelcomeRequest request) {
        var delivery = emails.send(request.to(), "Chào mừng đến với Bệnh viện An Tâm",
                "Xin chào " + request.name() + ",\n\nTài khoản của bạn đã được tạo thành công."
                        + " Bạn có thể đăng nhập để đặt và theo dõi lịch khám.\n\nBệnh viện An Tâm",
                "WELCOME");
        return new DeliveryResponse(delivery.getId(), delivery.getStatus());
    }

    @PostMapping("/appointment-confirmed")
    public DeliveryResponse appointment(@Valid @RequestBody AppointmentRequest request) {
        var delivery = emails.send(request.to(), "Xác nhận lịch khám " + request.appointmentCode(),
                "Xin chào " + request.name() + ",\n\nLịch khám " + request.appointmentCode()
                        + " đã được xác nhận vào " + request.schedule() + ".\n\nBệnh viện An Tâm",
                "APPOINTMENT_CONFIRMED");
        return new DeliveryResponse(delivery.getId(), delivery.getStatus());
    }

    public record WelcomeRequest(@Email @NotBlank String to, @NotBlank @Size(max = 150) String name) {}
    public record AppointmentRequest(@Email @NotBlank String to, @NotBlank String name,
            @NotBlank String appointmentCode, @NotBlank String schedule) {}
    public record DeliveryResponse(String id, String status) {}
}
