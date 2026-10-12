package com.example.backend.auth.model;

import com.example.backend.user.entity.UserAccount;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record AuthenticatedUser(
        String id,
        String name,
        String phone,
        String password,
        String role,
        String branchId,
        String doctorId,
        boolean enabled) implements UserDetails {

    public static AuthenticatedUser from(UserAccount account) {
        return new AuthenticatedUser(
                account.getId(), account.getName(), account.getPhone(), account.getPasswordHash(),
                account.getRole(), account.getBranch() == null ? null : account.getBranch().getId(),
                account.getDoctor() == null ? null : account.getDoctor().getId(), account.isActive());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getUsername() { return phone; }

    @Override
    public String getPassword() { return password; }

    @Override
    public boolean isEnabled() { return enabled; }
}
