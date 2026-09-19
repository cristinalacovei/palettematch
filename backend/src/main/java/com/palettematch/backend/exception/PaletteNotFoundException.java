package com.palettematch.backend.exception;

public class PaletteNotFoundException extends RuntimeException {

    public PaletteNotFoundException() {
        super("Palette was not found");
    }
}
