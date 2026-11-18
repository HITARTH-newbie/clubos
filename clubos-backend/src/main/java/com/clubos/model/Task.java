package com.clubos.model;

import java.time.LocalDate;
import java.util.*;

public class Task {
    private final String id, eventId;
    private String title, description, assigneeId, requiredSkill;
    private LocalDate dueDate;
    private Priority priority;
    private TaskStatus status = TaskStatus.TODO;
    private final Set<String> dependsOn = new LinkedHashSet<>();
    public Task(String id,String eventId,String title,String description,LocalDate dueDate,Priority priority,String requiredSkill) {
        this.id=id; this.eventId=eventId; this.title=title; this.description=description;
        this.dueDate=dueDate; this.priority=priority; this.requiredSkill=requiredSkill;
    }
    public String getId(){return id;} public String getEventId(){return eventId;} public String getTitle(){return title;}
    public String getDescription(){return description;} public String getAssigneeId(){return assigneeId;}
    public String getRequiredSkill(){return requiredSkill;} public LocalDate getDueDate(){return dueDate;}
    public Priority getPriority(){return priority;} public TaskStatus getStatus(){return status;}
    public Set<String> getDependsOn(){return dependsOn;}
    public void assignTo(String memberId){this.assigneeId=memberId;}
    public void update(String title,String description,LocalDate dueDate,Priority priority,String requiredSkill) {
        if(title!=null)this.title=title; if(description!=null)this.description=description;
        if(dueDate!=null)this.dueDate=dueDate; if(priority!=null)this.priority=priority;
        if(requiredSkill!=null)this.requiredSkill=requiredSkill;
    }
    public void setStatus(TaskStatus status){this.status=status;}
    public boolean isOverdue(){return status!=TaskStatus.DONE && dueDate.isBefore(LocalDate.now());}
    public void addDependency(String id){dependsOn.add(id);}
}
