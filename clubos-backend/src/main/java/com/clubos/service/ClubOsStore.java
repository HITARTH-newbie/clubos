package com.clubos.service;

import com.clubos.model.*;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class ClubOsStore {
    public final Map<String,User> users=new LinkedHashMap<>();
    public final Map<String,Club> clubs=new LinkedHashMap<>();
    public final Map<String,Event> events=new LinkedHashMap<>();
    public final Map<String,Task> tasks=new LinkedHashMap<>();
    public final Map<String,Resource> resources=new LinkedHashMap<>();
    public final Map<String,Announcement> announcements=new LinkedHashMap<>();
    private final Map<String,Integer> counters=new HashMap<>();
    public String next(String prefix){int n=counters.merge(prefix,1,Integer::sum);return prefix+String.format("%03d",n);}
}
