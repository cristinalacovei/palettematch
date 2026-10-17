package com.palettematch.backend.controller;

import com.palettematch.backend.service.DemoAuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
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

    public DemoAuthController(DemoAuthService demoAuthService) {
        this.demoAuthService = demoAuthService;
    }

    @PostMapping("/login")
    public DemoLoginResponse login(@Valid @RequestBody DemoLoginRequest request) {
        DemoAuthService.DemoLoginResult result = demoAuthService.login(request.password());
        return new DemoLoginResponse(result.accessToken(), "Bearer", result.expiresIn());
    }

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public LoginError invalidCredentials() {
        return new LoginError("INVALID_CREDENTIALS", "Invalid demo credentials.");
    }

    public record DemoLoginRequest(@NotBlank @Size(max = 72) String password) {
    }

    public record DemoLoginResponse(String accessToken, String tokenType, long expiresIn) {
    }

    public record LoginError(String code, String message) {
    }
}
