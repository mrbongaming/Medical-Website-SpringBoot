package com.antam.notification.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    private final EmailDeliveryRepository deliveries;
    private final String from;

    public EmailService(JavaMailSender mailSender, EmailDeliveryRepository deliveries,
            @Value("${app.mail.from}") String from) {
        this.mailSender = mailSender;
        this.deliveries = deliveries;
        this.from = from;
    }

    @Transactional
    public EmailDelivery send(String to, String subject, String body, String template) {
        var delivery = deliveries.save(new EmailDelivery(to, subject, template));
        try {
            var message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            delivery.sent();
        } catch (MailException exception) {
            delivery.failed(exception.getMessage());
        }
        return deliveries.save(delivery);
    }
}
