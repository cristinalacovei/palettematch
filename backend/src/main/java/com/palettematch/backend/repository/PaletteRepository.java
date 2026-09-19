package com.palettematch.backend.repository;

import java.util.List;
import java.util.UUID;

import com.palettematch.backend.entity.Palette;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaletteRepository extends JpaRepository<Palette, UUID> {

    List<Palette> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
