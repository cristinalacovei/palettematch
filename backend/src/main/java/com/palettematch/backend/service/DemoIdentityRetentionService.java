package com.palettematch.backend.service;

import java.time.Instant;

import com.palettematch.backend.repository.AppUserRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(prefix = "app.auth", name = "mode", havingValue = "demo")
public class DemoIdentityRetentionService {

    private final AppUserRepository appUserRepository;

    public DemoIdentityRetentionService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public int purgeExpiredIdentities(Instant now) {
        return appUserRepository.deleteExpiredDemoIdentities(now);
    }
}
