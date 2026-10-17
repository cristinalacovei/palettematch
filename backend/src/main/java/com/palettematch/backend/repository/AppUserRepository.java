package com.palettematch.backend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.entity.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByAuthProviderAndAuthSubject(AuthProvider authProvider, String authSubject);

    List<AppUser> findByAuthProviderAndDemoExpiresAtBefore(
            AuthProvider authProvider,
            Instant expiresBefore);
}
