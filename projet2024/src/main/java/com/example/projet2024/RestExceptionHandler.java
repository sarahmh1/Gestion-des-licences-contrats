package com.example.projet2024;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Expose une raison lisible pour les 400 dues à Jackson (PUT/POST avec JSON invalide).
 * Permet au front (onglet Réseau) de voir le champ / type qui pose problème.
 */
@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleNotReadable(HttpMessageNotReadableException ex) {
        Map<String, String> body = new LinkedHashMap<>(4);
        body.put("error", "JSON_NOT_READABLE");
        Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
        body.put("message", cause.getMessage());
        body.put("rawMessage", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }
}
