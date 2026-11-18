package com.clubos.exception;

import com.clubos.dto.ApiError;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.converter.HttpMessageNotReadableException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handle(ApiException e) {
        return ResponseEntity.status(e.getStatus()).body(new ApiError(e.getCode(), e.getMessage()));
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> invalid(IllegalArgumentException e) {
        return ResponseEntity.unprocessableEntity().body(new ApiError("VALIDATION", e.getMessage()));
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> unreadable(HttpMessageNotReadableException e) {
        return ResponseEntity.unprocessableEntity().body(new ApiError("VALIDATION", "Request body contains invalid or missing fields."));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> other(Exception e) {
        return ResponseEntity.status(500).body(new ApiError("INTERNAL_ERROR", "Something went wrong on the ClubOS server."));
    }
}
