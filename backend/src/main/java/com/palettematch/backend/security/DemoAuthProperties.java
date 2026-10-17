package com.palettematch.backend.security;

public record DemoAuthProperties(
        String passwordBcrypt,
        String issuer,
        String audience) {

    @Override
    public String toString() {
        return "DemoAuthProperties[passwordBcrypt=<redacted>, issuer=" + issuer
                + ", audience=" + audience + "]";
    }
}
