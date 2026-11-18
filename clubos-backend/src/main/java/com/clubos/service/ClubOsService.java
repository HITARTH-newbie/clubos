package com.clubos.service;

import com.clubos.exception.ApiException;
import com.clubos.model.*;
import org.springframework.stereotype.Service;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.*;

@Service
public class ClubOsService {
    private static final List<String> SKILLS=List.of("Styling","Design","Photography","Social Media","Music","Sound","Choreography","Logistics","Sponsorship","Budgeting","Stage Management","Scripting","Lighting","Coding");
    private static final List<String> CATEGORIES=List.of("Posters","Scripts","Music","Documents","Notes","Links");
    private static final int DUE_SOON_DAYS=3;
    private final ClubOsStore db;
    public ClubOsService(ClubOsStore db){this.db=db; seed();}

    private void seed(){
        if(!db.users.isEmpty())return;
        addUser("CD001","Raajvee Mishra","raajvee@example.com",Role.COORDINATOR,List.of("Logistics","Sponsorship","Budgeting"));
        addUser("CD002","Krish Goyal","krish@example.com",Role.COORDINATOR,List.of("Scripting","Stage Management","Lighting"));
        addUser("MB001","Hitarth Jaiswal","hitarth@example.com",Role.MEMBER,List.of("Styling","Photography","Social Media"));
        addUser("MB002","Atishay Jain","atishay@example.com",Role.MEMBER,List.of("Choreography","Music","Sound"));
        addUser("MB003","Meera Iyer","meera@example.com",Role.MEMBER,List.of("Design","Photography","Social Media"));
        addUser("MB004","Dev Malhotra","dev@example.com",Role.MEMBER,List.of("Logistics","Sponsorship","Lighting"));
        addUser("MB005","Ananya Bose","ananya@example.com",Role.MEMBER,List.of("Scripting","Stage Management","Design"));
        addUser("MB006","Rohan Gupta","rohan@example.com",Role.MEMBER,List.of("Coding","Design","Sound"));
        Club c1=new Club("C1","Radiance","Fashion, styling and campus productions");
        Club c2=new Club("C2","The Thespian Circle","Acting, theatre and live performance");
        db.clubs.put(c1.getId(),c1);db.clubs.put(c2.getId(),c2);
        membership(c1,"CD001",Role.COORDINATOR); membership(c1,"MB001",Role.MEMBER); membership(c1,"MB002",Role.MEMBER); membership(c1,"MB003",Role.MEMBER); membership(c1,"MB004",Role.MEMBER);
        membership(c2,"CD002",Role.COORDINATOR); membership(c2,"MB001",Role.MEMBER); membership(c2,"MB004",Role.MEMBER); membership(c2,"MB005",Role.MEMBER);
        LocalDate today=LocalDate.now();
        Event e1=event("E1","C1","Runway Showcase","PERFORMANCE",today.plusDays(18),"Main Auditorium","An evening runway celebrating thrifted and vintage fashion, from the 1950s to the 90s.",List.of("CD001","MB001","MB002","MB003","MB004"));
        Event e2=event("E2","C1","Campus Style Pop-up","WORKSHOP",today.plusDays(40),"Student Plaza","A one-day campus pop-up with student vendors and swap racks.",List.of("CD001","MB001","MB003"));
        Event e3=event("E3","C2","Annual Stage Production","PERFORMANCE",today.plusDays(32),"Open Air Theatre","The society's annual full-length play.",List.of("CD002","MB001","MB004","MB005"));
        task("T1","E1","Finalise runway theme and moodboard","MB003","done",-8,"high","Design",List.of());
        task("T2","E1","Model auditions and shortlist","MB001","done",-2,"high","Styling",List.of());
        task("T3","E1","Secure venue and permissions","MB004","done",-5,"high","Logistics",List.of());
        task("T4","E1","Design posters and social teasers","MB003","in_progress",2,"medium","Design",List.of("T1"));
        task("T5","E1","Sponsor outreach and tie-ups","MB004","in_progress",-1,"high","Sponsorship",List.of("T3"));
        task("T6","E1","Curate vintage outfit lineup","MB001","in_progress",5,"high","Styling",List.of("T2"));
        task("T7","E1","Choreograph walk sequence","MB002","todo",9,"medium","Choreography",List.of("T2"));
        task("T8","E1","Compile soundtrack and cue sheet","MB002","blocked",10,"medium","Music",List.of("T7"));
        task("T9","E1","Lighting plan and tech recce",null,"todo",12,"high","Lighting",List.of("T3"));
        task("T10","E1","Backstage run-of-show",null,"todo",14,"medium","Stage Management",List.of("T6","T7"));
        task("T11","E1","Photography and media coverage plan","MB001","todo",15,"low","Photography",List.of("T4"));
        task("T12","E1","Print passes and signage","MB003","todo",13,"low","Design",List.of("T4","T5"));
        task("T13","E1","Final budget sign-off","CD001","todo",6,"high","Budgeting",List.of());
        task("T14","E2","Shortlist thrift vendors","MB003","in_progress",14,"medium","Logistics",List.of());
        task("T15","E2","Stall layout and signage","MB001","todo",30,"low","Design",List.of("T14"));
        task("T16","E2","Campus permissions request","CD001","todo",20,"high","Logistics",List.of());
        task("T17","E3","Finalise script draft","MB005","in_progress",4,"high","Scripting",List.of());
        task("T18","E3","Audition coordination","MB001","in_progress",8,"medium","Logistics",List.of());
        task("T19","E3","Set design and build plan","MB004","todo",20,"medium","Logistics",List.of("T17"));
        task("T20","E3","Rehearsal schedule",null,"todo",9,"high","Stage Management",List.of());
        task("T21","E3","Costume plan","MB001","todo",18,"medium","Styling",List.of("T18"));
        task("T22","E3","Publicity assets","MB005","todo",15,"low","Design",List.of("T17"));
        task("T23","E3","Lighting cues draft","CD002","todo",24,"medium","Lighting",List.of("T17"));
        resource("R1","E1","Poster draft v2","Posters","Teaser poster in the 1970s colour story. Feedback open until Wednesday.","https://example.com/vintage-vogue/poster-v2","MB003",-2);
        resource("R2","E1","Runway script and host lines","Scripts","Host introductions for each act, with timing marks.","https://example.com/vintage-vogue/script","CD001",-4);
        resource("R3","E1","Soundtrack shortlist","Music","Candidate tracks per act with approximate lengths.","https://example.com/vintage-vogue/music","MB002",-3);
        resource("R4","E1","Sponsor deck","Documents","Current outreach deck with the audience numbers.","https://example.com/vintage-vogue/sponsor-deck","MB004",-9);
        resource("R5","E1","Venue permission letter","Documents","Signed letter for the auditorium booking.","https://example.com/vintage-vogue/venue-letter","MB004",-6);
        resource("R6","E1","Backstage notes","Notes","Models report 90 minutes before showtime. Two changing zones and one steaming station near the wings. Keep a spare safety-pin kit in each zone.","","CD001",-1);
        resource("R7","E1","Reference moodboard","Links","Shared board with decade references.","https://example.com/vintage-vogue/moodboard","MB003",-8);
        resource("R8","E2","Vendor contact sheet","Documents","Names, categories and rough stall sizes.","https://example.com/pop-up/vendors","MB003",-1);
        resource("R9","E3","Script draft v3","Scripts","Acts one and two are final; act three in review.","https://example.com/spring-act/script-v3","MB005",-2);
        resource("R10","E3","Rehearsal notes","Notes","Pace the first scene faster, and keep the lantern cue after the second line.","","CD002",-1);
        resource("R11","E3","Set sketches","Documents","Two layout options for the open-air stage.","https://example.com/spring-act/set","MB004",-5);
        announcement("A1","E1","Outfit fittings this weekend","Bring your reference outfits and shoes. Slots are in the shared sheet.","CD001",-1);
        announcement("A2","E1","Poster teaser goes live Thursday","Please hold all sharing until the official post is out.","CD001",-3);
        announcement("A3","E1","Sponsor outreach led by Dev","Send any brand contacts to Dev so we do not double up.","CD001",-6);
        announcement("A4","E2","Vendor shortlist open","Add any thrift sellers you know to the contact sheet.","CD001",-2);
        announcement("A5","E3","Script reading on Friday","Full read-through at 6 pm. Bring a pencil.","CD002",-1);
    }
    private void addUser(String id,String name,String contact,Role role,List<String> skills){db.users.put(id,role==Role.COORDINATOR?new Coordinator(id,name,contact,skills):new Member(id,name,contact,skills));}
    private void membership(Club c,String u,Role r){c.getMemberships().put(u,r);}
    private Event event(String id,String club,String name,String type,LocalDate date,String venue,String desc,List<String> team){
        Event e=new Event(id,club,name,type,date,venue,desc);e.getTeamIds().addAll(team);db.events.put(id,e);db.clubs.get(club).getEventIds().add(id);return e;
    }
    private void task(String id,String event,String title,String owner,String status,int days,String priority,String skill,List<String> deps){
        Task t=new Task(id,event,title,"",LocalDate.now().plusDays(days),Priority.from(priority),skill);
        if(owner!=null)t.assignTo(owner);t.setStatus(TaskStatus.from(status));deps.forEach(t::addDependency);db.tasks.put(id,t);db.events.get(event).getTaskIds().add(id);
    }
    private void resource(String id,String event,String name,String cat,String desc,String url,String by,int days){db.resources.put(id,new Resource(id,event,name,cat,desc,url,by,LocalDate.now().plusDays(days)));}
    private void announcement(String id,String event,String title,String body,String by,int days){db.announcements.put(id,new Announcement(id,event,title,body,by,LocalDate.now().plusDays(days)));}

