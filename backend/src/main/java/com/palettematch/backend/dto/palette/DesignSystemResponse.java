package com.palettematch.backend.dto.palette;

import java.time.Instant;

public record DesignSystemResponse(
        String background,
        String surface,
        String text,
        String primary,
        String accent,
        Instant updatedAt) {
}
