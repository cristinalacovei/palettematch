package com.palettematch.backend.service;

import java.time.Instant;

import com.palettematch.backend.config.AuthMode;
import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.entity.AuthProvider;
import com.palettematch.backend.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurrentUserService {

    private final AppUserRepository appUserRepository;
    private final AuthMode authMode;

    public CurrentUserService(
            AppUserRepository appUserRepository,
            @Value("${app.auth.mode:keycloak}") AuthMode authMode) {
        this.appUserRepository = appUserRepository;
        this.authMode = authMode;
    }

    @Transactional
    public AppUser resolve(Jwt jwt) {
        String subject = requiredClaim(jwt, "sub");
        String username = requiredClaim(jwt, "preferred_username");
        String email = requiredClaim(jwt, "email");

        AuthProvider provider = authMode == AuthMode.DEMO
                ? AuthProvider.DEMO
                : AuthProvider.KEYCLOAK;

        AppUser existingUser = appUserRepository.findByAuthProviderAndAuthSubject(provider, subject)
                .orElse(null);
        if (existingUser == null) {
            if (provider == AuthProvider.DEMO) {
                throw new DemoIdentityUnavailableException();
            }
            return appUserRepository.save(new AppUser(subject, username, email));
        }

        if (provider == AuthProvider.DEMO
                && (existingUser.getDemoExpiresAt() == null
                        || !existingUser.getDemoExpiresAt().isAfter(Instant.now()))) {
            throw new DemoIdentityUnavailableException();
        }

        return updateIfChanged(existingUser, username, email);
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
