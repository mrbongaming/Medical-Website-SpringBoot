package com.example.backend.user;

import java.time.LocalDate;
import java.util.regex.Pattern;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private static final Pattern PHONE = Pattern.compile("0[0-9]{9}");
    private final JdbcTemplate jdbc;

    public ProfileController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping
    @Transactional
    public Profile get(@AuthenticationPrincipal Jwt jwt) {
        ensureAccount(jwt);
        return jdbc.queryForObject(
                "select name, phone, birth_date, address from user_accounts where id = ?",
                (rs, row) -> new Profile(rs.getString("name"), rs.getString("phone"),
                        rs.getObject("birth_date", LocalDate.class), rs.getString("address")),
                jwt.getSubject());
    }

    @PutMapping
    @Transactional
    public Profile update(@AuthenticationPrincipal Jwt jwt, @RequestBody Profile input) {
        ensureAccount(jwt);
        if (input.phone() != null && !input.phone().isBlank() && !PHONE.matcher(input.phone()).matches())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không hợp lệ.");
        if (input.birthDate() != null && input.birthDate().isAfter(LocalDate.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày sinh không hợp lệ.");
        var phone = input.phone() == null || input.phone().isBlank() ? null : input.phone();
        try {
            jdbc.update("update user_accounts set phone = ?, birth_date = ?, address = ? where id = ?",
                    phone, input.birthDate(), input.address(), jwt.getSubject());
        } catch (DataIntegrityViolationException conflict) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Số điện thoại đã được sử dụng.");
        }
        return get(jwt);
    }

    public void ensureAccount(Jwt jwt) {
        String role = switch (jwt.getClaimAsString("role")) {
            case "DOCTOR" -> "doctor";
            case "STAFF" -> "staff";
            case "BRANCH_ADMIN" -> "branchAdmin";
            case "SUPER_ADMIN" -> "superAdmin";
            default -> "patient";
        };
        jdbc.update("insert into user_accounts (id, name, role, phone, active, version) "
                        + "values (?, ?, ?, null, true, 0) on duplicate key update id = id",
                jwt.getSubject(), jwt.getClaimAsString("name"), role);
    }

    public record Profile(String name, String phone, LocalDate birthDate, String address) {}
}
