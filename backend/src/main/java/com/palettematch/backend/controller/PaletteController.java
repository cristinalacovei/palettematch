package com.palettematch.backend.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import com.palettematch.backend.dto.palette.CreatePaletteRequest;
import com.palettematch.backend.dto.palette.DesignSystemRequest;
import com.palettematch.backend.dto.palette.PaletteResponse;
import com.palettematch.backend.dto.palette.UpdatePaletteRequest;
import com.palettematch.backend.service.PaletteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/palettes")
public class PaletteController {

    private final PaletteService paletteService;

    public PaletteController(PaletteService paletteService) {
        this.paletteService = paletteService;
    }

    @GetMapping
    public List<PaletteResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return paletteService.list(jwt);
    }

    @GetMapping("/{paletteId}")
    public PaletteResponse get(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID paletteId) {
        return paletteService.get(jwt, paletteId);
    }

    @PostMapping
    public ResponseEntity<PaletteResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreatePaletteRequest request) {
        PaletteResponse response = paletteService.create(jwt, request);
        return ResponseEntity.created(URI.create("/api/palettes/" + response.id())).body(response);
    }

    @PutMapping("/{paletteId}")
    public PaletteResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID paletteId,
            @Valid @RequestBody UpdatePaletteRequest request) {
        return paletteService.update(jwt, paletteId, request);
    }

    @PutMapping("/{paletteId}/design-system")
    public PaletteResponse updateDesignSystem(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID paletteId,
            @Valid @RequestBody DesignSystemRequest request) {
        return paletteService.updateDesignSystem(jwt, paletteId, request);
    }

    @DeleteMapping("/{paletteId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID paletteId) {
        paletteService.delete(jwt, paletteId);
        return ResponseEntity.noContent().build();
    }
}
