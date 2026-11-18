package com.clubos.model;

import java.util.*;

public abstract class User {
    private final String id;
    private final String name;
    private final String contact;
    private final Set<String> skills = new LinkedHashSet<>();

    protected User(String id, String name, String contact, Collection<String> skills) {
        this.id = id; this.name = name; this.contact = contact;
        if (skills != null) this.skills.addAll(skills);
    }
    public String getId() { return id; }
    public String getName() { return name; }
    public String getContact() { return contact; }
    public Set<String> getSkills() { return Collections.unmodifiableSet(skills); }
    public abstract Role getRole();
}
