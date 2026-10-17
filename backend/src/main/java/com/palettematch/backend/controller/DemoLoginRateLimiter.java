package com.palettematch.backend.controller;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Optional;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.auth", name = "mode", havingValue = "demo")
public class DemoLoginRateLimiter {

    static final int MAX_ATTEMPTS = 5;
    static final Duration WINDOW = Duration.ofMinutes(1);
    static final int MAX_CLIENTS = 10_000;

    private final Clock clock;
    private final LinkedHashMap<String, AttemptWindow> attempts = new LinkedHashMap<>(16, 0.75f, true);

    public DemoLoginRateLimiter() {
        this(Clock.systemUTC());
    }

    DemoLoginRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public synchronized Optional<Duration> tryAcquire(String clientAddress) {
        Instant now = clock.instant();
        removeExpiredWindows(now);

        AttemptWindow window = attempts.get(clientAddress);
        if (window == null) {
            if (attempts.size() >= MAX_CLIENTS) {
                return Optional.of(WINDOW);
            }
            window = new AttemptWindow(now.plus(WINDOW));
            attempts.put(clientAddress, window);
        } else if (!window.expiresAt().isAfter(now)) {
            window = new AttemptWindow(now.plus(WINDOW));
            attempts.put(clientAddress, window);
        }

        if (window.count() >= MAX_ATTEMPTS) {
            return Optional.of(Duration.between(now, window.expiresAt()));
        }

        window.increment();
        return Optional.empty();
    }

    private void removeExpiredWindows(Instant now) {
        attempts.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
    }

    private static final class AttemptWindow {
        private final Instant expiresAt;
        private int count;

        private AttemptWindow(Instant expiresAt) {
            this.expiresAt = expiresAt;
        }

        private Instant expiresAt() {
            return expiresAt;
        }

        private int count() {
            return count;
        }

        private void increment() {
            count++;
        }
    }
}
