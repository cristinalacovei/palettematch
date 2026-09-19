package com.palettematch.backend.dto.palette;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record DesignSystemRequest(
        @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String background,
        @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String surface,
        @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String text,
        @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String primary,
        @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String accent) {
}
