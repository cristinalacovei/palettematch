package com.palettematch.backend.service;

import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.oauth2.jwt.Jwt;

@Service
public class CurrentUserService {

    private final AppUserRepository appUserRepository;

    public CurrentUserService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public AppUser resolve(Jwt jwt) {
        String subject = requiredClaim(jwt, "sub");
        String username = requiredClaim(jwt, "preferred_username");
        String email = requiredClaim(jwt, "email");

        return appUserRepository.findByKeycloakSubject(subject)
                .map(existingUser -> updateIfChanged(existingUser, username, email))
                .orElseGet(() -> appUserRepository.save(new AppUser(subject, username, email)));
    }

    private AppUser updateIfChanged(AppUser user, String username, String email) {
        if (!username.equals(user.getUsername()) || !email.equals(user.getEmail())) {
            user.updateProfile(username, email);
        }
        return user;
    }

    private String requiredClaim(Jwt jwt, String claimName) {
        String value = jwt.getClaimAsString(claimName);
        if (value == null || value.isBlank()) {
            throw new InvalidUserClaimsException("Authenticated token is missing required claim: " + claimName);
        }
        return value;
    }
}
