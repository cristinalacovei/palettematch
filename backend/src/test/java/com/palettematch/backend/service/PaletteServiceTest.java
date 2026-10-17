package com.palettematch.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.palettematch.backend.dto.palette.CreatePaletteRequest;
import com.palettematch.backend.dto.palette.DesignSystemRequest;
import com.palettematch.backend.dto.palette.PaletteResponse;
import com.palettematch.backend.dto.palette.UpdatePaletteRequest;
import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.entity.Palette;
import com.palettematch.backend.entity.PaletteSource;
import com.palettematch.backend.exception.PaletteNotFoundException;
import com.palettematch.backend.mapper.PaletteMapper;
import com.palettematch.backend.repository.PaletteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

@ExtendWith(MockitoExtension.class)
class PaletteServiceTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID PALETTE_ID = UUID.randomUUID();

    @Mock
    private PaletteRepository paletteRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private Jwt jwt;

    private PaletteService paletteService;
    private AppUser user;

    @BeforeEach
    void setUp() {
        paletteService = new PaletteService(paletteRepository, currentUserService, new PaletteMapper());
        user = new AppUser("subject", "cristina", "cristina@example.com");
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", USER_ID);
        when(currentUserService.resolve(jwt)).thenReturn(user);
    }

    @Test
    void listUsesOnlyCurrentUserOwnershipQuery() {
        Palette palette = new Palette(user, "Ocean", PaletteSource.GENERATOR, false);
        when(paletteRepository.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(palette));

        List<PaletteResponse> result = paletteService.list(jwt);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().source()).isEqualTo("generator");
        verify(paletteRepository).findByUserIdOrderByCreatedAtDesc(USER_ID);
    }

    @Test
    void createAssignsCurrentUserAndPreservesColorOrder() {
        CreatePaletteRequest request = new CreatePaletteRequest(
                " Ocean ",
                List.of("#aa44ff", "#112233"),
                "generator",
                false,
                null);
        when(paletteRepository.save(any(Palette.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaletteResponse response = paletteService.create(jwt, request);

        assertThat(response.name()).isEqualTo("Ocean");
        assertThat(response.colors()).containsExactly("#AA44FF", "#112233");
        verify(paletteRepository).save(any(Palette.class));
    }

    @Test
    void updateRejectsPaletteNotOwnedByCurrentUser() {
        when(paletteRepository.findByIdAndUserId(PALETTE_ID, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paletteService.update(
                jwt,
                PALETTE_ID,
                new UpdatePaletteRequest("Ocean", List.of("#112233"), false)))
                .isInstanceOf(PaletteNotFoundException.class);
        verify(paletteRepository, never()).save(any());
    }

    @Test
    void updatePreservesUnchangedColorsForRenameAndFavoriteChanges() {
        Palette palette = new Palette(user, "Ocean", PaletteSource.GENERATOR, false);
        palette.replaceColors(List.of("#112233", "#445566"));
        var originalColors = List.copyOf(palette.getColors());
        when(paletteRepository.findByIdAndUserId(PALETTE_ID, USER_ID)).thenReturn(Optional.of(palette));

        PaletteResponse renamed = paletteService.update(
                jwt,
                PALETTE_ID,
                new UpdatePaletteRequest("Midnight", List.of("#112233", "#445566"), false));
        PaletteResponse favorited = paletteService.update(
                jwt,
                PALETTE_ID,
                new UpdatePaletteRequest("Midnight", List.of("#112233", "#445566"), true));

        assertThat(renamed.name()).isEqualTo("Midnight");
        assertThat(favorited.favorite()).isTrue();
        assertThat(palette.getColors()).containsExactlyElementsOf(originalColors);
        assertThat(palette.getColors().get(0)).isSameAs(originalColors.get(0));
        assertThat(palette.getColors().get(1)).isSameAs(originalColors.get(1));
    }

    @Test
    void updateChangesColorValuesWithoutReplacingUnchangedPositions() {
        Palette palette = new Palette(user, "Ocean", PaletteSource.GENERATOR, false);
        palette.replaceColors(List.of("#112233", "#445566"));
        var firstColor = palette.getColors().getFirst();
        when(paletteRepository.findByIdAndUserId(PALETTE_ID, USER_ID)).thenReturn(Optional.of(palette));

        PaletteResponse response = paletteService.update(
                jwt,
                PALETTE_ID,
                new UpdatePaletteRequest("Ocean", List.of("#AA0000", "#445566", "#778899"), false));

        assertThat(response.colors()).containsExactly("#AA0000", "#445566", "#778899");
        assertThat(palette.getColors().getFirst()).isSameAs(firstColor);
        assertThat(palette.getColors().getFirst().getHexValue()).isEqualTo("#AA0000");
    }

    @Test
    void deleteUsesOwnershipAwareLookup() {
        Palette palette = new Palette(user, "Ocean", PaletteSource.GENERATOR, false);
        when(paletteRepository.findByIdAndUserId(PALETTE_ID, USER_ID)).thenReturn(Optional.of(palette));

        paletteService.delete(jwt, PALETTE_ID);

        verify(paletteRepository).findByIdAndUserId(PALETTE_ID, USER_ID);
        verify(paletteRepository).delete(palette);
    }

    @Test
    void designSystemUpdateCreatesAndNormalizesDesignSystem() {
        Palette palette = new Palette(user, "Ocean", PaletteSource.GENERATOR, false);
        when(paletteRepository.findByIdAndUserId(PALETTE_ID, USER_ID)).thenReturn(Optional.of(palette));

        PaletteResponse response = paletteService.updateDesignSystem(
                jwt,
                PALETTE_ID,
                new DesignSystemRequest("#aa44ff", "#112233", "#ffffff", "#445566", "#778899"));

        assertThat(response.designSystem().background()).isEqualTo("#AA44FF");
        assertThat(response.designSystem().text()).isEqualTo("#FFFFFF");
    }
}
