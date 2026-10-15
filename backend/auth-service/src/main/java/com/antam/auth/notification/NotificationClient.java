package com.antam.auth.notification;

import com.antam.auth.user.AuthUser;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class NotificationClient {
    private static final Logger log = LoggerFactory.getLogger(NotificationClient.class);
    private final RestClient client;
    private final String internalKey;

    public NotificationClient(RestClient.Builder builder,
            @Value("${app.notification.url}") String baseUrl,
            @Value("${app.notification.internal-key}") String internalKey) {
        this.client = builder.baseUrl(baseUrl).build();
        this.internalKey = internalKey;
    }

    public void sendWelcome(AuthUser user) {
        try {
            client.post().uri("/internal/emails/welcome")
                    .header("X-Internal-Key", internalKey)
                    .body(Map.of("to", user.getEmail(), "name", user.getFullName()))
                    .retrieve().toBodilessEntity();
        } catch (RuntimeException exception) {
            log.warn("Không thể gửi email chào mừng cho {}: {}", user.getEmail(), exception.getMessage());
        }
    }
}
