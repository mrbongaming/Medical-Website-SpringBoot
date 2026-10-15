package com.antam.auth.config;

import com.antam.auth.security.OAuthSuccessHandler;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    SecretKey jwtKey(@Value("${app.jwt.secret}") String secret) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET phải có ít nhất 32 byte.");
        }
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean JwtEncoder jwtEncoder(SecretKey jwtKey) { return NimbusJwtEncoder.withSecretKey(jwtKey).build(); }
    @Bean JwtDecoder jwtDecoder(SecretKey jwtKey) { return NimbusJwtDecoder.withSecretKey(jwtKey).build(); }
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    BearerTokenResolver bearerTokenResolver() {
        var header = new DefaultBearerTokenResolver();
        return request -> {
            var token = header.resolve(request);
            if (token != null || request.getCookies() == null) return token;
            return Arrays.stream(request.getCookies())
                    .filter(cookie -> "ANTAM_TOKEN".equals(cookie.getName()))
                    .map(Cookie::getValue).findFirst().orElse(null);
        };
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, OAuthSuccessHandler oauthSuccessHandler,
            BearerTokenResolver bearerTokenResolver) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/logout",
                                "/oauth2/**", "/login/oauth2/**", "/error", "/actuator/health").permitAll()
                        .anyRequest().authenticated())
                .oauth2Login(oauth -> oauth.successHandler(oauthSuccessHandler))
                .oauth2ResourceServer(oauth -> oauth
                        .bearerTokenResolver(bearerTokenResolver).jwt(Customizer.withDefaults()))
                .build();
    }

}
