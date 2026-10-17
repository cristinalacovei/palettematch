package com.palettematch.backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.entity.AuthProvider;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByAuthProviderAndAuthSubject(AuthProvider authProvider, String authSubject);

    List<AppUser> findByAuthProviderAndDemoExpiresAtBefore(
            AuthProvider authProvider,
            Instant expiresBefore);

    @Modifying
    @Query(value = "DELETE FROM app_users "
            + "WHERE auth_provider = 'DEMO' AND demo_expires_at <= :now",
            nativeQuery = true)
    int deleteExpiredDemoIdentities(@Param("now") Instant now);
}
