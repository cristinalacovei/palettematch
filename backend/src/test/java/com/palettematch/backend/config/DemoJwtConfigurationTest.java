package com.palettematch.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

import com.palettematch.backend.security.DemoAuthProperties;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtException;

class DemoJwtConfigurationTest {

    private static final String ISSUER = "https://palettematch-demo.example";
    private static final String AUDIENCE = "palettematch-api";

    @Test
    void demoModeBuildsJwtBeansThatRequireIssuerAudienceSignatureAndExpiry() throws Exception {
        KeyPair keyPair = generateKeyPair();
        contextRunner(keyPair).run(context -> {
            assertThat(context).hasNotFailed();
            DemoAuthProperties properties = context.getBean(DemoAuthProperties.class);
            assertThat(properties.issuer()).isEqualTo(ISSUER);

            JwtEncoder encoder = context.getBean(JwtEncoder.class);
            JwtDecoder decoder = context.getBean(JwtDecoder.class);
            JwtClaimsSet validClaims = JwtClaimsSet.builder()
                    .issuer(ISSUER)
                    .audience(java.util.List.of(AUDIENCE))
                    .subject("demo-subject")
                    .issuedAt(java.time.Instant.now())
                    .expiresAt(java.time.Instant.now().plusSeconds(60))
                    .build();
            String validToken = encoder.encode(JwtEncoderParameters.from(
                    JwsHeader.with(SignatureAlgorithm.RS256).build(),
                    validClaims)).getTokenValue();

            assertThat(decoder.decode(validToken).getSubject()).isEqualTo("demo-subject");
            assertThatThrownBy(() -> decoder.decode(encode(
                    encoder,
                    "https://wrong-issuer.example",
                    AUDIENCE,
                    java.time.Instant.now().plusSeconds(60))))
                    .isInstanceOf(JwtException.class);
            assertThatThrownBy(() -> decoder.decode(encode(
                    encoder,
                    ISSUER,
                    "wrong-audience",
                    java.time.Instant.now().plusSeconds(60))))
                    .isInstanceOf(JwtException.class);
            assertThatThrownBy(() -> decoder.decode(encode(
                    encoder,
                    ISSUER,
                    AUDIENCE,
                    java.time.Instant.now().minusSeconds(60))))
                    .isInstanceOf(JwtException.class);
            assertThatThrownBy(() -> decoder.decode(encodeWithoutExpiry(encoder)))
                    .isInstanceOf(JwtException.class);
        });
    }

    @Test
    void demoModeFailsStartupWhenRequiredSecretsAreMissing() throws Exception {
        contextRunner(generateKeyPair())
                .withPropertyValues(
                        "app.auth.demo.password-bcrypt=",
                        "app.auth.demo.jwt-private-key-base64=",
                        "app.auth.demo.jwt-public-key-base64=")
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void demoModeFailsStartupWhenSigningKeysAreMissing() throws Exception {
        contextRunner(generateKeyPair())
                .withPropertyValues(
                        "app.auth.demo.jwt-private-key-base64=",
                        "app.auth.demo.jwt-public-key-base64=")
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void keycloakModeDoesNotLoadDemoSecretsOrJwtBeans() {
        new ApplicationContextRunner()
                .withUserConfiguration(DemoJwtConfiguration.class)
                .withPropertyValues("app.auth.mode=keycloak")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).doesNotHaveBean(JwtEncoder.class);
                    assertThat(context).doesNotHaveBean(JwtDecoder.class);
                });
    }

    private ApplicationContextRunner contextRunner(KeyPair keyPair) {
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        return new ApplicationContextRunner()
                .withUserConfiguration(DemoJwtConfiguration.class)
                .withPropertyValues(
                        "app.auth.mode=demo",
                        "app.auth.demo.password-bcrypt=" + passwordEncoder.encode("test-password"),
                        "app.auth.demo.jwt-issuer=" + ISSUER,
                        "app.auth.demo.jwt-audience=" + AUDIENCE,
                        "app.auth.demo.jwt-private-key-base64=" + Base64.getEncoder()
                                .encodeToString(keyPair.getPrivate().getEncoded()),
                        "app.auth.demo.jwt-public-key-base64=" + Base64.getEncoder()
                                .encodeToString(keyPair.getPublic().getEncoded()));
    }

    private KeyPair generateKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    private String encode(JwtEncoder encoder, String issuer, String audience, java.time.Instant expiresAt) {
        java.time.Instant issuedAt = expiresAt.isBefore(java.time.Instant.now())
                ? expiresAt.minusSeconds(60)
                : java.time.Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .audience(java.util.List.of(audience))
                .subject("test-subject")
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .build();
        return encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(SignatureAlgorithm.RS256).build(),
                claims)).getTokenValue();
    }

    private String encodeWithoutExpiry(JwtEncoder encoder) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .audience(java.util.List.of(AUDIENCE))
                .subject("test-subject")
                .issuedAt(java.time.Instant.now())
                .build();
        return encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(SignatureAlgorithm.RS256).build(),
                claims)).getTokenValue();
    }
}
