package com.palettematch.backend.service;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.entity.AuthProvider;
import com.palettematch.backend.repository.AppUserRepository;
import com.palettematch.backend.security.DemoAuthProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(prefix = "app.auth", name = "mode", havingValue = "demo")
public class DemoAuthService {

    public static final Duration TOKEN_LIFETIME = Duration.ofMinutes(15);
    public static final Duration IDENTITY_LIFETIME = Duration.ofDays(30);
    private static final int BCRYPT_MAX_PASSWORD_BYTES = 72;

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final DemoAuthProperties properties;

    public DemoAuthService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            DemoAuthProperties properties) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.properties = properties;
    }

    @Transactional
    public DemoLoginResult login(String password) {
        if (password == null
                || password.getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_PASSWORD_BYTES
                || !passwordEncoder.matches(password, properties.passwordBcrypt())) {
            throw new BadCredentialsException("Invalid demo credentials.");
        }

        Instant now = Instant.now();
        String subject = UUID.randomUUID().toString();
        AppUser user = appUserRepository.save(new AppUser(
                subject,
                "Demo visitor",
                subject + "@demo.invalid",
                AuthProvider.DEMO,
                now.plus(IDENTITY_LIFETIME)));

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(properties.issuer())
                .audience(List.of(properties.audience()))
                .subject(user.getAuthSubject())
                .issuedAt(now)
                .expiresAt(now.plus(TOKEN_LIFETIME))
                .claim("preferred_username", user.getUsername())
                .claim("email", user.getEmail())
                .claim("auth_provider", AuthProvider.DEMO.name())
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(SignatureAlgorithm.RS256).build(),
                claims)).getTokenValue();
        return new DemoLoginResult(token, TOKEN_LIFETIME.toSeconds());
    }

    public record DemoLoginResult(String accessToken, long expiresIn) {
    }
}
