package com.stockpilot.repository;

import com.stockpilot.entity.EmailVerificationToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    @EntityGraph(attributePaths = {"user", "user.business"})
    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    void deleteByUserId(Long userId);
}
