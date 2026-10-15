package com.palettematch.backend.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "palettes")
public class Palette {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaletteSource source;

    @Column(nullable = false)
    private boolean favorite;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "palette", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<PaletteColor> colors = new ArrayList<>();

    @OneToOne(mappedBy = "palette", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private PaletteDesignSystem designSystem;

    protected Palette() {
    }

    public Palette(AppUser user, String name, PaletteSource source, boolean favorite) {
        this.user = user;
        this.name = name;
        this.source = source;
        this.favorite = favorite;
    }

    public void addColor(String hexValue, int position) {
        colors.add(new PaletteColor(this, hexValue, position));
        colors.sort(Comparator.comparingInt(PaletteColor::getPosition));
    }

    public void replaceColors(List<String> hexValues) {
        colors.sort(Comparator.comparingInt(PaletteColor::getPosition));
        int sharedColorCount = Math.min(colors.size(), hexValues.size());

        for (int position = 0; position < sharedColorCount; position++) {
            colors.get(position).update(hexValues.get(position), position);
        }

        while (colors.size() > hexValues.size()) {
            colors.remove(colors.size() - 1);
        }

        for (int position = sharedColorCount; position < hexValues.size(); position++) {
            addColor(hexValues.get(position), position);
        }
    }

    public boolean prepareColorsForReplacement(int replacementCount) {
        colors.sort(Comparator.comparingInt(PaletteColor::getPosition));
        Set<Integer> occupiedPositions = new HashSet<>();
        for (PaletteColor color : colors) {
            occupiedPositions.add(color.getPosition());
        }

        int sharedColorCount = Math.min(colors.size(), replacementCount);
        boolean requiresTemporaryPositions = false;
        for (int position = 0; position < sharedColorCount; position++) {
            if (colors.get(position).getPosition() != position) {
                requiresTemporaryPositions = true;
                break;
            }
        }
        for (int position = sharedColorCount; position < replacementCount; position++) {
            if (occupiedPositions.contains(position)) {
                requiresTemporaryPositions = true;
                break;
            }
        }

        if (!requiresTemporaryPositions) {
            return false;
        }

        long temporaryPosition = replacementCount;
        for (PaletteColor color : colors) {
            while (temporaryPosition <= Integer.MAX_VALUE
                    && occupiedPositions.contains((int) temporaryPosition)) {
                temporaryPosition++;
            }
            if (temporaryPosition > Integer.MAX_VALUE) {
                throw new IllegalStateException("Unable to assign temporary palette color positions");
            }
            color.updatePosition((int) temporaryPosition);
            temporaryPosition++;
        }
        return true;
    }

    public void updateDetails(String name, boolean favorite) {
        this.name = name;
        this.favorite = favorite;
    }

    public void setDesignSystem(PaletteDesignSystem designSystem) {
        this.designSystem = designSystem;
        if (designSystem != null && designSystem.getPalette() != this) {
            designSystem.setPalette(this);
        }
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

    public AppUser getUser() {
        return user;
    }

    public String getName() {
        return name;
    }

    public PaletteSource getSource() {
        return source;
    }

    public boolean isFavorite() {
        return favorite;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<PaletteColor> getColors() {
        return colors;
    }

    public PaletteDesignSystem getDesignSystem() {
        return designSystem;
    }
}
