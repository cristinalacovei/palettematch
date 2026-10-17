package com.palettematch.backend.dto.palette;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreatePaletteRequest(
        @NotBlank @Size(max = 200) String name,
        @NotEmpty List<@NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String> colors,
        @NotBlank @Pattern(regexp = "^(generator|image)$") String source,
        boolean favorite,
        @Valid DesignSystemRequest designSystem) {
}
