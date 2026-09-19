package com.palettematch.backend.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "palette_colors", uniqueConstraints = @UniqueConstraint(
        name = "uk_palette_colors_palette_position",
        columnNames = {"palette_id", "position"}))
public class PaletteColor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "palette_id", nullable = false)
    private Palette palette;

    @Column(name = "hex_value", nullable = false, length = 7)
    private String hexValue;

    @Column(nullable = false)
    private int position;

    protected PaletteColor() {
    }

    PaletteColor(Palette palette, String hexValue, int position) {
        this.palette = palette;
        this.hexValue = hexValue;
        this.position = position;
    }

    public UUID getId() {
        return id;
    }

    public Palette getPalette() {
        return palette;
    }

    public String getHexValue() {
        return hexValue;
    }

    public int getPosition() {
        return position;
    }
}
