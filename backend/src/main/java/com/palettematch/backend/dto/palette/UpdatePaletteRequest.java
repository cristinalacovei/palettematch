package com.palettematch.backend.dto.palette;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdatePaletteRequest(
        @NotBlank @Size(max = 200) String name,
        @NotEmpty List<@NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String> colors,
        boolean favorite) {
}
