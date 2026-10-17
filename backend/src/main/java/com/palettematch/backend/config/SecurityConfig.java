package com.palettematch.backend.config;

import com.palettematch.backend.security.KeycloakJwtAuthorityConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            KeycloakJwtAuthorityConverter authorityConverter,
            @Value("${app.auth.mode:keycloak}") AuthMode authMode) throws Exception {
        JwtGrantedAuthoritiesConverter scopeConverter = new JwtGrantedAuthoritiesConverter();

        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> {
                    authorize
                            .requestMatchers("/api/health", "/error").permitAll()
                            .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll();
                    if (authMode == AuthMode.DEMO) {
                        authorize.requestMatchers("/api/auth/demo/login").permitAll();
                    }
                    authorize
                            .requestMatchers("/api/**").authenticated()
                            .anyRequest().permitAll();
                })
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(token -> {
                            var authorities = new java.util.ArrayList<>(
                                    scopeConverter.convert(token));
                            authorities.addAll(authorityConverter.convert(token));
                            return new JwtAuthenticationToken(token, authorities);
                        })));

        return http.build();
    }
}
