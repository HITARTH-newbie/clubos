package com.clubos.model;

import java.util.*;

public class Member extends User {
    public Member(String id, String name, String contact, Collection<String> skills) {
        super(id, name, contact, skills);
    }
    @Override public Role getRole() { return Role.MEMBER; }
    public int calculateWorkload(Collection<Task> tasks) {
        return tasks.stream().filter(t -> getId().equals(t.getAssigneeId()) && t.getStatus() != TaskStatus.DONE)
            .mapToInt(t -> t.getPriority().weight()).sum();
    }
}
