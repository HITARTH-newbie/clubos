package com.clubos.model;

import java.time.LocalDate;
import java.util.*;

public class Event {
    private final String id, clubId, name, venue, description, type;
    private final LocalDate date;
    private final Set<String> teamIds = new LinkedHashSet<>();
    private final List<String> taskIds = new ArrayList<>();
    private final List<Map<String,Object>> milestones = new ArrayList<>();
    public Event(String id,String clubId,String name,String type,LocalDate date,String venue,String description) {
        this.id=id; this.clubId=clubId; this.name=name; this.type=type; this.date=date; this.venue=venue; this.description=description;
    }
    public String getId(){return id;} public String getClubId(){return clubId;} public String getName(){return name;}
    public String getType(){return type;} public LocalDate getDate(){return date;} public String getVenue(){return venue;}
    public String getDescription(){return description;} public Set<String> getTeamIds(){return teamIds;}
    public List<String> getTaskIds(){return taskIds;} public List<Map<String,Object>> getMilestones(){return milestones;}
    public int calculateReadiness(Collection<Task> tasks) {
        List<Task> own = tasks.stream().filter(t -> id.equals(t.getEventId())).toList();
        int total=own.stream().mapToInt(t->t.getPriority().weight()).sum();
        int done=own.stream().filter(t->t.getStatus()==TaskStatus.DONE).mapToInt(t->t.getPriority().weight()).sum();
        return total==0 ? 0 : Math.round(100f*done/total);
    }
}
