package com.palettematch.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;
import java.time.Instant;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

import com.palettematch.backend.config.AuthMode;
import com.palettematch.backend.dto.palette.DesignSystemRequest;
import com.palettematch.backend.dto.palette.PaletteResponse;
import com.palettematch.backend.dto.palette.UpdatePaletteRequest;
import com.palettematch.backend.entity.AppUser;
import com.palettematch.backend.entity.AuthProvider;
import com.palettematch.backend.entity.Palette;
import com.palettematch.backend.entity.PaletteColor;
import com.palettematch.backend.entity.PaletteDesignSystem;
import com.palettematch.backend.entity.PaletteSource;
import com.palettematch.backend.repository.AppUserRepository;
import com.palettematch.backend.repository.PaletteRepository;
import com.palettematch.backend.mapper.PaletteMapper;
import com.palettematch.backend.service.CurrentUserService;
import com.palettematch.backend.exception.PaletteNotFoundException;
import com.palettematch.backend.service.PaletteService;
import org.junit.jupiter.api.Test;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
@Transactional
class PersistenceIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private PaletteRepository paletteRepository;

    @Autowired
    private PaletteService paletteService;

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
        assertThat(user.getAuthProvider()).isEqualTo(AuthProvider.KEYCLOAK);
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

    @Test
    void updateWithSameNumberOfColorsPersistsValuesAndPositions() {
        TestIdentity identity = createIdentity();
        Palette palette = savePalette(identity.user(), List.of("#112233", "#445566", "#778899"));

        PaletteResponse response = updatePalette(
                identity.jwt(),
                palette.getId(),
                new UpdatePaletteRequest("Ocean", List.of("#AA0000", "#BB0000", "#CC0000"), false));

        assertThat(response.colors()).containsExactly("#AA0000", "#BB0000", "#CC0000");
        assertReloadedPalette(palette.getId(), "Ocean", false,
                List.of("#AA0000", "#BB0000", "#CC0000"));
    }

    @Test
    void updateWithFewerColorsRemovesOrphansAndPersistsRemainingPositions() {
        TestIdentity identity = createIdentity();
        Palette palette = savePalette(identity.user(), List.of("#112233", "#445566", "#778899"));

        PaletteResponse response = updatePalette(
                identity.jwt(),
                palette.getId(),
                new UpdatePaletteRequest("Ocean", List.of("#AA0000", "#BB0000"), false));

        assertThat(response.colors()).containsExactly("#AA0000", "#BB0000");
        assertReloadedPalette(palette.getId(), "Ocean", false, List.of("#AA0000", "#BB0000"));
    }

    @Test
    void updateWithMoreColorsPersistsNewColorsAndPositions() {
        TestIdentity identity = createIdentity();
        Palette palette = savePalette(identity.user(), List.of("#112233", "#445566"));

        PaletteResponse response = updatePalette(
                identity.jwt(),
                palette.getId(),
                new UpdatePaletteRequest(
                        "Ocean",
                        List.of("#AA0000", "#BB0000", "#CC0000", "#DD0000"),
                        false));

        assertThat(response.colors()).containsExactly("#AA0000", "#BB0000", "#CC0000", "#DD0000");
        assertReloadedPalette(
                palette.getId(),
                "Ocean",
                false,
                List.of("#AA0000", "#BB0000", "#CC0000", "#DD0000"));
    }

    @Test
    void renameAndFavoriteUpdatesPreservePersistedColorEntities() {
        TestIdentity identity = createIdentity();
        Palette palette = savePalette(identity.user(), List.of("#112233", "#445566"));
        List<UUID> originalColorIds = palette.getColors().stream().map(PaletteColor::getId).toList();

        PaletteResponse renamed = updatePalette(
                identity.jwt(),
                palette.getId(),
                new UpdatePaletteRequest("Midnight", List.of("#112233", "#445566"), false));

        assertThat(renamed.name()).isEqualTo("Midnight");
        assertReloadedPalette(palette.getId(), "Midnight", false, List.of("#112233", "#445566"));
        assertThat(reloadPalette(palette.getId()).getColors())
                .extracting(PaletteColor::getId)
                .containsExactlyElementsOf(originalColorIds);

        PaletteResponse favorited = updatePalette(
                identity.jwt(),
                palette.getId(),
                new UpdatePaletteRequest("Midnight", List.of("#112233", "#445566"), true));

        assertThat(favorited.favorite()).isTrue();
        assertReloadedPalette(palette.getId(), "Midnight", true, List.of("#112233", "#445566"));
        assertThat(reloadPalette(palette.getId()).getColors())
                .extracting(PaletteColor::getId)
                .containsExactlyElementsOf(originalColorIds);
    }

    @Test
    void expandingPaletteWithNoncontiguousPositionsPersistsContiguousColors() {
        TestIdentity identity = createIdentity();
        Palette palette = new Palette(identity.user(), "Gapped", PaletteSource.GENERATOR, false);
        palette.addColor("#112233", 0);
        palette.addColor("#445566", 2);
        Palette savedPalette = paletteRepository.saveAndFlush(palette);
        UUID paletteId = savedPalette.getId();
        entityManager.clear();

        assertThat(reloadPalette(paletteId).getColors())
                .extracting(PaletteColor::getPosition)
                .containsExactly(0, 2);

        PaletteResponse response = updatePalette(
                identity.jwt(),
                paletteId,
                new UpdatePaletteRequest(
                        "Gapped",
                        List.of("#AA0000", "#BB0000", "#CC0000"),
                        false));
        entityManager.flush();
        entityManager.clear();

        Palette reloadedPalette = paletteRepository.findById(paletteId).orElseThrow();
        assertThat(response.colors()).containsExactly("#AA0000", "#BB0000", "#CC0000");
        assertThat(reloadedPalette.getName()).isEqualTo("Gapped");
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getHexValue)
                .containsExactly("#AA0000", "#BB0000", "#CC0000");
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getPosition)
                .containsExactly(0, 1, 2);
    }

    @Test
    void updateWithSameNumberOfColorsFromNoncontiguousPositionsPersistsColorsAndIds() {
        TestIdentity identity = createIdentity();
        Palette palette = new Palette(identity.user(), "Gapped", PaletteSource.GENERATOR, false);
        palette.addColor("#112233", 0);
        palette.addColor("#445566", 2);
        palette.addColor("#778899", 5);
        Palette savedPalette = paletteRepository.saveAndFlush(palette);
        UUID paletteId = savedPalette.getId();
        List<UUID> originalColorIds =
                savedPalette.getColors().stream().map(PaletteColor::getId).toList();
        entityManager.clear();

        assertThat(reloadPalette(paletteId).getColors())
                .extracting(PaletteColor::getPosition)
                .containsExactly(0, 2, 5);

        PaletteResponse response = updatePalette(
                identity.jwt(),
                paletteId,
                new UpdatePaletteRequest(
                        "Gapped",
                        List.of("#AA0000", "#BB0000", "#CC0000"),
                        false));
        entityManager.flush();
        entityManager.clear();

        Palette reloadedPalette = paletteRepository.findById(paletteId).orElseThrow();
        assertThat(response.colors()).containsExactly("#AA0000", "#BB0000", "#CC0000");
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getHexValue)
                .containsExactly("#AA0000", "#BB0000", "#CC0000");
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getPosition)
                .containsExactly(0, 1, 2);
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getId)
                .containsExactlyElementsOf(originalColorIds);
    }

    @Test
    void reducingColorsFromNoncontiguousPositionsRemovesOrphansAndPreservesIds() {
        TestIdentity identity = createIdentity();
        Palette palette = new Palette(identity.user(), "Gapped", PaletteSource.GENERATOR, false);
        palette.addColor("#112233", 0);
        palette.addColor("#445566", 2);
        palette.addColor("#778899", 5);
        Palette savedPalette = paletteRepository.saveAndFlush(palette);
        UUID paletteId = savedPalette.getId();
        List<UUID> originalColorIds =
                savedPalette.getColors().stream().map(PaletteColor::getId).toList();
        UUID removedColorId = originalColorIds.get(2);
        entityManager.clear();

        assertThat(reloadPalette(paletteId).getColors())
                .extracting(PaletteColor::getPosition)
                .containsExactly(0, 2, 5);

        PaletteResponse response = updatePalette(
                identity.jwt(),
                paletteId,
                new UpdatePaletteRequest(
                        "Gapped",
                        List.of("#AA0000", "#BB0000"),
                        false));
        entityManager.flush();
        entityManager.clear();

        Palette reloadedPalette = paletteRepository.findById(paletteId).orElseThrow();
        assertThat(response.colors()).containsExactly("#AA0000", "#BB0000");
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getHexValue)
                .containsExactly("#AA0000", "#BB0000");
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getPosition)
                .containsExactly(0, 1);
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getId)
                .containsExactly(originalColorIds.get(0), originalColorIds.get(1));
        assertThat(entityManager.find(PaletteColor.class, removedColorId)).isNull();
    }

    @Test
    void updateDesignSystemReturnsAndPersistsRequestedValues() {
        TestIdentity identity = createIdentity();
        Palette palette = new Palette(identity.user(), "Ocean", PaletteSource.GENERATOR, false);
        palette.addColor("#112233", 0);
        palette.addColor("#445566", 1);
        palette.setDesignSystem(new PaletteDesignSystem(
                "#001122",
                "#223344",
                "#FFFFFF",
                "#336699",
                "#CC8844"));
        Palette savedPalette = paletteRepository.saveAndFlush(palette);
        UUID paletteId = savedPalette.getId();
        entityManager.clear();

        PaletteResponse response = updateDesignSystem(
                identity.jwt(),
                paletteId,
                new DesignSystemRequest("#AABBCC", "#DDEEFF", "#102030", "#405060", "#708090"));

        assertThat(response.designSystem().background()).isEqualTo("#AABBCC");
        assertThat(response.designSystem().surface()).isEqualTo("#DDEEFF");
        assertThat(response.designSystem().text()).isEqualTo("#102030");
        assertThat(response.designSystem().primary()).isEqualTo("#405060");
        assertThat(response.designSystem().accent()).isEqualTo("#708090");

        Palette reloadedPalette = reloadPalette(paletteId);
        assertThat(reloadedPalette.getDesignSystem().getBackground()).isEqualTo("#AABBCC");
        assertThat(reloadedPalette.getDesignSystem().getSurface()).isEqualTo("#DDEEFF");
        assertThat(reloadedPalette.getDesignSystem().getTextColor()).isEqualTo("#102030");
        assertThat(reloadedPalette.getDesignSystem().getPrimaryColor()).isEqualTo("#405060");
        assertThat(reloadedPalette.getDesignSystem().getAccentColor()).isEqualTo("#708090");
    }

    @Test
    void demoIdentitiesAreIsolatedAndDeletingOneCascadesOnlyItsPaletteData() {
        Instant now = Instant.now();
        AppUser firstUser = appUserRepository.saveAndFlush(demoUser("demo-subject-first", now));
        AppUser secondUser = appUserRepository.saveAndFlush(demoUser("demo-subject-second", now));
        AppUser keycloakUserWithSameSubject = appUserRepository.saveAndFlush(
                new AppUser("demo-subject-first", "keycloak-user", "keycloak@example.com"));

        Palette firstPalette = saveDemoPalette(firstUser, "First palette");
        Palette secondPalette = saveDemoPalette(secondUser, "Second palette");
        Palette keycloakPalette = saveDemoPalette(keycloakUserWithSameSubject, "Keycloak palette");
        UUID firstPaletteId = firstPalette.getId();
        UUID secondPaletteId = secondPalette.getId();
        UUID keycloakPaletteId = keycloakPalette.getId();
        PaletteService demoPaletteService = new PaletteService(
                paletteRepository,
                new CurrentUserService(appUserRepository, AuthMode.DEMO),
                new PaletteMapper());

        assertThat(demoPaletteService.list(demoJwt(firstUser.getAuthSubject(), firstUser)))
                .extracting(PaletteResponse::name)
                .containsExactly("First palette");
        assertThat(demoPaletteService.list(demoJwt(secondUser.getAuthSubject(), secondUser)))
                .extracting(PaletteResponse::name)
                .containsExactly("Second palette");
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> demoPaletteService.get(
                        demoJwt(firstUser.getAuthSubject(), firstUser),
                        secondPaletteId))
                .isInstanceOf(PaletteNotFoundException.class);

        Instant expiredBefore = now.plusSeconds(1);
        AppUser expiredDemo = appUserRepository.saveAndFlush(
                demoUser("expired-demo-subject", now.minusSeconds(31L * 24 * 60 * 60)));
        assertThat(appUserRepository.findByAuthProviderAndDemoExpiresAtBefore(
                        AuthProvider.DEMO,
                        expiredBefore))
                .extracting(AppUser::getId)
                .containsExactly(expiredDemo.getId());

        entityManager.flush();
        entityManager.clear();
        appUserRepository.deleteById(firstUser.getId());
        appUserRepository.flush();
        entityManager.clear();

        assertThat(appUserRepository.findById(firstUser.getId())).isEmpty();
        assertThat(appUserRepository.findById(secondUser.getId())).isPresent();
        assertThat(appUserRepository.findById(keycloakUserWithSameSubject.getId())).isPresent();
        assertThat(paletteRepository.findById(firstPaletteId)).isEmpty();
        assertThat(paletteRepository.findById(secondPaletteId)).isPresent();
        assertThat(paletteRepository.findById(keycloakPaletteId)).isPresent();
        assertThat(entityManager.createQuery(
                        "select count(color) from PaletteColor color where color.palette.id = :paletteId",
                        Long.class)
                .setParameter("paletteId", firstPaletteId)
                .getSingleResult()).isZero();
        assertThat(entityManager.createQuery(
                        "select count(designSystem) from PaletteDesignSystem designSystem "
                                + "where designSystem.palette.id = :paletteId",
                        Long.class)
                .setParameter("paletteId", firstPaletteId)
                .getSingleResult()).isZero();
    }

    @Test
    void providerMigrationPreservesExistingKeycloakUsersAndPaletteLinks() throws Exception {
        String schema = "auth_subject_migration_" + UUID.randomUUID().toString().replace("-", "");
        UUID userId = UUID.randomUUID();
        UUID paletteId = UUID.randomUUID();

        try (Connection connection = DriverManager.getConnection(
                        postgres.getJdbcUrl(),
                        postgres.getUsername(),
                        postgres.getPassword());
                Statement statement = connection.createStatement()) {
            statement.execute("CREATE SCHEMA " + schema);
            try {
                Flyway.configure()
                        .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                        .schemas(schema)
                        .defaultSchema(schema)
                        .target(MigrationVersion.fromVersion("1"))
                        .locations("classpath:db/migration")
                        .load()
                        .migrate();
                connection.setSchema(schema);

                try (PreparedStatement insertUser = connection.prepareStatement(
                        "INSERT INTO app_users "
                                + "(id, keycloak_subject, username, email, created_at, updated_at) "
                                + "VALUES (?, ?, ?, ?, now(), now())")) {
                    insertUser.setObject(1, userId);
                    insertUser.setString(2, "legacy-keycloak-subject");
                    insertUser.setString(3, "legacy-user");
                    insertUser.setString(4, "legacy@example.com");
                    insertUser.executeUpdate();
                }
                try (PreparedStatement insertPalette = connection.prepareStatement(
                        "INSERT INTO palettes "
                                + "(id, user_id, name, source, favorite, created_at, updated_at) "
                                + "VALUES (?, ?, 'Legacy palette', 'GENERATOR', false, now(), now())")) {
                    insertPalette.setObject(1, paletteId);
                    insertPalette.setObject(2, userId);
                    insertPalette.executeUpdate();
                }

                Flyway.configure()
                        .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                        .schemas(schema)
                        .defaultSchema(schema)
                        .locations("classpath:db/migration")
                        .load()
                        .migrate();

                try (PreparedStatement findUser = connection.prepareStatement(
                        "SELECT auth_subject, auth_provider FROM app_users WHERE id = ?")) {
                    findUser.setObject(1, userId);
                    try (ResultSet result = findUser.executeQuery()) {
                        assertThat(result.next()).isTrue();
                        assertThat(result.getString("auth_subject")).isEqualTo("legacy-keycloak-subject");
                        assertThat(result.getString("auth_provider")).isEqualTo("KEYCLOAK");
                        assertThat(result.next()).isFalse();
                    }
                }
                try (PreparedStatement findPalette = connection.prepareStatement(
                        "SELECT user_id FROM palettes WHERE id = ?")) {
                    findPalette.setObject(1, paletteId);
                    try (ResultSet result = findPalette.executeQuery()) {
                        assertThat(result.next()).isTrue();
                        assertThat(result.getObject("user_id", UUID.class)).isEqualTo(userId);
                        assertThat(result.next()).isFalse();
                    }
                }
            } finally {
                statement.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
            }
        }
    }

    private AppUser demoUser(String subject, Instant createdAt) {
        return new AppUser(
                subject,
                "Demo visitor",
                subject + "@demo.invalid",
                AuthProvider.DEMO,
                createdAt.plusSeconds(30L * 24 * 60 * 60));
    }

    private Palette saveDemoPalette(AppUser user, String name) {
        Palette palette = new Palette(user, name, PaletteSource.GENERATOR, false);
        palette.addColor("#112233", 0);
        palette.setDesignSystem(new PaletteDesignSystem(
                "#001122",
                "#223344",
                "#FFFFFF",
                "#336699",
                "#CC8844"));
        return paletteRepository.saveAndFlush(palette);
    }

    private Jwt demoJwt(String subject, AppUser user) {
        return Jwt.withTokenValue(subject)
                .header("alg", "RS256")
                .subject(subject)
                .claim("preferred_username", user.getUsername())
                .claim("email", user.getEmail())
                .claim("auth_provider", AuthProvider.DEMO.name())
                .build();
    }

    private TestIdentity createIdentity() {
        String subject = UUID.randomUUID().toString();
        String username = "user-" + subject.substring(0, 8);
        String email = subject + "@example.com";
        AppUser user = appUserRepository.saveAndFlush(new AppUser(subject, username, email));
        Jwt jwt = Jwt.withTokenValue(subject)
                .header("alg", "none")
                .subject(subject)
                .claim("preferred_username", username)
                .claim("email", email)
                .build();
        return new TestIdentity(user, jwt);
    }

    private Palette savePalette(AppUser user, List<String> colors) {
        Palette palette = new Palette(user, "Ocean", PaletteSource.GENERATOR, false);
        for (int position = 0; position < colors.size(); position++) {
            palette.addColor(colors.get(position), position);
        }
        Palette savedPalette = paletteRepository.saveAndFlush(palette);
        entityManager.clear();
        return savedPalette;
    }

    private Palette reloadPalette(UUID paletteId) {
        entityManager.clear();
        return paletteRepository.findById(paletteId).orElseThrow();
    }

    private PaletteResponse updatePalette(Jwt jwt, UUID paletteId, UpdatePaletteRequest request) {
        PaletteResponse response = paletteService.update(jwt, paletteId, request);
        entityManager.flush();
        return response;
    }

    private PaletteResponse updateDesignSystem(
            Jwt jwt,
            UUID paletteId,
            DesignSystemRequest request) {
        PaletteResponse response = paletteService.updateDesignSystem(jwt, paletteId, request);
        entityManager.flush();
        return response;
    }

    private void assertReloadedPalette(
            UUID paletteId,
            String expectedName,
            boolean expectedFavorite,
            List<String> expectedColors) {
        Palette reloadedPalette = reloadPalette(paletteId);
        assertThat(reloadedPalette.getName()).isEqualTo(expectedName);
        assertThat(reloadedPalette.isFavorite()).isEqualTo(expectedFavorite);
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getHexValue)
                .containsExactlyElementsOf(expectedColors);
        assertThat(reloadedPalette.getColors())
                .extracting(PaletteColor::getPosition)
                .containsExactlyElementsOf(
                        java.util.stream.IntStream.range(0, expectedColors.size()).boxed().toList());
    }

    private record TestIdentity(AppUser user, Jwt jwt) {
    }
}
