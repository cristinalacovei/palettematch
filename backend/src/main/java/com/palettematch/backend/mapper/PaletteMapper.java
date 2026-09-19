package com.palettematch.backend.mapper;

import com.palettematch.backend.dto.palette.DesignSystemResponse;
import com.palettematch.backend.dto.palette.PaletteResponse;
import com.palettematch.backend.entity.Palette;
import com.palettematch.backend.entity.PaletteDesignSystem;
import org.springframework.stereotype.Component;

@Component
public class PaletteMapper {

    public PaletteResponse toResponse(Palette palette) {
        DesignSystemResponse designSystem = palette.getDesignSystem() == null
                ? null
                : toDesignSystemResponse(palette.getDesignSystem());

        return new PaletteResponse(
                palette.getId(),
                palette.getName(),
                palette.getColors().stream().map(color -> color.getHexValue()).toList(),
                palette.getSource().name().toLowerCase(),
                palette.isFavorite(),
                designSystem,
                palette.getCreatedAt(),
                palette.getUpdatedAt());
    }

    private DesignSystemResponse toDesignSystemResponse(PaletteDesignSystem designSystem) {
        return new DesignSystemResponse(
                designSystem.getBackground(),
                designSystem.getSurface(),
                designSystem.getTextColor(),
                designSystem.getPrimaryColor(),
                designSystem.getAccentColor(),
                designSystem.getUpdatedAt());
    }
}
