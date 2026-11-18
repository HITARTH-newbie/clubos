package com.clubos.controller;

import com.clubos.service.ClubOsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ClubOsController {
    private final ClubOsService service;
    public ClubOsController(ClubOsService service){this.service=service;}
    private String caller(HttpServletRequest r){return r.getHeader("X-ClubOS-Id");}

    @GetMapping("/session/{id}") public Object session(@PathVariable String id){return service.session(id);}
    @GetMapping("/meta") public Object meta(){return service.meta();}
    @GetMapping("/clubs") public Object clubs(HttpServletRequest r){return service.clubs(caller(r));}
    @PostMapping("/clubs") public Object createClub(HttpServletRequest r,@RequestBody Map<String,Object>b){return service.createClub(caller(r),b);}
    @GetMapping("/clubs/{id}/members") public Object members(HttpServletRequest r,@PathVariable String id){return service.clubMembers(caller(r),id);}
    @PostMapping("/clubs/{id}/members") public Object addMember(HttpServletRequest r,@PathVariable String id,@RequestBody Map<String,Object>b){return service.addMember(caller(r),id,b);}
    @GetMapping("/events") public Object events(HttpServletRequest r,@RequestParam String clubId){return service.events(caller(r),clubId);}
    @PostMapping("/events") public Object createEvent(HttpServletRequest r,@RequestBody Map<String,Object>b){return service.createEvent(caller(r),b);}
    @GetMapping("/dashboard") public Object dashboard(HttpServletRequest r,@RequestParam String eventId){return service.dashboard(caller(r),eventId);}
    @GetMapping("/events/{id}/tasks") public Object tasks(HttpServletRequest r,@PathVariable String id){return service.tasks(caller(r),id);}
    @PostMapping("/events/{id}/tasks") public Object createTask(HttpServletRequest r,@PathVariable String id,@RequestBody Map<String,Object>b){return service.createTask(caller(r),id,b);}
    @PatchMapping("/tasks/{id}") public Object updateTask(HttpServletRequest r,@PathVariable String id,@RequestBody Map<String,Object>b){return service.updateTask(caller(r),id,b);}
    @GetMapping("/members/{memberId}/workload") public Object workload(HttpServletRequest r,@PathVariable String memberId,@RequestParam String eventId){return service.workloadFor(caller(r),eventId,memberId);}
    @GetMapping("/events/{id}/timeline") public Object timeline(HttpServletRequest r,@PathVariable String id){return service.timeline(caller(r),id);}
    @GetMapping("/events/{id}/people") public Object people(HttpServletRequest r,@PathVariable String id){return service.people(caller(r),id);}
    @GetMapping("/events/{id}/resources") public Object resources(HttpServletRequest r,@PathVariable String id){return service.resources(caller(r),id);}
    @PostMapping("/events/{id}/resources") public Object createResource(HttpServletRequest r,@PathVariable String id,@RequestBody Map<String,Object>b){return service.createResource(caller(r),id,b);}
    @GetMapping("/events/{id}/announcements") public Object announcements(HttpServletRequest r,@PathVariable String id){return service.announcements(caller(r),id);}
    @GetMapping("/events/{id}/suggestions") public Object suggestions(HttpServletRequest r,@PathVariable String id,@RequestParam(required=false)String skill,@RequestParam(required=false)String dueDate,@RequestParam(required=false)String taskId){return service.suggestions(caller(r),id,skill,dueDate,taskId);}
    @PostMapping("/users") public Object createUser(@RequestBody Map<String,Object>b){return service.createUser(b);}
}
