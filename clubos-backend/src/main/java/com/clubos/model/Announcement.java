package com.clubos.model;
import java.time.LocalDate;
public record Announcement(String id, String eventId, String title, String body, String authorId, LocalDate postedOn) {}
