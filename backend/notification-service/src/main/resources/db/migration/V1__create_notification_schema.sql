CREATE TABLE email_deliveries (
    id VARCHAR(36) PRIMARY KEY,
    recipient VARCHAR(190) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template VARCHAR(60) NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message VARCHAR(1000),
    created_at TIMESTAMP(6) NOT NULL,
    sent_at TIMESTAMP(6) NULL DEFAULT NULL,
    INDEX idx_email_deliveries_status_created (status, created_at)
);
