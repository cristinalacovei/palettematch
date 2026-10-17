package com.palettematch.backend.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.Optional;

import com.palettematch.backend.config.SecurityConfig;
import com.palettematch.backend.config.WebConfig;
import com.palettematch.backend.service.DemoAuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = DemoAuthController.class,
        properties = "app.auth.mode=demo")
@Import({SecurityConfig.class, WebConfig.class})
class DemoAuthEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private DemoAuthService demoAuthService;

    @MockitoBean
    private DemoLoginRateLimiter rateLimiter;

    @Test
    void successfulLoginIsPublicAndReturnsBearerToken() throws Exception {
        when(rateLimiter.tryAcquire("203.0.113.5")).thenReturn(Optional.empty());
        when(demoAuthService.login("correct-password"))
                .thenReturn(new DemoAuthService.DemoLoginResult("signed-token", 900));

        mockMvc.perform(post("/api/auth/demo/login")
                        .header("X-Forwarded-For", "203.0.113.5, 10.0.0.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"correct-password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("signed-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900));
    }

    @Test
    void invalidCredentialsReturnUnauthorizedWithoutDetails() throws Exception {
        when(rateLimiter.tryAcquire("127.0.0.1")).thenReturn(Optional.empty());
        when(demoAuthService.login("incorrect-password"))
                .thenThrow(new BadCredentialsException("Invalid demo credentials."));

        mockMvc.perform(post("/api/auth/demo/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"incorrect-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Invalid demo credentials."));
    }

    @Test
    void rateLimitedLoginReturnsTooManyRequestsAndRetryHeader() throws Exception {
        when(rateLimiter.tryAcquire("203.0.113.7")).thenReturn(Optional.of(Duration.ofSeconds(32)));

        mockMvc.perform(post("/api/auth/demo/login")
                        .header("X-Forwarded-For", "203.0.113.7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"any-password\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "32"))
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    void protectedApisStillRejectAnonymousRequestsInDemoMode() throws Exception {
        mockMvc.perform(get("/api/palettes"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void blankPasswordsAreRejected() throws Exception {
        mockMvc.perform(post("/api/auth/demo/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\" \"}"))
                .andExpect(status().isBadRequest());
    }
}
