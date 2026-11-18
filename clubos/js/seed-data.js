/**
 * MOCK SAMPLE DATA — not live backend data.
 *
 * This file stands in for the records the Java application will hold
 * (User, Coordinator, Member, Club, Event, Task, Resource, Announcement).
 * It is only read by js/mock-server.js. No screen imports it directly,
 * so deleting this file and the mock server leaves the UI untouched.
 *
 * Dates are written relative to "today" so overdue / upcoming states always
 * look realistic whenever the demo is opened.
 */
(function () {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');
  function d(offsetDays) {
    const t = new Date();
    t.setHours(12, 0, 0, 0);
    t.setDate(t.getDate() + offsetDays);
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  }

  function task(id, eventId, title, assigneeId, status, due, priority, skill, deps, description) {
    return {
      id, eventId, title,
      description: description || '',
      assigneeId: assigneeId || null,
      status,
      dueDate: d(due),
      priority,
      requiredSkill: skill || null,
      dependsOn: deps || []
    };
  }

  window.ClubOSSeed = function buildSeed() {
    return {
      seq: 100,

      // ---- Users (the backend resolves the full ID to one of these) ----
      users: [
        { id: 'CD001', name: 'Raajvee Mishra', skills: ['Logistics', 'Sponsorship', 'Budgeting'] },
        { id: 'CD002', name: 'Krish Goyal', skills: ['Scripting', 'Stage Management', 'Lighting'] },
        { id: 'MB001', name: 'Hitarth Jaiswal', skills: ['Styling', 'Photography', 'Social Media'] },
        { id: 'MB002', name: 'Atishay Jain', skills: ['Choreography', 'Music', 'Sound'] },
        { id: 'MB003', name: 'Meera Iyer', skills: ['Design', 'Photography', 'Social Media'] },
        { id: 'MB004', name: 'Dev Malhotra', skills: ['Logistics', 'Sponsorship', 'Lighting'] },
        { id: 'MB005', name: 'Ananya Bose', skills: ['Scripting', 'Stage Management', 'Design'] },
        { id: 'MB006', name: 'Rohan Gupta', skills: ['Coding', 'Design', 'Sound'] }
      ],

      clubs: [
        { id: 'C1', name: 'Radiance', tagline: 'Fashion, styling and campus productions' },
        { id: 'C2', name: 'The Thespian Circle', tagline: 'Acting, theatre and live performance' },
      ],

      // ---- Club membership: this is what grants (or withholds) a role per club ----
      memberships: [
        { userId: 'CD001', clubId: 'C1', role: 'coordinator' },
        { userId: 'MB001', clubId: 'C1', role: 'member' },
        { userId: 'MB002', clubId: 'C1', role: 'member' },
        { userId: 'MB003', clubId: 'C1', role: 'member' },
        { userId: 'MB004', clubId: 'C1', role: 'member' },

        { userId: 'CD002', clubId: 'C2', role: 'coordinator' },
        { userId: 'MB001', clubId: 'C2', role: 'member' },
        { userId: 'MB004', clubId: 'C2', role: 'member' },
        { userId: 'MB005', clubId: 'C2', role: 'member' },

      ],

      events: [
        {
          id: 'E1', clubId: 'C1', name: 'Runway Showcase', date: d(18), venue: 'Main Auditorium',
          description: 'An evening runway celebrating thrifted and vintage fashion, from the 1950s to the 90s.',
          teamIds: ['CD001', 'MB001', 'MB002', 'MB003', 'MB004'],
          milestones: [
            { id: 'M1', title: 'Theme and moodboard locked', date: d(-8) },
            { id: 'M2', title: 'Model auditions complete', date: d(-2) },
            { id: 'M3', title: 'Outfit fittings', date: d(7) },
            { id: 'M4', title: 'Full dress rehearsal', date: d(16) },
            { id: 'M5', title: 'Show night', date: d(18) }
          ]
        },
        {
          id: 'E2', clubId: 'C1', name: 'Campus Style Pop-up', date: d(40), venue: 'Student Plaza',
          description: 'A one-day campus pop-up with student vendors and swap racks.',
          teamIds: ['CD001', 'MB001', 'MB003'],
          milestones: [
            { id: 'M6', title: 'Vendor shortlist final', date: d(20) },
            { id: 'M7', title: 'Stall setup', date: d(39) },
            { id: 'M8', title: 'Pop-up day', date: d(40) }
          ]
        },
        {
          id: 'E3', clubId: 'C2', name: 'Annual Stage Production', date: d(32), venue: 'Open Air Theatre',
          description: 'The society\'s annual full-length play.',
          teamIds: ['CD002', 'MB001', 'MB004', 'MB005'],
          milestones: [
            { id: 'M9', title: 'Script locked', date: d(6) },
            { id: 'M10', title: 'Cast announced', date: d(12) },
            { id: 'M11', title: 'Tech rehearsal', date: d(28) },
            { id: 'M12', title: 'Opening night', date: d(32) }
          ]
        },
      ],

      // task(id, eventId, title, assignee, status, dueInDays, priority, skill, dependsOn, description)
      tasks: [
        // Radiance — Runway Showcase
        task('T1', 'E1', 'Finalise runway theme and moodboard', 'MB003', 'done', -8, 'high', 'Design', [], 'Lock the decade palette and share the moodboard with the whole team.'),
        task('T2', 'E1', 'Model auditions and shortlist', 'MB001', 'done', -2, 'high', 'Styling', [], 'Run both audition days and publish the shortlist of 14.'),
        task('T3', 'E1', 'Secure venue and permissions', 'MB004', 'done', -5, 'high', 'Logistics', [], 'Auditorium booking, sound and lighting access, fire-safety sign-off.'),
        task('T4', 'E1', 'Design posters and social teasers', 'MB003', 'in_progress', 2, 'medium', 'Design', ['T1'], 'Three teaser posts and the main poster, following the moodboard.'),
        task('T5', 'E1', 'Sponsor outreach and tie-ups', 'MB004', 'in_progress', -1, 'high', 'Sponsorship', ['T3'], 'Follow up with the five shortlisted brands; confirm at least two.'),
        task('T6', 'E1', 'Curate vintage outfit lineup', 'MB001', 'in_progress', 5, 'high', 'Styling', ['T2'], 'Match outfits to shortlisted models and plan the fitting slots.'),
        task('T7', 'E1', 'Choreograph walk sequence', 'MB002', 'todo', 9, 'medium', 'Choreography', ['T2'], 'Entry, pause marks and exit patterns for each act.'),
        task('T8', 'E1', 'Compile soundtrack and cue sheet', 'MB002', 'blocked', 10, 'medium', 'Music', ['T7'], 'Cannot lock timings until the walk sequence is final.'),
        task('T9', 'E1', 'Lighting plan and tech recce', null, 'todo', 12, 'high', 'Lighting', ['T3'], 'Walk the stage with the technician and agree the lighting states.'),
        task('T10', 'E1', 'Backstage run-of-show', null, 'todo', 14, 'medium', 'Stage Management', ['T6', 'T7'], 'Minute-by-minute call sheet for show night.'),
        task('T11', 'E1', 'Photography and media coverage plan', 'MB001', 'todo', 15, 'low', 'Photography', ['T4'], 'Shot list, photographer slots and the post-show gallery plan.'),
        task('T12', 'E1', 'Print passes and signage', 'MB003', 'todo', 13, 'low', 'Design', ['T4', 'T5'], 'Entry passes, backstage signs and sponsor boards.'),
        task('T13', 'E1', 'Final budget sign-off', 'CD001', 'todo', 6, 'high', 'Budgeting', [], 'Reconcile spend against the approved budget.'),

        // Radiance — Campus Style Pop-up
        task('T14', 'E2', 'Shortlist thrift vendors', 'MB003', 'in_progress', 14, 'medium', 'Logistics', [], 'Ten vendors, narrowed to six.'),
        task('T15', 'E2', 'Stall layout and signage', 'MB001', 'todo', 30, 'low', 'Design', ['T14'], 'Plaza floor plan and wayfinding.'),
        task('T16', 'E2', 'Campus permissions request', 'CD001', 'todo', 20, 'high', 'Logistics', [], 'Submit the open-space permission form.'),

        // The Thespian Circle — Annual Stage Production
        task('T17', 'E3', 'Finalise script draft', 'MB005', 'in_progress', 4, 'high', 'Scripting', [], 'Lock act three and the closing monologue.'),
        task('T18', 'E3', 'Audition coordination', 'MB001', 'in_progress', 8, 'medium', 'Logistics', [], 'Slots, waiting area and audition sides.'),
        task('T19', 'E3', 'Set design and build plan', 'MB004', 'todo', 20, 'medium', 'Logistics', ['T17'], 'Materials list and build schedule.'),
        task('T20', 'E3', 'Rehearsal schedule', null, 'todo', 9, 'high', 'Stage Management', [], 'Weekly plan that works around exams.'),
        task('T21', 'E3', 'Costume plan', 'MB001', 'todo', 18, 'medium', 'Styling', ['T18'], 'Looks per character once casting is done.'),
        task('T22', 'E3', 'Publicity assets', 'MB005', 'todo', 15, 'low', 'Design', ['T17'], 'Poster and teaser line.'),
        task('T23', 'E3', 'Lighting cues draft', 'CD002', 'todo', 24, 'medium', 'Lighting', ['T17'], 'Cue list against the script.')
      ],

      resources: [
        { id: 'R1', eventId: 'E1', name: 'Poster draft v2', category: 'Posters', description: 'Teaser poster in the 1970s colour story. Feedback open until Wednesday.', url: 'https://example.com/vintage-vogue/poster-v2', addedBy: 'MB003', addedOn: d(-2) },
        { id: 'R2', eventId: 'E1', name: 'Runway script and host lines', category: 'Scripts', description: 'Host introductions for each act, with timing marks.', url: 'https://example.com/vintage-vogue/script', addedBy: 'CD001', addedOn: d(-4) },
        { id: 'R3', eventId: 'E1', name: 'Soundtrack shortlist', category: 'Music', description: 'Candidate tracks per act with approximate lengths.', url: 'https://example.com/vintage-vogue/music', addedBy: 'MB002', addedOn: d(-3) },
        { id: 'R4', eventId: 'E1', name: 'Sponsor deck', category: 'Documents', description: 'Current outreach deck with the audience numbers.', url: 'https://example.com/vintage-vogue/sponsor-deck', addedBy: 'MB004', addedOn: d(-9) },
        { id: 'R5', eventId: 'E1', name: 'Venue permission letter', category: 'Documents', description: 'Signed letter for the auditorium booking.', url: 'https://example.com/vintage-vogue/venue-letter', addedBy: 'MB004', addedOn: d(-6) },
        { id: 'R6', eventId: 'E1', name: 'Backstage notes', category: 'Notes', description: 'Models report 90 minutes before showtime. Two changing zones and one steaming station near the wings. Keep a spare safety-pin kit in each zone.', url: '', addedBy: 'CD001', addedOn: d(-1) },
        { id: 'R7', eventId: 'E1', name: 'Reference moodboard', category: 'Links', description: 'Shared board with decade references.', url: 'https://example.com/vintage-vogue/moodboard', addedBy: 'MB003', addedOn: d(-8) },

        { id: 'R8', eventId: 'E2', name: 'Vendor contact sheet', category: 'Documents', description: 'Names, categories and rough stall sizes.', url: 'https://example.com/pop-up/vendors', addedBy: 'MB003', addedOn: d(-1) },

        { id: 'R9', eventId: 'E3', name: 'Script draft v3', category: 'Scripts', description: 'Acts one and two are final; act three in review.', url: 'https://example.com/spring-act/script-v3', addedBy: 'MB005', addedOn: d(-2) },
        { id: 'R10', eventId: 'E3', name: 'Rehearsal notes', category: 'Notes', description: 'Pace the first scene faster, and keep the lantern cue after the second line.', url: '', addedBy: 'CD002', addedOn: d(-1) },
        { id: 'R11', eventId: 'E3', name: 'Set sketches', category: 'Documents', description: 'Two layout options for the open-air stage.', url: 'https://example.com/spring-act/set', addedBy: 'MB004', addedOn: d(-5) },

      ],

      announcements: [
        { id: 'A1', eventId: 'E1', title: 'Outfit fittings this weekend', body: 'Bring your reference outfits and shoes. Slots are in the shared sheet.', authorId: 'CD001', postedOn: d(-1) },
        { id: 'A2', eventId: 'E1', title: 'Poster teaser goes live Thursday', body: 'Please hold all sharing until the official post is out.', authorId: 'CD001', postedOn: d(-3) },
        { id: 'A3', eventId: 'E1', title: 'Sponsor outreach led by Dev', body: 'Send any brand contacts to Dev so we do not double up.', authorId: 'CD001', postedOn: d(-6) },
        { id: 'A4', eventId: 'E2', title: 'Vendor shortlist open', body: 'Add any thrift sellers you know to the contact sheet.', authorId: 'CD001', postedOn: d(-2) },
        { id: 'A5', eventId: 'E3', title: 'Script reading on Friday', body: 'Full read-through at 6 pm. Bring a pencil.', authorId: 'CD002', postedOn: d(-1) }
      ]
    };
  };
})();