    private User user(String id){User u=db.users.get(id);if(u==null)throw ApiException.notFound("We couldn't find the ID “"+id+"”.");return u;}
    private Club club(String id){Club c=db.clubs.get(id);if(c==null)throw ApiException.notFound("That club does not exist.");return c;}
    private Event eventById(String id){Event e=db.events.get(id);if(e==null)throw ApiException.notFound("That event does not exist.");return e;}
    private Task taskById(String id){Task t=db.tasks.get(id);if(t==null)throw ApiException.notFound("That task does not exist.");return t;}
    private User caller(String header){if(header==null||header.isBlank())throw new ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED,"NO_SESSION","Sign in with your ClubOS ID first.");return user(header.trim().toUpperCase());}
    private Role role(User u,String clubId){return club(clubId).getMemberships().get(u.getId());}
    private void requireCoordinator(User u,String clubId){if(role(u,clubId)!=Role.COORDINATOR)throw ApiException.forbidden("Only this club's coordinator can perform that action.");}
    private void requireEventAccess(User u,Event e){Role r=role(u,e.getClubId());if(r==null || (r==Role.MEMBER&&!e.getTeamIds().contains(u.getId())))throw ApiException.forbidden("You do not have access to this event.");}
    private List<Task> eventTasks(String id){return db.tasks.values().stream().filter(t->t.getEventId().equals(id)).toList();}
    private int workload(String eventId,String uid,String exclude){return eventTasks(eventId).stream().filter(t->uid.equals(t.getAssigneeId())&&!t.getId().equals(exclude)&&t.getStatus()!=TaskStatus.DONE).mapToInt(t->t.getPriority().weight()).sum();}
    private Map<String,Object> workloadView(String eventId,String uid){
        List<Task> mine=eventTasks(eventId).stream().filter(t->uid.equals(t.getAssigneeId())).toList();
        List<Task> active=mine.stream().filter(t->t.getStatus()!=TaskStatus.DONE).toList();
        int weight=active.stream().mapToInt(t->t.getPriority().weight()).sum();
        int overdue=(int)active.stream().filter(Task::isOverdue).count();
        String level=weight==0?"Free":weight<=4?"Light":weight<=8?"Balanced":"Heavy";
        return Map.of("active",active.size(),"done",mine.size()-active.size(),"overdue",overdue,"weight",weight,"level",level,"capacity",12);
    }
    private Map<String,Object> flags(Task t){
        long days=ChronoUnit.DAYS.between(LocalDate.now(),t.getDueDate());
        List<Task> waiting=t.getDependsOn().stream().map(db.tasks::get).filter(Objects::nonNull).filter(x->x.getStatus()!=TaskStatus.DONE).toList();
        boolean open=t.getStatus()!=TaskStatus.DONE;
        return Map.of("overdue",open&&days<0,"dueSoon",open&&days>=0&&days<=DUE_SOON_DAYS,"dependencyBlocked",open&&!waiting.isEmpty(),"unassigned",open&&t.getAssigneeId()==null,"daysUntilDue",days);
    }
    private Map<String,Object> taskView(Task t,User me,Role role){
        User a=t.getAssigneeId()==null?null:db.users.get(t.getAssigneeId());
        List<Map<String,Object>> deps=t.getDependsOn().stream().map(db.tasks::get).filter(Objects::nonNull).map(d->Map.<String,Object>of("id",d.getId(),"title",d.getTitle(),"status",d.getStatus().api())).toList();
        boolean canStatus=role==Role.COORDINATOR||Objects.equals(t.getAssigneeId(),me.getId());
        Map<String,Object> permissions=Map.of("canEdit",role==Role.COORDINATOR,"canChangeStatus",canStatus);
        return Map.ofEntries(Map.entry("id",t.getId()),Map.entry("eventId",t.getEventId()),Map.entry("title",t.getTitle()),Map.entry("description",t.getDescription()),
            Map.entry("assigneeId",t.getAssigneeId()==null?"":t.getAssigneeId()),Map.entry("assigneeName",a==null?"":a.getName()),
            Map.entry("assigneeInitials",a==null?"":initials(a.getName())),Map.entry("dueDate",t.getDueDate().toString()),
            Map.entry("priority",t.getPriority().name().toLowerCase()),Map.entry("status",t.getStatus().api()),
            Map.entry("requiredSkill",t.getRequiredSkill()==null?"":t.getRequiredSkill()),Map.entry("dependsOn",deps),Map.entry("flags",flags(t)),
            Map.entry("isYours",Objects.equals(t.getAssigneeId(),me.getId())),Map.entry("permissions",permissions));
    }
    private String initials(String n){return Arrays.stream(n.trim().split("\\s+")).limit(2).map(x->x.substring(0,1)).collect(Collectors.joining()).toUpperCase();}
    private Map<String,Object> readiness(String eventId){
        List<Task> ts=eventTasks(eventId);Map<String,Integer> counts=new LinkedHashMap<>(Map.of("todo",0,"in_progress",0,"blocked",0,"done",0));
        int total=0,done=0,overdue=0;
        for(Task t:ts){counts.merge(t.getStatus().api(),1,Integer::sum);total+=t.getPriority().weight();if(t.getStatus()==TaskStatus.DONE)done+=t.getPriority().weight();else if(t.isOverdue())overdue++;}
        int percent=total==0?0:Math.round(100f*done/total);String health=ts.isEmpty()?"empty":(overdue>0||counts.get("blocked")>0?"attention":"on_track");
        return Map.of("percent",percent,"total",ts.size(),"done",counts.get("done"),"byStatus",counts,"overdue",overdue,"health",health);
    }
    private Map<String,Object> summary(Event e,User me,Role r){
        long days=ChronoUnit.DAYS.between(LocalDate.now(),e.getDate());
        Map<String,Object> rd=readiness(e.getId());
        return Map.ofEntries(Map.entry("id",e.getId()),Map.entry("clubId",e.getClubId()),Map.entry("clubName",club(e.getClubId()).getName()),
            Map.entry("name",e.getName()),Map.entry("date",e.getDate().toString()),Map.entry("venue",e.getVenue()),Map.entry("description",e.getDescription()),
            Map.entry("daysToGo",days),Map.entry("phase",days<0?"past":"upcoming"),Map.entry("teamSize",e.getTeamIds().size()),
            Map.entry("readiness",Map.of("percent",rd.get("percent"),"health",rd.get("health"),"overdue",rd.get("overdue"),"total",rd.get("total"),"done",rd.get("done"))),
            Map.entry("role",r.name().toLowerCase()),Map.entry("myOpenTasks",eventTasks(e.getId()).stream().filter(t->me.getId().equals(t.getAssigneeId())&&t.getStatus()!=TaskStatus.DONE).count()));
    }
    private List<Event> visibleEvents(User u,String clubId){
        Club c=club(clubId);Role r=c.getMemberships().get(u.getId());if(r==null)return List.of();
        return c.getEventIds().stream().map(db.events::get).filter(Objects::nonNull).filter(e->r==Role.COORDINATOR||e.getTeamIds().contains(u.getId())).sorted(Comparator.comparing(Event::getDate)).toList();
    }
    private void ensureNoCycle(String taskId,Set<String> proposed){
        for(String dep:proposed){if(dep.equals(taskId)||reaches(dep,taskId,new HashSet<>()))throw ApiException.conflict("That dependency would create a loop between tasks.");}
    }
    private boolean reaches(String from,String target,Set<String> seen){if(from.equals(target))return true;if(!seen.add(from))return false;Task t=db.tasks.get(from);return t!=null&&t.getDependsOn().stream().anyMatch(d->reaches(d,target,seen));}

    public Map<String,Object> session(String id){
        User u=user(id);
        boolean coord=db.clubs.values().stream().anyMatch(c->c.getMemberships().get(u.getId())==Role.COORDINATOR);
        return Map.of("user",Map.of("id",u.getId(),"name",u.getName(),"initials",initials(u.getName()),"skills",u.getSkills()),
            "role",coord?"COORDINATOR":"MEMBER");
    }
    public Map<String,Object> meta(){return Map.of("statuses",List.of(Map.of("id","todo","label","To do"),Map.of("id","in_progress","label","In progress"),Map.of("id","blocked","label","Blocked"),Map.of("id","done","label","Completed")),"priorities",List.of(Map.of("id","high","label","High"),Map.of("id","medium","label","Medium"),Map.of("id","low","label","Low"),Map.of("id","critical","label","Critical")),"skills",SKILLS,"resourceCategories",CATEGORIES);}
    public List<Map<String,Object>> clubs(String header){User u=caller(header);List<Map<String,Object>> out=new ArrayList<>();for(Club c:db.clubs.values()){Role r=c.getMemberships().get(u.getId());if(r==null)continue;List<Map<String,Object>> ev=visibleEvents(u,c.getId()).stream().map(e->summary(e,u,r)).toList();out.add(Map.of("id",c.getId(),"name",c.getName(),"tagline",c.getTagline(),"role",r.name().toLowerCase(),"events",ev));}return out;}
    public List<Map<String,Object>> clubMembers(String header,String id){User u=caller(header);requireCoordinator(u,id);Club c=club(id);return c.getMemberships().entrySet().stream().map(x->{User m=user(x.getKey());return Map.<String,Object>of("id",m.getId(),"name",m.getName(),"initials",initials(m.getName()),"clubRole",x.getValue().name().toLowerCase(),"skills",m.getSkills());}).toList();}
    public List<Map<String,Object>> events(String header,String clubId){User u=caller(header);return visibleEvents(u,clubId).stream().map(e->summary(e,u,role(u,e.getClubId()))).toList();}
    public Map<String,Object> createEvent(String header,Map<String,Object> b){
        User u=caller(header);String clubId=str(b,"clubId");requireCoordinator(u,clubId);
        String name=str(b,"name"),type=str(b,"type").toUpperCase();if(name.isBlank())throw ApiException.invalid("Give the event a name.");
        if(!Set.of("CULTURAL","COMPETITION","WORKSHOP","PERFORMANCE").contains(type))throw ApiException.invalid("Choose a valid event type.");
        LocalDate date=parseDate(str(b,"date"));if(date.isBefore(LocalDate.now()))throw ApiException.invalid("Event date cannot be in the past.");
        Club c=club(clubId);String id="E"+(db.events.size()+1);
        Event e=event(id,clubId,name,type,date,optional(b,"venue"),optional(b,"description"),List.of(u.getId()));
        Object ids=b.get("teamIds");if(ids instanceof List<?> list)for(Object item:list){String uid=String.valueOf(item);if(!c.contains(uid))throw ApiException.invalid(uid+" is not a member of this club.");e.getTeamIds().add(uid);}
        return summary(e,u,Role.COORDINATOR);
    }
    public Map<String,Object> dashboard(String header,String eventId){
        User u=caller(header); Event e=eventById(eventId); requireEventAccess(u,e); Role r=role(u,e.getClubId());
        List<Task> ts=eventTasks(eventId);
        List<Map<String,Object>> views=ts.stream().filter(t->r==Role.COORDINATOR||u.getId().equals(t.getAssigneeId()))
            .map(t->taskView(t,u,r)).toList();
        List<Map<String,Object>> open=views.stream().filter(t->!"done".equals(t.get("status"))).toList();
        List<Map<String,Object>> attention=new ArrayList<>();
        for(Map<String,Object> tv:open){
            Map<String,Object> f=(Map<String,Object>)tv.get("flags");
            List<Map<String,Object>> reasons=new ArrayList<>();
            int score=0;
            if(Boolean.TRUE.equals(f.get("overdue"))){long n=Math.abs(((Number)f.get("daysUntilDue")).longValue());reasons.add(Map.of("kind","overdue","text","Overdue by "+n+" day"+(n==1?"":"s")));score+=100+(int)Math.min(n,30);}
            if("blocked".equals(tv.get("status"))){reasons.add(Map.of("kind","blocked","text","Marked blocked"));score+=80;}
            if(Boolean.TRUE.equals(f.get("unassigned"))){reasons.add(Map.of("kind","unassigned","text","No owner yet"));score+=60;}
            if(Boolean.TRUE.equals(f.get("dependencyBlocked"))){List<Map<String,Object>> deps=(List<Map<String,Object>>)tv.get("dependsOn");List<String> names=deps.stream().filter(d->!"done".equals(d.get("status"))).map(d->String.valueOf(d.get("title"))).toList();if(!names.isEmpty()){reasons.add(Map.of("kind","waiting","text","Waiting on "+(names.size()>1?names.size()+" tasks":names.get(0))));score+=50;}}
            if(Boolean.TRUE.equals(f.get("dueSoon"))){long n=((Number)f.get("daysUntilDue")).longValue();reasons.add(Map.of("kind","due_soon","text",n==0?"Due today":n==1?"Due tomorrow":"Due in "+n+" days"));score+=40-(int)n;}
            if(score>0){Map<String,Object> row=new LinkedHashMap<>(tv);row.put("reasons",reasons);row.put("_score",score);attention.add(row);}
        }
        attention.sort((a,b)->Integer.compare((int)b.get("_score"),(int)a.get("_score")));
        attention=attention.stream().limit(6).map(x->{x.remove("_score");return x;}).toList();
        List<Map<String,Object>> upcoming=open.stream().filter(t->{Map<String,Object> f=(Map<String,Object>)t.get("flags");long d=((Number)f.get("daysUntilDue")).longValue();return d>=0&&d<=7;}).sorted(Comparator.comparing(t->String.valueOf(t.get("dueDate")))).limit(6).toList();
        List<Map<String,Object>> milestones=e.getMilestones().stream().filter(m->String.valueOf(m.get("date")).compareTo(LocalDate.now().toString())>=0).limit(4).toList();
        List<Map<String,Object>> anns=announcementsFor(eventId);
        Map<String,Object> out=new LinkedHashMap<>();
        out.put("role",r.name().toLowerCase());out.put("event",summary(e,u,r));out.put("readiness",readiness(eventId));
        out.put("milestones",milestones);out.put("announcements",anns.stream().limit(3).toList());out.put("attention",attention);out.put("upcoming",upcoming);
        if(r==Role.COORDINATOR){
            List<Map<String,Object>> wl=e.getTeamIds().stream().map(uid->{User m=db.users.get(uid);Map<String,Object> w=new LinkedHashMap<>(workloadView(eventId,uid));w.put("userId",uid);w.put("name",m.getName());w.put("initials",initials(m.getName()));w.put("clubRole",role(m,e.getClubId()).name().toLowerCase());return w;}).sorted((a,b)->Integer.compare(((Number)b.get("weight")).intValue(),((Number)a.get("weight")).intValue())).toList();
            List<Map<String,Object>> unassigned=open.stream().filter(t->Boolean.TRUE.equals(((Map<String,Object>)t.get("flags")).get("unassigned"))).limit(3).toList();
            List<Map<String,Object>> suggestions=new ArrayList<>();
            for(Map<String,Object> t:unassigned){Map<String,Object> sug=suggestionsFor(eventId,String.valueOf(t.get("requiredSkill")),String.valueOf(t.get("dueDate")),String.valueOf(t.get("id")));suggestions.add(Map.of("task",t,"suggestion",sug));}
            out.put("coordinator",Map.of("workload",wl,"unassignedCount",open.stream().filter(t->Boolean.TRUE.equals(((Map<String,Object>)t.get("flags")).get("unassigned"))).count(),"suggestions",suggestions));
        } else {
            List<Map<String,Object>> mine=open.stream().sorted(Comparator.comparing(t->String.valueOf(t.get("dueDate")))).toList();
            long dueWeek=open.stream().filter(t->{long d=((Number)((Map<String,Object>)t.get("flags")).get("daysUntilDue")).longValue();return d>=0&&d<=7;}).count();
            long overdue=open.stream().filter(t->Boolean.TRUE.equals(((Map<String,Object>)t.get("flags")).get("overdue"))).count();
            out.put("member",Map.of("myTasks",mine,"completedCount",views.size()-open.size(),"workload",workloadView(eventId,u.getId()),
                "stats",Map.of("open",open.size(),"dueThisWeek",dueWeek,"overdue",overdue),
                "openAcrossWorkspaces",db.tasks.values().stream().filter(t->u.getId().equals(t.getAssigneeId())&&t.getStatus()!=TaskStatus.DONE).count()));
        }
        return out;
    }
    public List<Map<String,Object>> tasks(String header,String eventId){User u=caller(header);Event e=eventById(eventId);requireEventAccess(u,e);Role r=role(u,e.getClubId());return eventTasks(eventId).stream().filter(t->r==Role.COORDINATOR||u.getId().equals(t.getAssigneeId())).map(t->taskView(t,u,r)).toList();}
    public Map<String,Object> createTask(String header,String eventId,Map<String,Object>b){
        User u=caller(header);Event e=eventById(eventId);requireCoordinator(u,e.getClubId());
        String title=str(b,"title");if(title.length()<3)throw ApiException.invalid("Give the task a title of at least 3 characters.");
        LocalDate due=parseDate(str(b,"dueDate"));Priority p=Priority.from(str(b,"priority"));
        String id="T"+(db.tasks.size()+1);Task t=new Task(id,eventId,title,optional(b,"description"),due,p,optional(b,"requiredSkill"));
        String assignee=optional(b,"assigneeId");if(assignee!=null){if(!e.getTeamIds().contains(assignee))throw ApiException.invalid("That person is not on this event's team.");t.assignTo(assignee);}
        Set<String> deps=stringSet(b.get("dependsOn"));for(String d:deps)if(!db.tasks.containsKey(d)||!db.tasks.get(d).getEventId().equals(eventId))throw ApiException.invalid("A dependency is not part of this event.");
        ensureNoCycle(id,deps);deps.forEach(t::addDependency);db.tasks.put(id,t);e.getTaskIds().add(id);return taskView(t,u,Role.COORDINATOR);
    }
    public Map<String,Object> updateTask(String header,String id,Map<String,Object>b){
        User u=caller(header);Task t=taskById(id);Event e=eventById(t.getEventId());Role r=role(u,e.getClubId());if(r==null)throw ApiException.forbidden("You do not have access to this task.");
        if(b.containsKey("status")){
            if(r!=Role.COORDINATOR&&!Objects.equals(t.getAssigneeId(),u.getId()))throw ApiException.forbidden("You cannot change this task's status.");
            TaskStatus next=TaskStatus.from(str(b,"status"));
            if(next==TaskStatus.DONE||next==TaskStatus.IN_PROGRESS){List<String> pending=t.getDependsOn().stream().map(db.tasks::get).filter(Objects::nonNull).filter(d->d.getStatus()!=TaskStatus.DONE).map(Task::getTitle).toList();if(!pending.isEmpty())throw ApiException.conflict("“"+t.getTitle()+"” can't be "+(next==TaskStatus.DONE?"completed":"started")+" yet. It is waiting on: "+String.join(", ",pending)+".");}
            t.setStatus(next);
        } else requireCoordinator(u,e.getClubId());
        if(r==Role.COORDINATOR){
            if(b.containsKey("title")||b.containsKey("description")||b.containsKey("dueDate")||b.containsKey("priority")||b.containsKey("requiredSkill")){
                t.update(b.containsKey("title")?str(b,"title"):null,b.containsKey("description")?str(b,"description"):null,b.containsKey("dueDate")?parseDate(str(b,"dueDate")):null,b.containsKey("priority")?Priority.from(str(b,"priority")):null,b.containsKey("requiredSkill")?optional(b,"requiredSkill"):null);
            }
            if(b.containsKey("assigneeId")){String a=optional(b,"assigneeId");if(a!=null&&!e.getTeamIds().contains(a))throw ApiException.invalid("That person is not on this event's team.");t.assignTo(a);}
            if(b.containsKey("dependsOn")){Set<String> deps=stringSet(b.get("dependsOn"));for(String d:deps)if(!db.tasks.containsKey(d)||!db.tasks.get(d).getEventId().equals(e.getId()))throw ApiException.invalid("A dependency is not part of this event.");ensureNoCycle(t.getId(),deps);t.getDependsOn().clear();deps.forEach(t::addDependency);}
        }
        return taskView(t,u,r);
    }
    public Map<String,Object> workloadFor(String header,String eventId,String memberId){User u=caller(header);Event e=eventById(eventId);requireEventAccess(u,e);if(!e.getTeamIds().contains(memberId))throw ApiException.notFound("That member is not on this event's team.");return workloadView(eventId,memberId);}
    public Map<String,Object> timeline(String header,String id){
        User u=caller(header);Event e=eventById(id);requireEventAccess(u,e);Role r=role(u,e.getClubId());
        List<Map<String,Object>> items=new ArrayList<>();
        for(Map<String,Object> m:e.getMilestones()){
            String date=String.valueOf(m.get("date"));long days=ChronoUnit.DAYS.between(LocalDate.now(),LocalDate.parse(date));
            items.add(Map.of("kind","milestone","id",m.get("id"),"title",m.get("title"),"date",date,"daysUntil",days,"isEventDay",date.equals(e.getDate().toString())));
        }
        for(Task t:eventTasks(id))if(r==Role.COORDINATOR||u.getId().equals(t.getAssigneeId()))items.add(Map.of("kind","task","date",t.getDueDate().toString(),"task",taskView(t,u,r)));
        items.sort(Comparator.comparing(x->String.valueOf(x.get("date"))));
        return Map.of("today",LocalDate.now().toString(),"items",items);
    }
    public Map<String,Object> people(String header,String id){
        User u=caller(header);Event e=eventById(id);requireEventAccess(u,e);Role r=role(u,e.getClubId());
        List<Map<String,Object>> people=new ArrayList<>();
        for(String uid:e.getTeamIds()){
            User m=db.users.get(uid);Map<String,Object> p=new LinkedHashMap<>();
            p.put("id",m.getId());p.put("name",m.getName());p.put("initials",initials(m.getName()));p.put("skills",m.getSkills());
            p.put("clubRole",role(m,e.getClubId()).name().toLowerCase());p.put("isYou",uid.equals(u.getId()));
            if(r==Role.COORDINATOR||uid.equals(u.getId())){
                p.put("workload",workloadView(id,uid));
                p.put("tasks",eventTasks(id).stream().filter(t->uid.equals(t.getAssigneeId())&&t.getStatus()!=TaskStatus.DONE)
                    .sorted(Comparator.comparing(Task::getDueDate)).limit(4).map(t->Map.of("id",t.getId(),"title",t.getTitle(),"status",t.getStatus().api(),"priority",t.getPriority().name().toLowerCase(),"dueDate",t.getDueDate().toString(),"flags",flags(t))).toList());
            }
            people.add(p);
        }
        long unassigned=eventTasks(id).stream().filter(t->t.getStatus()!=TaskStatus.DONE&&t.getAssigneeId()==null).count();
        long across=db.tasks.values().stream().filter(t->u.getId().equals(t.getAssigneeId())&&t.getStatus()!=TaskStatus.DONE).count();
        return Map.of("role",r.name().toLowerCase(),"people",people,"unassignedCount",r==Role.COORDINATOR?unassigned:0,"openAcrossWorkspaces",across);
    }
    public List<Map<String,Object>> resources(String header,String id){User u=caller(header);Event e=eventById(id);requireEventAccess(u,e);return db.resources.values().stream().filter(r->r.eventId().equals(id)).sorted(Comparator.comparing(Resource::addedOn).reversed()).map(r->resourceView(r)).toList();}
    public Map<String,Object> createResource(String header,String id,Map<String,Object>b){User u=caller(header);Event e=eventById(id);requireCoordinator(u,e.getClubId());String name=str(b,"name"),cat=str(b,"category");if(name.isBlank()||!CATEGORIES.contains(cat))throw ApiException.invalid("Provide a resource name and choose a valid category.");String rid="R"+(db.resources.size()+1);Resource r=new Resource(rid,id,name,cat,optional(b,"description"),optional(b,"url"),u.getId(),LocalDate.now());db.resources.put(rid,r);return resourceView(r);}
    private Map<String,Object> resourceView(Resource r){User a=db.users.get(r.addedBy());return Map.of("id",r.id(),"eventId",r.eventId(),"name",r.name(),"category",r.category(),"description",r.description()==null?"":r.description(),"url",r.url()==null?"":r.url(),"addedBy",r.addedBy(),"addedByName",a==null?"Unknown":a.getName(),"addedOn",r.addedOn().toString());}
    private List<Map<String,Object>> announcementsFor(String id){
        return db.announcements.values().stream().filter(a->a.eventId().equals(id)).sorted(Comparator.comparing(Announcement::postedOn).reversed())
            .map(a->Map.<String,Object>of("id",a.id(),"title",a.title(),"body",a.body(),"authorName",user(a.authorId()).getName(),"postedOn",a.postedOn().toString())).toList();
    }
    public List<Map<String,Object>> announcements(String header,String id){User u=caller(header);Event e=eventById(id);requireEventAccess(u,e);return announcementsFor(id);}
    private Map<String,Object> suggestionsFor(String id,String skill,String dueDate,String taskId){
        Event e=eventById(id);List<User> team=e.getTeamIds().stream().map(db.users::get).filter(Objects::nonNull).toList();
        boolean any=skill!=null&&!skill.isBlank()&&team.stream().anyMatch(m->m.getSkills().contains(skill));
        List<Map<String,Object>> ranked=new ArrayList<>();
        for(User m:team){Map<String,Object>w=workloadView(id,m.getId());int score=50-((Number)w.get("weight")).intValue()*4-((Number)w.get("overdue")).intValue()*10;boolean match=skill!=null&&m.getSkills().contains(skill);List<String> reasons=new ArrayList<>();if(match){score+=40;reasons.add("Has the "+skill+" skill");}int active=((Number)w.get("active")).intValue();reasons.add(active==0?"No open tasks":w.get("level")+" workload ("+active+" open)");if(((Number)w.get("overdue")).intValue()>0)reasons.add(w.get("overdue")+" overdue");ranked.add(new LinkedHashMap<>(Map.of("userId",m.getId(),"name",m.getName(),"initials",initials(m.getName()),"skillMatch",match,"reasons",reasons,"level",w.get("level"),"score",score)));}
        ranked.sort((a,b)->Integer.compare((int)b.get("score"),(int)a.get("score")));
        List<Map<String,Object>> top=ranked.stream().limit(3).map(x->{x.remove("score");return x;}).toList();
        return Map.of("skill",skill==null?"":skill,"noSkillMatch",skill!=null&&!any,"options",top);
    }
    public Map<String,Object> suggestions(String header,String id,String skill,String dueDate,String taskId){
        User u=caller(header);Event e=eventById(id);requireCoordinator(u,e.getClubId());return suggestionsFor(id,skill,dueDate,taskId);
    }
    public Map<String,Object> createClub(String header,Map<String,Object>b){User u=caller(header);String name=str(b,"name");if(name.isBlank())throw ApiException.invalid("Give the club a name.");String id="C"+(db.clubs.size()+1);Club c=new Club(id,name,optional(b,"tagline"));c.addMember(u,Role.COORDINATOR);db.clubs.put(id,c);return Map.of("id",id,"name",name,"tagline",c.getTagline()==null?"":c.getTagline(),"role","coordinator");}
    public Map<String,Object> addMember(String header,String clubId,Map<String,Object>b){User u=caller(header);requireCoordinator(u,clubId);String memberId=str(b,"userId");User m=user(memberId);Club c=club(clubId);c.addMember(m,Role.MEMBER);return Map.of("id",m.getId(),"name",m.getName(),"role","member");}
    public Map<String,Object> createUser(Map<String,Object>b){String name=str(b,"name"),contact=str(b,"contact"),role=str(b,"role").toUpperCase();if(name.isBlank()||contact.isBlank())throw ApiException.invalid("Name and contact are required.");if(db.users.values().stream().anyMatch(u->u.getContact().equalsIgnoreCase(contact)))throw ApiException.conflict("That contact already has a ClubOS ID.");Role r;try{r=Role.valueOf(role);}catch(Exception ex){throw ApiException.invalid("Choose MEMBER or COORDINATOR.");}List<String> skills=stringList(b.get("skills"));if(!SKILLS.containsAll(skills))throw ApiException.invalid("One or more skills are not recognised.");String id=db.next(r==Role.MEMBER?"MB":"CD");addUser(id,name,contact,r,skills);return Map.of("id",id,"name",name,"role",r.name().toLowerCase());}
    private static String str(Map<String,Object>b,String k){Object v=b.get(k);return v==null?"":String.valueOf(v).trim();}
    private static String optional(Map<String,Object>b,String k){String s=str(b,k);return s.isBlank()?null:s;}
    private static LocalDate parseDate(String s){try{return LocalDate.parse(s);}catch(Exception e){throw ApiException.invalid("Choose a valid date in YYYY-MM-DD format.");}}
    private static Set<String> stringSet(Object v){return new LinkedHashSet<>(stringList(v));}
    private static List<String> stringList(Object v){if(!(v instanceof List<?> l))return List.of();return l.stream().map(String::valueOf).toList();}
}
