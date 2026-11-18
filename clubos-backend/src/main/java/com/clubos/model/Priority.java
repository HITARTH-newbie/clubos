package com.clubos.model;
public enum Priority {
    LOW(1), MEDIUM(2), HIGH(3), CRITICAL(4);
    private final int weight;
    Priority(int weight) { this.weight = weight; }
    public int weight() { return weight; }
    public static Priority from(String value) {
        try { return valueOf(value.toUpperCase()); }
        catch (Exception e) { throw new IllegalArgumentException("Choose a valid priority."); }
    }
}
