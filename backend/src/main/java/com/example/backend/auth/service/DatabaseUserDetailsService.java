package com.example.backend.auth.service;

import com.example.backend.auth.model.AuthenticatedUser;
import com.example.backend.user.repository.UserAccountRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DatabaseUserDetailsService implements UserDetailsService {
    private final UserAccountRepository repository;

    public DatabaseUserDetailsService(UserAccountRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        return repository.findByPhoneAndActiveTrue(phone.trim())
                .map(AuthenticatedUser::from)
                .filter(user -> user.password() != null && !user.password().isBlank())
                .orElseThrow(() -> new UsernameNotFoundException("Tài khoản hoặc mật khẩu không hợp lệ."));
    }
}
