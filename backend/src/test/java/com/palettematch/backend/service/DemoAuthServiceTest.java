package com.palettematch.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.Instant;
import java.util.List;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.entity.AuthProvider;
import com.palettematch.backend.repository.AppUserRepository;
import com.palettematch.backend.security.DemoAuthProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@ExtendWith(MockitoExtension.class)
class DemoAuthServiceTest {

    private static final String PASSWORD = "portfolio-demo-password";
    private static final String ISSUER = "https://palettematch-demo-test.example";
    private static final String AUDIENCE = "palettematch-api-test";

    @Mock
    private AppUserRepository appUserRepository;

    private BCryptPasswordEncoder passwordEncoder;
    private JwtEncoder jwtEncoder;
    private JwtDecoder jwtDecoder;
    private DemoAuthService demoAuthService;

    @BeforeEach
    void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();
        RSAKey rsaKey = new RSAKey.Builder((java.security.interfaces.RSAPublicKey) keyPair.getPublic())
                .privateKey((java.security.interfaces.RSAPrivateKey) keyPair.getPrivate())
                .build();
        JWKSource<SecurityContext> jwkSource = new ImmutableJWKSet<>(new JWKSet(rsaKey));
        jwtEncoder = new NimbusJwtEncoder(jwkSource);

        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withPublicKey((java.security.interfaces.RSAPublicKey) keyPair.getPublic())
                .signatureAlgorithm(SignatureAlgorithm.RS256)
                .build();
        OAuth2TokenValidator<Jwt> audienceValidator = jwt -> jwt.getAudience().contains(AUDIENCE)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(
                        new OAuth2Error("invalid_token", "Required JWT audience is missing.", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(ISSUER),
                audienceValidator));
        jwtDecoder = decoder;

        passwordEncoder = new BCryptPasswordEncoder(10);
        DemoAuthProperties properties = new DemoAuthProperties(
                passwordEncoder.encode(PASSWORD),
                ISSUER,
                AUDIENCE);
        demoAuthService = new DemoAuthService(
                appUserRepository,
                passwordEncoder,
                jwtEncoder,
                properties);
        lenient().when(appUserRepository.save(any(AppUser.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void validSignInsCreateDistinctPersistedDemoIdentitiesAndSignedTokens() {
        Instant beforeFirstLogin = Instant.now();

        DemoAuthService.DemoLoginResult firstLogin = demoAuthService.login(PASSWORD);
        DemoAuthService.DemoLoginResult secondLogin = demoAuthService.login(PASSWORD);

        Jwt firstToken = jwtDecoder.decode(firstLogin.accessToken());
        Jwt secondToken = jwtDecoder.decode(secondLogin.accessToken());
        assertThat(firstToken.getSubject()).isNotEqualTo(secondToken.getSubject());
        assertThat(firstToken.getIssuer()).hasToString(ISSUER);
        assertThat(firstToken.getAudience()).containsExactly(AUDIENCE);
        assertThat(firstToken.getClaimAsString("auth_provider")).isEqualTo("DEMO");
        assertThat(firstToken.getExpiresAt())
                .isAfter(Instant.now().plus(DemoAuthService.TOKEN_LIFETIME).minusSeconds(2))
                .isBefore(Instant.now().plus(DemoAuthService.TOKEN_LIFETIME).plusSeconds(2));
        assertThat(firstLogin.expiresIn()).isEqualTo(DemoAuthService.TOKEN_LIFETIME.toSeconds());

        ArgumentCaptor<AppUser> savedUser = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository, org.mockito.Mockito.times(2)).save(savedUser.capture());
        assertThat(savedUser.getAllValues())
                .extracting(AppUser::getAuthProvider)
                .containsOnly(AuthProvider.DEMO);
        assertThat(savedUser.getAllValues())
                .extracting(AppUser::getDemoExpiresAt)
                .allSatisfy(expiration -> assertThat(expiration)
                        .isAfter(beforeFirstLogin.plus(DemoAuthService.IDENTITY_LIFETIME).minusSeconds(2))
                        .isBefore(Instant.now().plus(DemoAuthService.IDENTITY_LIFETIME).plusSeconds(2)));
    }

    @Test
    void invalidPasswordDoesNotCreateAnIdentity() {
        assertThatThrownBy(() -> demoAuthService.login("incorrect"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid demo credentials.");

        verify(appUserRepository, never()).save(any(AppUser.class));
    }

    @Test
    void decoderRejectsTamperedExpiredWrongIssuerAndWrongAudienceTokens() {
        DemoAuthService.DemoLoginResult login = demoAuthService.login(PASSWORD);
        String[] parts = login.accessToken().split("\\.");
        char replacement = parts[2].charAt(5) == 'A' ? 'B' : 'A';
        String alteredSignature = parts[2].substring(0, 5) + replacement + parts[2].substring(6);
        assertThatThrownBy(() -> jwtDecoder.decode(parts[0] + "." + parts[1] + "." + alteredSignature))
                .isInstanceOf(JwtException.class);

        Instant now = Instant.now();
        assertInvalidClaims(now.minusSeconds(120), now.minusSeconds(60), ISSUER, AUDIENCE);
        assertInvalidClaims(now, now.plusSeconds(60), "https://wrong-issuer.example", AUDIENCE);
        assertInvalidClaims(now, now.plusSeconds(60), ISSUER, "wrong-audience");
    }

    private void assertInvalidClaims(Instant issuedAt, Instant expiresAt, String issuer, String audience) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .audience(List.of(audience))
                .subject("test-subject")
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(SignatureAlgorithm.RS256).build(),
                claims)).getTokenValue();

        assertThatThrownBy(() -> jwtDecoder.decode(token))
                .isInstanceOf(JwtException.class);
    }
}
