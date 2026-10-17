package com.palettematch.backend.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import com.palettematch.backend.exception.PaletteNotFoundException;
import com.palettematch.backend.service.DemoIdentityUnavailableException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class PaletteApiExceptionHandler {

    @ExceptionHandler(PaletteNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse paletteNotFound(PaletteNotFoundException exception) {
        return new ErrorResponse(404, exception.getMessage(), Map.of());
    }

    @ExceptionHandler(DemoIdentityUnavailableException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResponse demoIdentityUnavailable(DemoIdentityUnavailableException exception) {
        return new ErrorResponse(401, exception.getMessage(), Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse validation(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return new ErrorResponse(400, "Validation failed", errors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse constraintViolation(ConstraintViolationException exception) {
        return new ErrorResponse(400, "Validation failed", Map.of());
    }

    public record ErrorResponse(int status, String message, Map<String, String> errors) {
    }
}
