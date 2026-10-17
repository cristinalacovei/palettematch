package com.palettematch.backend.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "app_users", uniqueConstraints = @UniqueConstraint(
        name = "uk_app_users_provider_subject",
        columnNames = {"auth_provider", "auth_subject"}))
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @UuidGenerator
    private UUID id;

    @Column(name = "auth_subject", nullable = false, length = 255)
    private String authSubject;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20)
    private AuthProvider authProvider;

    @Column(name = "demo_expires_at")
    private Instant demoExpiresAt;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AppUser() {
    }

    public AppUser(String authSubject, String username, String email) {
        this(authSubject, username, email, AuthProvider.KEYCLOAK, null);
    }

    public AppUser(
            String authSubject,
            String username,
            String email,
            AuthProvider authProvider,
            Instant demoExpiresAt) {
        this.authSubject = authSubject;
        this.username = username;
        this.email = email;
        this.authProvider = authProvider;
        this.demoExpiresAt = demoExpiresAt;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getAuthSubject() {
        return authSubject;
    }

    public AuthProvider getAuthProvider() {
        return authProvider;
    }

    public Instant getDemoExpiresAt() {
        return demoExpiresAt;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public void updateProfile(String username, String email) {
        this.username = username;
        this.email = email;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
