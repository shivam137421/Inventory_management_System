package com.stockpilot.repository;

import com.stockpilot.entity.UserRefreshToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRefreshTokenRepository extends JpaRepository<UserRefreshToken, Long> {

    @EntityGraph(attributePaths = {"user", "user.business"})
    Optional<UserRefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE UserRefreshToken r SET r.revoked = true WHERE r.user.id = :userId")
    void revokeAllByUserId(@Param("userId") Long userId);
}
