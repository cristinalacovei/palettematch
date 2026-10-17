package com.palettematch.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import com.palettematch.backend.config.AuthMode;
import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.entity.AuthProvider;
import com.palettematch.backend.repository.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

@ExtendWith(MockitoExtension.class)
class CurrentUserServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Test
    void demoModeResolvesOnlyExistingDemoIdentityFromTokenSubject() {
        AppUser demoUser = new AppUser(
                "demo-subject",
                "Demo visitor",
                "demo-subject@demo.invalid",
                AuthProvider.DEMO,
                Instant.now().plusSeconds(3600));
        when(appUserRepository.findByAuthProviderAndAuthSubject(AuthProvider.DEMO, "demo-subject"))
                .thenReturn(Optional.of(demoUser));
        Jwt jwt = jwt("demo-subject", "Demo visitor", "demo-subject@demo.invalid");

        AppUser resolvedUser = new CurrentUserService(appUserRepository, AuthMode.DEMO).resolve(jwt);

        assertThat(resolvedUser).isSameAs(demoUser);
        verify(appUserRepository, never()).save(any(AppUser.class));
    }

    @Test
    void demoModeDoesNotProvisionAnIdentityForAnUnknownSubject() {
        when(appUserRepository.findByAuthProviderAndAuthSubject(AuthProvider.DEMO, "unknown"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> new CurrentUserService(appUserRepository, AuthMode.DEMO)
                .resolve(jwt("unknown", "Visitor", "unknown@demo.invalid")))
                .isInstanceOf(InvalidUserClaimsException.class)
                .hasMessage("Demo identity is not registered.");
        verify(appUserRepository, never()).save(any(AppUser.class));
    }

    @Test
    void keycloakModeContinuesProvisioningUsersFromValidatedClaims() {
        Jwt jwt = jwt("keycloak-subject", "cristina", "cristina@example.com");
        when(appUserRepository.findByAuthProviderAndAuthSubject(
                AuthProvider.KEYCLOAK,
                "keycloak-subject")).thenReturn(Optional.empty());
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppUser resolvedUser = new CurrentUserService(appUserRepository, AuthMode.KEYCLOAK).resolve(jwt);

        assertThat(resolvedUser.getAuthProvider()).isEqualTo(AuthProvider.KEYCLOAK);
        assertThat(resolvedUser.getAuthSubject()).isEqualTo("keycloak-subject");
        verify(appUserRepository).save(any(AppUser.class));
    }

    private Jwt jwt(String subject, String username, String email) {
        return Jwt.withTokenValue("test-token")
                .header("alg", "RS256")
                .subject(subject)
                .claim("preferred_username", username)
                .claim("email", email)
                .build();
    }
}
