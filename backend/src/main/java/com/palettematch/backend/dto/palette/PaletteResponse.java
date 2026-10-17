package com.palettematch.backend.dto.palette;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PaletteResponse(
        UUID id,
        String name,
        List<String> colors,
        String source,
        boolean favorite,
        DesignSystemResponse designSystem,
        Instant createdAt,
        Instant updatedAt) {
}
