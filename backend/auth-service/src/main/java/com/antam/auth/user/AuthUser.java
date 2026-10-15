package com.antam.auth.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "auth_users")
public class AuthUser {
    @Id private String id;
    @Column(nullable = false, unique = true) private String email;
    @Column(name = "password_hash") private String passwordHash;
    @Column(name = "full_name", nullable = false) private String fullName;
    @Column(name = "avatar_url") private String avatarUrl;
    @Column(nullable = false) private String provider;
    @Column(name = "provider_id") private String providerId;
    @Column(nullable = false) private String role;
    private boolean active;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    protected AuthUser() {}

    public AuthUser(String id, String email, String passwordHash, String fullName, String provider,
                    String providerId, String avatarUrl) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.provider = provider;
        this.providerId = providerId;
        this.avatarUrl = avatarUrl;
        this.role = "PATIENT";
        this.active = true;
        this.createdAt = Instant.now();
        this.updatedAt = createdAt;
    }

    public void linkSocial(String provider, String providerId, String fullName, String avatarUrl) {
        this.provider = provider;
        this.providerId = providerId;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getFullName() { return fullName; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getProvider() { return provider; }
    public String getRole() { return role; }
    public boolean isActive() { return active; }
}
