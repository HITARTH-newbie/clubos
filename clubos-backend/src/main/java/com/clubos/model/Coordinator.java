package com.clubos.model;

import java.util.*;

public class Coordinator extends User {
    public Coordinator(String id, String name, String contact, Collection<String> skills) {
        super(id, name, contact, skills);
    }
    @Override public Role getRole() { return Role.COORDINATOR; }
}
