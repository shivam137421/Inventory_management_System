package com.stockpilot.repository;

import com.stockpilot.entity.PasswordResetToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    @EntityGraph(attributePaths = {"user", "user.business"})
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    void deleteByUserId(Long userId);
}
