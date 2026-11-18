package com.clubos.model;
public enum TaskStatus {
    TODO("todo"), IN_PROGRESS("in_progress"), BLOCKED("blocked"), DONE("done");
    private final String api;
    TaskStatus(String api) { this.api = api; }
    public String api() { return api; }
    public static TaskStatus from(String value) {
        for (TaskStatus s : values()) if (s.api.equalsIgnoreCase(value) || s.name().equalsIgnoreCase(value)) return s;
        throw new IllegalArgumentException("Choose a valid task status.");
    }
}
