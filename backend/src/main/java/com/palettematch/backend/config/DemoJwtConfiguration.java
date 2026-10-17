package com.palettematch.backend.config;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.Signature;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.palettematch.backend.security.DemoAuthProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(prefix = "app.auth", name = "mode", havingValue = "demo")
public class DemoJwtConfiguration {

    private static final String BCRYPT_HASH_PATTERN = "\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}";
    private static final byte[] KEY_PAIR_PROBE = "palettematch-demo-key-pair-check".getBytes(StandardCharsets.UTF_8);

    @Bean
    DemoAuthProperties demoAuthProperties(
            @Value("${app.auth.demo.password-bcrypt:}") String passwordBcrypt,
            @Value("${app.auth.demo.jwt-issuer:}") String issuer,
            @Value("${app.auth.demo.jwt-audience:}") String audience) {
        if (!passwordBcrypt.matches(BCRYPT_HASH_PATTERN)) {
            throw new IllegalStateException("DEMO_PASSWORD_BCRYPT must be a valid BCrypt hash.");
        }
        int bcryptCost = Integer.parseInt(passwordBcrypt.substring(4, 6));
        if (bcryptCost < 10 || bcryptCost > 16) {
            throw new IllegalStateException("DEMO_PASSWORD_BCRYPT must use a BCrypt cost from 10 to 16.");
        }
        if (audience.isBlank()) {
            throw new IllegalStateException("Demo JWT audience must be configured.");
        }
        try {
            URI issuerUri = URI.create(issuer);
            if (!"https".equalsIgnoreCase(issuerUri.getScheme()) || issuerUri.getHost() == null) {
                throw new IllegalStateException("Demo JWT issuer must be an absolute HTTPS URI.");
            }
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Demo JWT issuer must be an absolute HTTPS URI.", exception);
        }
        return new DemoAuthProperties(passwordBcrypt, issuer, audience);
    }

    @Bean
    KeyPair demoJwtKeyPair(
            @Value("${app.auth.demo.jwt-private-key-base64:}") String privateKeyBase64,
            @Value("${app.auth.demo.jwt-public-key-base64:}") String publicKeyBase64) {
        if (privateKeyBase64.isBlank() || publicKeyBase64.isBlank()) {
            throw new IllegalStateException(
                    "Demo JWT private and public keys must be configured as Base64-encoded DER.");
        }

        try {
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            byte[] privateKeyBytes = Base64.getDecoder().decode(privateKeyBase64);
            byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyBase64);
            RSAPrivateKey privateKey = (RSAPrivateKey) keyFactory.generatePrivate(
                    new PKCS8EncodedKeySpec(privateKeyBytes));
            RSAPublicKey publicKey = (RSAPublicKey) keyFactory.generatePublic(
                    new X509EncodedKeySpec(publicKeyBytes));
            if (publicKey.getModulus().bitLength() < 2048
                    || privateKey.getModulus().bitLength() < 2048
                    || !matches(privateKey, publicKey)) {
                throw new IllegalStateException("Demo JWT RSA keys must match and be at least 2048 bits.");
            }
            return new KeyPair(publicKey, privateKey);
        } catch (IllegalArgumentException | java.security.GeneralSecurityException exception) {
            throw new IllegalStateException("Demo JWT RSA keys are invalid.", exception);
        }
    }

    @Bean
    PasswordEncoder demoPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    JwtEncoder demoJwtEncoder(KeyPair demoJwtKeyPair) {
        RSAKey rsaKey = new RSAKey.Builder((RSAPublicKey) demoJwtKeyPair.getPublic())
                .privateKey((RSAPrivateKey) demoJwtKeyPair.getPrivate())
                .keyID("palettematch-demo")
                .build();
        JWKSource<SecurityContext> jwkSource = new ImmutableJWKSet<>(new JWKSet(rsaKey));
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    JwtDecoder demoJwtDecoder(KeyPair demoJwtKeyPair, DemoAuthProperties properties) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withPublicKey((RSAPublicKey) demoJwtKeyPair.getPublic())
                .signatureAlgorithm(SignatureAlgorithm.RS256)
                .build();
        OAuth2TokenValidator<Jwt> audienceValidator = jwt -> jwt.getAudience().contains(properties.audience())
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(
                        new OAuth2Error("invalid_token", "Required JWT audience is missing.", null));
        OAuth2TokenValidator<Jwt> expiryClaimValidator = jwt -> jwt.getExpiresAt() != null
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(
                        new OAuth2Error("invalid_token", "JWT expiry is required.", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(properties.issuer()),
                audienceValidator,
                expiryClaimValidator));
        return decoder;
    }

    private static boolean matches(RSAPrivateKey privateKey, RSAPublicKey publicKey)
            throws java.security.GeneralSecurityException {
        Signature signer = Signature.getInstance("SHA256withRSA");
        signer.initSign(privateKey);
        signer.update(KEY_PAIR_PROBE);
        byte[] signature = signer.sign();

        Signature verifier = Signature.getInstance("SHA256withRSA");
        verifier.initVerify(publicKey);
        verifier.update(KEY_PAIR_PROBE);
        return verifier.verify(signature);
    }
}
