package com.antam.auth.user;

import java.util.Locale;
import java.util.UUID;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final AuthUserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserService(AuthUserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthUser register(String email, String password, String fullName) {
        var normalized = email.trim().toLowerCase(Locale.ROOT);
        if (users.findByEmailIgnoreCase(normalized).isPresent()) {
            throw new IllegalArgumentException("Email đã được sử dụng.");
        }
        return users.save(new AuthUser(UUID.randomUUID().toString(), normalized,
                passwordEncoder.encode(password), fullName.trim(), "LOCAL", null, null));
    }

    @Transactional(readOnly = true)
    public AuthUser authenticate(String email, String password) {
        var user = users.findByEmailIgnoreCase(email.trim())
                .filter(AuthUser::isActive)
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không đúng."));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không đúng.");
        }
        return user;
    }

    @Transactional
    public AuthUser upsertSocial(String provider, String providerId, String email,
                                 String fullName, String avatarUrl) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Nhà cung cấp chưa trả về email.");
        }
        var normalized = email.trim().toLowerCase(Locale.ROOT);
        var user = users.findByEmailIgnoreCase(normalized)
                .orElseGet(() -> new AuthUser(UUID.randomUUID().toString(), normalized, null,
                        fullName, provider, providerId, avatarUrl));
        user.linkSocial(provider, providerId, fullName, avatarUrl);
        return users.save(user);
    }
}
