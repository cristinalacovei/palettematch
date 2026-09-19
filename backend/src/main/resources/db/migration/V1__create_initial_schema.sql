CREATE TABLE app_users (
    id UUID PRIMARY KEY,
    keycloak_subject VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE palettes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    source VARCHAR(20) NOT NULL,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_palettes_user
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT ck_palettes_source
        CHECK (source IN ('GENERATOR', 'IMAGE'))
);

CREATE INDEX idx_palettes_user_id ON palettes(user_id);

CREATE TABLE palette_colors (
    id UUID PRIMARY KEY,
    palette_id UUID NOT NULL,
    hex_value VARCHAR(7) NOT NULL,
    position INTEGER NOT NULL,
    CONSTRAINT fk_palette_colors_palette
        FOREIGN KEY (palette_id) REFERENCES palettes(id) ON DELETE CASCADE,
    CONSTRAINT uk_palette_colors_palette_position UNIQUE (palette_id, position),
    CONSTRAINT ck_palette_colors_hex_value
        CHECK (hex_value ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT ck_palette_colors_position
        CHECK (position >= 0)
);

CREATE INDEX idx_palette_colors_palette_id ON palette_colors(palette_id);

CREATE TABLE palette_design_systems (
    id UUID PRIMARY KEY,
    palette_id UUID NOT NULL UNIQUE,
    background VARCHAR(7) NOT NULL,
    surface VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    primary_color VARCHAR(7) NOT NULL,
    accent_color VARCHAR(7) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_palette_design_systems_palette
        FOREIGN KEY (palette_id) REFERENCES palettes(id) ON DELETE CASCADE,
    CONSTRAINT ck_palette_design_systems_hex_values
        CHECK (
            background ~ '^#[0-9A-Fa-f]{6}$'
            AND surface ~ '^#[0-9A-Fa-f]{6}$'
            AND text_color ~ '^#[0-9A-Fa-f]{6}$'
            AND primary_color ~ '^#[0-9A-Fa-f]{6}$'
            AND accent_color ~ '^#[0-9A-Fa-f]{6}$'
        )
);
