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

The default database and CORS settings can be overridden with `DB_URL`,
`DB_USERNAME`, `DB_PASSWORD`, `SERVER_PORT`, and
`APP_CORS_ALLOWED_ORIGINS`.

## Persistence model

The initial persistence model contains users, palettes, ordered palette colors,
and optional palette design systems. Schema changes are managed by Flyway;
Hibernate is configured only to validate the schema.
