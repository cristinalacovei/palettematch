package com.palettematch.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.palettematch.backend.config.SecurityConfig;
import com.palettematch.backend.config.WebConfig;
import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.service.CurrentUserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = {HealthController.class, CurrentUserController.class})
@Import({SecurityConfig.class, WebConfig.class})
class SecurityEndpointTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private CurrentUserService currentUserService;

    @Test
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    @Test
    void currentUserRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void demoLoginIsNotPublicInKeycloakMode() throws Exception {
        mockMvc.perform(post("/api/auth/demo/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"not-a-secret\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedCurrentUserRequestIsAccepted() throws Exception {
        when(currentUserService.resolve(any(Jwt.class)))
                .thenReturn(new AppUser("subject", "cristina", "cristina@example.com"));

        mockMvc.perform(get("/api/users/me").with(jwt()
                        .jwt(jwt -> jwt
                                .subject("subject")
                                .claim("preferred_username", "cristina")
                                .claim("email", "cristina@example.com"))))
                .andExpect(status().isOk());
    }
}
