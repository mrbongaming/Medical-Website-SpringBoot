package com.antam.notification.email;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "email_deliveries")
public class EmailDelivery {
    @Id private String id;
    @Column(nullable = false) private String recipient;
    @Column(nullable = false) private String subject;
    @Column(nullable = false) private String template;
    @Column(nullable = false) private String status;
    @Column(name = "error_message") private String errorMessage;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "sent_at") private Instant sentAt;

    protected EmailDelivery() {}
    public EmailDelivery(String recipient, String subject, String template) {
        this.id = UUID.randomUUID().toString();
        this.recipient = recipient;
        this.subject = subject;
        this.template = template;
        this.status = "PENDING";
        this.createdAt = Instant.now();
    }
    public void sent() { this.status = "SENT"; this.sentAt = Instant.now(); }
    public void failed(String message) {
        this.status = "FAILED";
        this.errorMessage = message == null ? "Unknown mail error" : message.substring(0, Math.min(1000, message.length()));
    }
    public String getId() { return id; }
    public String getStatus() { return status; }
}
