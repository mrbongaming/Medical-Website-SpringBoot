package com.antam.auth.api;

import com.antam.auth.security.TokenService;
import com.antam.auth.user.AuthUser;
import java.time.Instant;

public record AuthResponse(String accessToken, Instant expiresAt, UserView user) {
    public static AuthResponse of(TokenService.IssuedToken token, AuthUser user) {
        return new AuthResponse(token.value(), token.expiresAt(), UserView.of(user));
    }

    public record UserView(String id, String email, String fullName, String avatarUrl,
                           String provider, String role) {
        public static UserView of(AuthUser user) {
            return new UserView(user.getId(), user.getEmail(), user.getFullName(),
                    user.getAvatarUrl(), user.getProvider(), user.getRole());
        }
    }
}
