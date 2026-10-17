package com.palettematch.backend.service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import com.palettematch.backend.dto.palette.CreatePaletteRequest;
import com.palettematch.backend.dto.palette.DesignSystemRequest;
import com.palettematch.backend.dto.palette.PaletteResponse;
import com.palettematch.backend.dto.palette.UpdatePaletteRequest;
import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.entity.Palette;
import com.palettematch.backend.entity.PaletteDesignSystem;
import com.palettematch.backend.entity.PaletteSource;
import com.palettematch.backend.exception.PaletteNotFoundException;
import com.palettematch.backend.mapper.PaletteMapper;
import com.palettematch.backend.repository.PaletteRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaletteService {

    private final PaletteRepository paletteRepository;
    private final CurrentUserService currentUserService;
    private final PaletteMapper paletteMapper;

    public PaletteService(
            PaletteRepository paletteRepository,
            CurrentUserService currentUserService,
            PaletteMapper paletteMapper) {
        this.paletteRepository = paletteRepository;
        this.currentUserService = currentUserService;
        this.paletteMapper = paletteMapper;
    }

    @Transactional
    public List<PaletteResponse> list(Jwt jwt) {
        AppUser user = currentUserService.resolve(jwt);
        return paletteRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(paletteMapper::toResponse)
                .toList();
    }

    @Transactional
    public PaletteResponse get(Jwt jwt, UUID paletteId) {
        return paletteMapper.toResponse(findOwned(jwt, paletteId));
    }

    @Transactional
    public PaletteResponse create(Jwt jwt, CreatePaletteRequest request) {
        AppUser user = currentUserService.resolve(jwt);
        Palette palette = new Palette(
                user,
                request.name().trim(),
                parseSource(request.source()),
                request.favorite());
        palette.replaceColors(normalizeColors(request.colors()));
        if (request.designSystem() != null) {
            palette.setDesignSystem(toDesignSystem(request.designSystem()));
        }
        return paletteMapper.toResponse(paletteRepository.save(palette));
    }

    @Transactional
    public PaletteResponse update(Jwt jwt, UUID paletteId, UpdatePaletteRequest request) {
        Palette palette = findOwned(jwt, paletteId);
        palette.updateDetails(request.name().trim(), request.favorite());
        List<String> colors = normalizeColors(request.colors());
        if (palette.prepareColorsForReplacement(colors.size())) {
            paletteRepository.flush();
        }
        palette.replaceColors(colors);
        return paletteMapper.toResponse(palette);
    }

    @Transactional
    public PaletteResponse updateDesignSystem(Jwt jwt, UUID paletteId, DesignSystemRequest request) {
        Palette palette = findOwned(jwt, paletteId);
        PaletteDesignSystem designSystem = palette.getDesignSystem();
        if (designSystem == null) {
            palette.setDesignSystem(toDesignSystem(request));
        } else {
            designSystem.updateColors(
                    normalizeHex(request.background()),
                    normalizeHex(request.surface()),
                    normalizeHex(request.text()),
                    normalizeHex(request.primary()),
                    normalizeHex(request.accent()));
        }
        return paletteMapper.toResponse(palette);
    }

    @Transactional
    public void delete(Jwt jwt, UUID paletteId) {
        paletteRepository.delete(findOwned(jwt, paletteId));
    }

    private Palette findOwned(Jwt jwt, UUID paletteId) {
        AppUser user = currentUserService.resolve(jwt);
        return paletteRepository.findByIdAndUserId(paletteId, user.getId())
                .orElseThrow(PaletteNotFoundException::new);
    }

    private PaletteDesignSystem toDesignSystem(DesignSystemRequest request) {
        return new PaletteDesignSystem(
                normalizeHex(request.background()),
                normalizeHex(request.surface()),
                normalizeHex(request.text()),
                normalizeHex(request.primary()),
                normalizeHex(request.accent()));
    }

    private List<String> normalizeColors(List<String> colors) {
        return colors.stream().map(this::normalizeHex).toList();
    }

    private String normalizeHex(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private PaletteSource parseSource(String source) {
        return PaletteSource.valueOf(source.trim().toUpperCase(Locale.ROOT));
    }
}
