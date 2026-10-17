package com.palettematch.backend.controller;

import java.time.Duration;
import java.util.Optional;

import com.palettematch.backend.service.DemoAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/demo")
@ConditionalOnProperty(prefix = "app.auth", name = "mode", havingValue = "demo")
public class DemoAuthController {

    private final DemoAuthService demoAuthService;
    private final DemoLoginRateLimiter rateLimiter;

    public DemoAuthController(DemoAuthService demoAuthService, DemoLoginRateLimiter rateLimiter) {
        this.demoAuthService = demoAuthService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody DemoLoginRequest request,
            HttpServletRequest servletRequest) {
        Optional<Duration> retryAfter = rateLimiter.tryAcquire(clientAddress(servletRequest));
        if (retryAfter.isPresent()) {
            long retryAfterSeconds = Math.max(1, (retryAfter.get().toMillis() + 999) / 1000);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, Long.toString(retryAfterSeconds))
                    .body(new LoginError(
                            "RATE_LIMITED",
                            "Too many demo sign-in attempts. Please try again later."));
        }

        DemoAuthService.DemoLoginResult result = demoAuthService.login(request.password());
        return ResponseEntity.ok(new DemoLoginResponse(result.accessToken(), "Bearer", result.expiresIn()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public LoginError invalidCredentials() {
        return new LoginError("INVALID_CREDENTIALS", "Invalid demo credentials.");
    }

    private String clientAddress(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String clientAddress = forwardedFor.split(",", 2)[0].trim();
            if (!clientAddress.isBlank()) {
                return clientAddress;
            }
        }
        return request.getRemoteAddr();
    }

    public record DemoLoginRequest(@NotBlank @Size(max = 72) String password) {
    }

    public record DemoLoginResponse(String accessToken, String tokenType, long expiresIn) {
    }

    public record LoginError(String code, String message) {
    }
}
