package com.palettematch.backend;

import static org.assertj.core.api.Assertions.assertThat;

import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.entity.Palette;
import com.palettematch.backend.entity.PaletteColor;
import com.palettematch.backend.entity.PaletteDesignSystem;
import com.palettematch.backend.entity.PaletteSource;
import com.palettematch.backend.repository.AppUserRepository;
import com.palettematch.backend.repository.PaletteRepository;
import org.junit.jupiter.api.Test;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class PersistenceIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private PaletteRepository paletteRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void persistsAndReloadsPaletteAggregate() {
        AppUser user = appUserRepository.saveAndFlush(
                new AppUser("keycloak-subject-1", "cristina", "cristina@example.com"));

        Palette palette = new Palette(user, "Ocean", PaletteSource.GENERATOR, false);
        palette.addColor("#112233", 1);
        palette.addColor("#001122", 0);
        palette.setDesignSystem(new PaletteDesignSystem(
                "#001122",
                "#112233",
                "#FFFFFF",
                "#336699",
                "#CC8844"));

        Palette savedPalette = paletteRepository.saveAndFlush(palette);
        entityManager.clear();
        Palette reloadedPalette = paletteRepository.findById(savedPalette.getId()).orElseThrow();

        assertThat(reloadedPalette.getUser().getId()).isEqualTo(user.getId());
        assertThat(reloadedPalette.getSource()).isEqualTo(PaletteSource.GENERATOR);
        assertThat(reloadedPalette.isFavorite()).isFalse();
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getHexValue)
                .containsExactly("#001122", "#112233");
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getPosition)
                .containsExactly(0, 1);
        assertThat(reloadedPalette.getDesignSystem().getBackground()).isEqualTo("#001122");
        assertThat(reloadedPalette.getDesignSystem().getSurface()).isEqualTo("#112233");
        assertThat(reloadedPalette.getDesignSystem().getTextColor()).isEqualTo("#FFFFFF");
        assertThat(reloadedPalette.getDesignSystem().getPrimaryColor()).isEqualTo("#336699");
        assertThat(reloadedPalette.getDesignSystem().getAccentColor()).isEqualTo("#CC8844");
        assertThat(reloadedPalette.getDesignSystem().getUpdatedAt()).isNotNull();
    }
}
