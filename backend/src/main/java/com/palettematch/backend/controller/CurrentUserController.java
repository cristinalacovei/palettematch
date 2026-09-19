package com.palettematch.backend.controller;

import java.time.Instant;
import java.util.UUID;

import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.service.CurrentUserService;
import com.palettematch.backend.service.InvalidUserClaimsException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CurrentUserController {

    private final CurrentUserService currentUserService;

    public CurrentUserController(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    @GetMapping("/api/users/me")
    public CurrentUserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return CurrentUserResponse.from(currentUserService.resolve(jwt));
    }

    @ExceptionHandler(InvalidUserClaimsException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse invalidClaims(InvalidUserClaimsException exception) {
        return new ErrorResponse("INVALID_USER_CLAIMS", exception.getMessage());
    }

    public record CurrentUserResponse(
            UUID id,
            String username,
            String email,
            Instant createdAt) {

        static CurrentUserResponse from(AppUser user) {
            return new CurrentUserResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getCreatedAt());
        }
    }

    public record ErrorResponse(String code, String message) {
    }
}
