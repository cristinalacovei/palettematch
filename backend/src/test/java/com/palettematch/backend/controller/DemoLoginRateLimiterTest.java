package com.palettematch.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import org.junit.jupiter.api.Test;

class DemoLoginRateLimiterTest {

    @Test
    void limitsEachClientToFiveAttemptsPerMinuteAndAllowsAgainAfterWindow() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        DemoLoginRateLimiter limiter = new DemoLoginRateLimiter(clock);

        for (int attempt = 0; attempt < 5; attempt++) {
            assertThat(limiter.tryAcquire("192.0.2.10")).isEmpty();
        }
        assertThat(limiter.tryAcquire("192.0.2.10"))
                .contains(Duration.ofMinutes(1));
        assertThat(limiter.tryAcquire("192.0.2.11")).isEmpty();

        clock.advance(Duration.ofMinutes(1));
        assertThat(limiter.tryAcquire("192.0.2.10")).isEmpty();
    }

    @Test
    void rejectsNewClientKeysRatherThanEvictingActiveLimitsWhenCapacityIsReached() {
        DemoLoginRateLimiter limiter = new DemoLoginRateLimiter(
                new MutableClock(Instant.parse("2026-01-01T00:00:00Z")));
        for (int client = 0; client < DemoLoginRateLimiter.MAX_CLIENTS; client++) {
            assertThat(limiter.tryAcquire("192.0.2." + client)).isEmpty();
        }

        assertThat(limiter.tryAcquire("192.0.2.20000"))
                .contains(DemoLoginRateLimiter.WINDOW);
        for (int attempt = 1; attempt < DemoLoginRateLimiter.MAX_ATTEMPTS; attempt++) {
            assertThat(limiter.tryAcquire("192.0.2.0")).isEmpty();
        }
        assertThat(limiter.tryAcquire("192.0.2.0"))
                .contains(DemoLoginRateLimiter.WINDOW);
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }

        private void advance(Duration duration) {
            instant = instant.plus(duration);
        }
    }
}
