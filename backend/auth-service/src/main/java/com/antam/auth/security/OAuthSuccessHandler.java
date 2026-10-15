package com.antam.auth.security;

import com.antam.auth.user.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuthSuccessHandler implements AuthenticationSuccessHandler {
    private final UserService users;
    private final TokenService tokens;
    private final String frontendUrl;
    private final boolean secureCookie;

    public OAuthSuccessHandler(UserService users, TokenService tokens,
            @Value("${app.frontend-url}") String frontendUrl,
            @Value("${app.jwt.cookie-secure}") boolean secureCookie) {
        this.users = users;
        this.tokens = tokens;
        this.frontendUrl = frontendUrl;
        this.secureCookie = secureCookie;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        var oauth = (OAuth2AuthenticationToken) authentication;
        OAuth2User principal = oauth.getPrincipal();
        var provider = oauth.getAuthorizedClientRegistrationId().toUpperCase();
        var providerId = firstNonBlank(principal.getAttribute("sub"), principal.getAttribute("id"));
        var email = principal.<String>getAttribute("email");
        var name = firstNonBlank(principal.getAttribute("name"), email);
        var avatar = principal.<String>getAttribute("picture");
        var user = users.upsertSocial(provider, providerId, email, name, avatar);
        var issued = tokens.issue(user);
        response.addHeader(HttpHeaders.SET_COOKIE, authCookie(issued, secureCookie).toString());
        response.sendRedirect(frontendUrl + "/oauth/callback?provider="
                + URLEncoder.encode(provider.toLowerCase(), StandardCharsets.UTF_8));
    }

    private static String firstNonBlank(String first, String fallback) {
        return first == null || first.isBlank() ? fallback : first;
    }

    public static ResponseCookie authCookie(TokenService.IssuedToken token, boolean secure) {
        return ResponseCookie.from("ANTAM_TOKEN", token.value())
                .httpOnly(true).secure(secure).sameSite("Lax").path("/")
                .maxAge(token.maxAge()).build();
    }
}
