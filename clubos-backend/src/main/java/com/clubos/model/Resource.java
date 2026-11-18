package com.clubos.model;

import java.time.LocalDate;

public record Resource(String id, String eventId, String name, String category,
                       String description, String url, String addedBy, LocalDate addedOn) {}
