package com.palettematch.backend.config;

import java.time.Instant;

import com.palettematch.backend.service.DemoIdentityRetentionService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
@ConditionalOnProperty(prefix = "app.auth", name = "mode", havingValue = "demo")
public class DemoIdentityCleanupJob implements ApplicationRunner {

    private static final long CLEANUP_INTERVAL_MILLIS = 6 * 60 * 60 * 1000L;

    private final DemoIdentityRetentionService retentionService;

    public DemoIdentityCleanupJob(DemoIdentityRetentionService retentionService) {
        this.retentionService = retentionService;
    }

    @Override
    public void run(ApplicationArguments args) {
        retentionService.purgeExpiredIdentities(Instant.now());
    }

    @Scheduled(
            fixedDelay = CLEANUP_INTERVAL_MILLIS,
            initialDelay = CLEANUP_INTERVAL_MILLIS)
    public void purgeExpiredIdentities() {
        retentionService.purgeExpiredIdentities(Instant.now());
    }
}
