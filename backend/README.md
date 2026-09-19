# PaletteMatch Backend

Initial Spring Boot backend foundation for PaletteMatch.

## Requirements

- Java 21
- Docker Desktop
- Maven Wrapper (included)

## Start PostgreSQL

From the `backend` directory:

```powershell
docker compose up -d
```

PostgreSQL is available on `localhost:5434` with database, username, and password
set to `palettematch`.

Keycloak is available at `http://localhost:8180`. The development admin console
is at `http://localhost:8180/admin/`; default local credentials are supplied by
`KEYCLOAK_ADMIN_USERNAME` and `KEYCLOAK_ADMIN_PASSWORD` (fallback: `admin` /
`admin`). Do not use these fallback credentials outside local development.

The imported realm is `palettematch`, with the public SPA client
`palettematch-frontend`. Create a local user in the Keycloak admin console under
the `palettematch` realm, set a password, and assign the `USER` realm role.

## Run the backend on Windows

From the `backend` directory:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend runs at `http://localhost:8080`.

Health endpoint:

```text
http://localhost:8080/api/health
```

The protected current-user endpoint is:

```text
http://localhost:8080/api/users/me
```

The backend validates JWTs using the issuer
`http://localhost:8180/realms/palettematch` by default. Override it with
`KEYCLOAK_ISSUER_URI`; `KEYCLOAK_JWK_SET_URI` can separately override the JWK
endpoint for containerized development.

The default database and CORS settings can be overridden with `DB_URL`,
`DB_USERNAME`, `DB_PASSWORD`, `SERVER_PORT`, and
`APP_CORS_ALLOWED_ORIGINS`.

## Persistence model

The initial persistence model contains users, palettes, ordered palette colors,
and optional palette design systems. Schema changes are managed by Flyway;
Hibernate is configured only to validate the schema.
