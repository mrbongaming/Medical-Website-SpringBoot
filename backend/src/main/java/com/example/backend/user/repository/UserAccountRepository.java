package com.example.backend.user.repository;

import com.example.backend.user.entity.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, String> {
    @EntityGraph(attributePaths = {"branch", "doctor"})
    Optional<UserAccount> findByPhoneAndActiveTrue(String phone);
}
