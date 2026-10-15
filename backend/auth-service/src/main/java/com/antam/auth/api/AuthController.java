package com.antam.auth.api;

import com.antam.auth.notification.NotificationClient;
import com.antam.auth.security.OAuthSuccessHandler;
import com.antam.auth.security.TokenService;
import com.antam.auth.user.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService users;
    private final TokenService tokens;
    private final NotificationClient notifications;
    private final boolean secureCookie;

    public AuthController(UserService users, TokenService tokens, NotificationClient notifications,
            @Value("${app.jwt.cookie-secure}") boolean secureCookie) {
        this.users = users;
        this.tokens = tokens;
        this.notifications = notifications;
        this.secureCookie = secureCookie;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        var user = users.register(request.email(), request.password(), request.fullName());
        notifications.sendWelcome(user);
        return response(user);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return response(users.authenticate(request.email(), request.password()));
    }

    @GetMapping("/me")
    public AuthResponse.UserView me(@AuthenticationPrincipal Jwt jwt) {
        return new AuthResponse.UserView(jwt.getSubject(), jwt.getClaimAsString("email"),
                jwt.getClaimAsString("name"), null, null, jwt.getClaimAsString("role"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        var cookie = ResponseCookie.from("ANTAM_TOKEN", "")
                .httpOnly(true).secure(secureCookie).sameSite("Lax").path("/").maxAge(0).build();
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookie.toString()).build();
    }

    private ResponseEntity<AuthResponse> response(com.antam.auth.user.AuthUser user) {
        var token = tokens.issue(user);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, OAuthSuccessHandler.authCookie(token, secureCookie).toString())
                .body(AuthResponse.of(token, user));
    }
}
