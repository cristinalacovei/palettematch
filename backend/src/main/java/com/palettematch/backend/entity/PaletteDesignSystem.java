package com.palettematch.backend.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "palette_design_systems")
public class PaletteDesignSystem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @UuidGenerator
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "palette_id", nullable = false, unique = true)
    private Palette palette;

    @Column(nullable = false, length = 7)
    private String background;

    @Column(nullable = false, length = 7)
    private String surface;

    @Column(name = "text_color", nullable = false, length = 7)
    private String textColor;

    @Column(name = "primary_color", nullable = false, length = 7)
    private String primaryColor;

    @Column(name = "accent_color", nullable = false, length = 7)
    private String accentColor;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected PaletteDesignSystem() {
    }

    public PaletteDesignSystem(
            String background,
            String surface,
            String textColor,
            String primaryColor,
            String accentColor) {
        this.background = background;
        this.surface = surface;
        this.textColor = textColor;
        this.primaryColor = primaryColor;
        this.accentColor = accentColor;
    }

    void setPalette(Palette palette) {
        this.palette = palette;
    }

    public void updateColors(
            String background,
            String surface,
            String textColor,
            String primaryColor,
            String accentColor) {
        this.background = background;
        this.surface = surface;
        this.textColor = textColor;
        this.primaryColor = primaryColor;
        this.accentColor = accentColor;
    }

    @PrePersist
    @PreUpdate
    void updateTimestamp() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Palette getPalette() {
        return palette;
    }

    public String getBackground() {
        return background;
    }

    public String getSurface() {
        return surface;
    }

    public String getTextColor() {
        return textColor;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public String getAccentColor() {
        return accentColor;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
