package com.antam.auth.security;

import com.antam.auth.user.AuthUser;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    private final JwtEncoder encoder;
    private final Duration expiration;

    public TokenService(JwtEncoder encoder, @Value("${app.jwt.expiration}") Duration expiration) {
        this.encoder = encoder;
        this.expiration = expiration;
    }

    public IssuedToken issue(AuthUser user) {
        var now = Instant.now();
        var expiresAt = now.plus(expiration);
        var claims = JwtClaimsSet.builder()
                .issuer("antam-auth")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("name", user.getFullName())
                .claim("role", user.getRole())
                .build();
        var header = JwsHeader.with(MacAlgorithm.HS256).build();
        var value = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new IssuedToken(value, expiresAt, expiration);
    }

    public record IssuedToken(String value, Instant expiresAt, Duration maxAge) {}
}
