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

Authenticated palette endpoints are available under `/api/palettes`:
`GET`, `POST`, `GET /{paletteId}`, `PUT /{paletteId}`,
`PUT /{paletteId}/design-system`, and `DELETE /{paletteId}`. Palette ownership
is always derived from the authenticated JWT; clients never send a `userId`.

The backend validates JWTs using the issuer
`http://localhost:8180/realms/palettematch` by default. Override it with
`KEYCLOAK_ISSUER_URI`; `KEYCLOAK_JWK_SET_URI` can separately override the JWK
endpoint for containerized development.

## Authentication modes

`APP_AUTH_MODE` selects backend authentication and defaults to `keycloak`, so
the local Docker Compose and Keycloak setup needs no additional variables.
In this mode, the backend continues validating Keycloak-issued JWTs.

Set `APP_AUTH_MODE=demo` only in the deployed backend to enable the
`POST /api/auth/demo/login` endpoint. It accepts a JSON `password` and returns
a 15-minute RSA-signed access token. The API remains protected; demo tokens
must have the configured issuer and audience and a valid signature and expiry.
Each successful login creates a distinct demo identity. Its `demo_expires_at`
is 30 days after sign-in. Requests made with an expired or deleted demo identity
are rejected. The backend deletes expired demo identities at startup and every
six hours while it is running. Deletion is transactional and relies on the
existing database foreign-key cascades to remove palettes, colors, and design
systems; Keycloak users are excluded by provider.

The demo login allows five attempts per client address per minute and returns
HTTP 429 with a `Retry-After` header when the limit is reached. The limiter is
in-memory and local to one backend process. It keys on the first
`X-Forwarded-For` address when present, so deployment must ensure the trusted
Render ingress overwrites or sanitizes that header; otherwise callers could
spoof addresses to evade per-client limits. It is reset by process restarts and
does not coordinate multiple instances. It accepts up to 10,000 active address
windows and temporarily rejects new addresses rather than evicting existing
limits if that capacity is reached. The Render free instance may sleep, so
scheduled cleanup cannot run while it is asleep; expired demo identities remain
inaccessible and are purged on startup or when the running instance next reaches
a cleanup interval. For guaranteed cleanup timing or distributed rate limiting,
use an external scheduled worker and shared rate-limit storage before scaling
or relying on a strict deletion deadline.

Demo mode requires these backend-only settings:

- `DEMO_PASSWORD_BCRYPT`: BCrypt hash of the demo password (cost 10–16).
- `DEMO_JWT_PRIVATE_KEY_BASE64`: Base64 PKCS#8 DER RSA private key, at least
  2048 bits.
- `DEMO_JWT_PUBLIC_KEY_BASE64`: Base64 X.509 DER RSA public key matching the
  private key.
- `DEMO_JWT_ISSUER`: absolute HTTPS token issuer (defaults to
  `https://palettematch-demo`).
- `DEMO_JWT_AUDIENCE`: token audience (defaults to `palettematch-api`).

Generate a dedicated key pair for the deployed demo; do not reuse the
Keycloak keys. Store the password hash and keys as backend service secrets,
never in frontend build variables or source control. The frontend mode is
configured separately; the frontend demo login is not part of this backend
change.

The default database and CORS settings can be overridden with `DB_URL`,
`DB_USERNAME`, `DB_PASSWORD`, `SERVER_PORT`, and
`APP_CORS_ALLOWED_ORIGINS`.

## Persistence model

The persistence model contains users, palettes, ordered palette colors, and
optional palette design systems. Flyway V2 renames `keycloak_subject` to
`auth_subject` without changing existing subjects or user IDs, tags existing
rows as `KEYCLOAK`, and adds the provider/subject uniqueness and demo-expiry
fields. The existing foreign-key cascade from users to palettes and palette
details is retained. Hibernate is configured only to validate the schema.
