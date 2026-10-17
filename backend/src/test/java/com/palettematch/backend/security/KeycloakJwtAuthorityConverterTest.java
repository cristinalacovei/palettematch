package com.palettematch.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

class KeycloakJwtAuthorityConverterTest {

    private final KeycloakJwtAuthorityConverter converter = new KeycloakJwtAuthorityConverter();

    @Test
    void mapsKeycloakRealmRolesToSpringAuthorities() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("realm_access", Map.of("roles", java.util.List.of("USER", "ADMIN")))
                .build();

        assertThat(converter.convert(jwt))
                .containsExactlyInAnyOrder(
                        new SimpleGrantedAuthority("ROLE_USER"),
                        new SimpleGrantedAuthority("ROLE_ADMIN"));
    }
}
