ALTER TABLE app_users RENAME COLUMN keycloak_subject TO auth_subject;

ALTER TABLE app_users
    DROP CONSTRAINT app_users_keycloak_subject_key;

ALTER TABLE app_users
    ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'KEYCLOAK',
    ADD COLUMN demo_expires_at TIMESTAMPTZ;

ALTER TABLE app_users
    ADD CONSTRAINT uk_app_users_provider_subject
        UNIQUE (auth_provider, auth_subject),
    ADD CONSTRAINT ck_app_users_auth_provider
        CHECK (auth_provider IN ('KEYCLOAK', 'DEMO')),
    ADD CONSTRAINT ck_app_users_demo_expiration
        CHECK (
            (auth_provider = 'KEYCLOAK' AND demo_expires_at IS NULL)
            OR (auth_provider = 'DEMO' AND demo_expires_at IS NOT NULL)
        );

CREATE INDEX idx_app_users_demo_expires_at
    ON app_users (demo_expires_at)
    WHERE auth_provider = 'DEMO';
