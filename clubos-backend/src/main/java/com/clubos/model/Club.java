package com.clubos.model;

import java.util.*;

public class Club {
    private final String id, name, tagline;
    private final Map<String, Role> memberships = new LinkedHashMap<>();
    private final List<String> eventIds = new ArrayList<>();
    public Club(String id, String name, String tagline) { this.id=id; this.name=name; this.tagline=tagline; }
    public String getId(){return id;} public String getName(){return name;} public String getTagline(){return tagline;}
    public Map<String,Role> getMemberships(){return memberships;} public List<String> getEventIds(){return eventIds;}
    public void addMember(User user, Role role){ memberships.put(user.getId(), role); }
    public boolean contains(String userId){ return memberships.containsKey(userId); }
}
