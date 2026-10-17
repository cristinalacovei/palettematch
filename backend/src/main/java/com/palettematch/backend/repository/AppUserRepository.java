package com.palettematch.backend.repository;

import java.util.Optional;
import java.util.UUID;

import com.palettematch.backend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByKeycloakSubject(String keycloakSubject);
}
