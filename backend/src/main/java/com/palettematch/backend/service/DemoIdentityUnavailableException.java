package com.palettematch.backend.service;

public class DemoIdentityUnavailableException extends RuntimeException {

    public DemoIdentityUnavailableException() {
        super("Demo identity has expired or is no longer available.");
    }
}
