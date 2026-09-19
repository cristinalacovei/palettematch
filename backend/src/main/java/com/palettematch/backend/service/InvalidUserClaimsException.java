package com.palettematch.backend.service;

public class InvalidUserClaimsException extends RuntimeException {

    public InvalidUserClaimsException(String message) {
        super(message);
    }
}
