// src/services/timetableGenerator.js
//
// ============================================================
// TIMETABLE GENERATION ALGORITHM — Greedy CSP with Backtracking
// ============================================================
//
// ALGORITHM OVERVIEW
// ------------------
// Phase 1: LOAD   – fetch all teachers, subjects, sections, rooms
//                   and the section_subjects curriculum map from DB
// Phase 2: DEFINE – build the slot universe (day × time_block)
//                   and filter out lunch slots per section lunch_type
// Phase 3: SORT   – order requirements by HARDEST-FIRST heuristic
//                   (subject with fewest available teachers / most
//                    weekly_hours goes first → reduces dead-ends)
// Phase 4: ASSIGN – for each (section, subject) requirement:
//                   • iterate available slots
//                   • for each slot, pick a teacher + room that:
//                       – teacher not already occupied in that slot
//                       – room not already occupied in that slot
//                       – room type matches subject type (Lab/Theory)
//                   • if no slot fits → record conflict log, skip
// Phase 5: PERSIST – bulk-insert all entries in one transaction
// Phase 6: LOG    – write generation log with stats
//
// TIME COMPLEXITY: O(S × D × T × R) where S=subjects, D=slots,
//                  T=teachers, R=rooms  (manageable for college scale)
// ============================================================

const { pool, withTransaction } = require('../db/pool');
const logger = require('../utils/logger');
const MAX_LECTURES_PER_DAY = 4; // adjust (3–5 recommended)
const getTimePriority = (time) => {
  if (time < '12:00') return 1;   // morning
  if (time < '14:00') return 2;   // mid
  return 3;                       // afternoon
};

// ── Constants ────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Each slot is 1 hour. College hours 9–17 (8 slots/day)
const ALL_HOUR_SLOTS = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '12:00', end: '13:00' },  // may be lunch A
  { start: '13:00', end: '14:00' },  // may be lunch B
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
];

const LAB_SUBJECT_KEYWORDS = ['lab', 'laboratory', 'practical'];
const isLabSubject = (name) =>
  LAB_SUBJECT_KEYWORDS.some((k) => name.toLowerCase().includes(k));

// ── Main Generator ───────────────────────────────────────────
async function generateTimetable(adminId = null, clearExisting = true) {
  const conflicts = [];
  const entries = [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Phase 1: LOAD ────────────────────────────────────────
    const [
      { rows: sections },
      { rows: rooms },
      { rows: curriculumRows },
    ] = await Promise.all([
      client.query('SELECT * FROM sections'),
      client.query('SELECT * FROM rooms'),
      client.query(`
        SELECT ss.section_id, ss.subject_id, ss.teacher_id,
               s.subject_name, s.weekly_hours,
               t.name AS teacher_name
        FROM section_subjects ss
        JOIN subjects s ON s.subject_id = ss.subject_id
        LEFT JOIN teachers t ON t.teacher_id = ss.teacher_id
      `),
    ]);

    if (!curriculumRows.length) {
      throw new Error('No curriculum data found. Add section_subjects first.');
    }

    // ── Phase 2: BUILD SLOT UNIVERSE per section ─────────────
    // teacherBusy[day][time][teacherId] = true
    // roomBusy[day][time][roomId] = true
    // sectionBusy[day][time][sectionId] = true
    const teacherBusy = {};
    const roomBusy = {};
    const sectionBusy = {};

    const initBusy = (store, day, time) => {
      if (!store[day]) store[day] = {};
      if (!store[day][time]) store[day][time] = {};
    };

    const slotsForSection = (section) => {
  const lunchSlot = section.lunch_type === 'A' ? '12:00' : '13:00';

  const slots = [];

  // Step 1: group slots by time first (horizontal distribution)
  for (const slot of ALL_HOUR_SLOTS) {
    if (slot.start === lunchSlot) continue;

    for (const day of DAYS) {
      slots.push({ day, ...slot });
    }
  }

  return slots;
};

    // ── Phase 3: SORT requirements HARDEST-FIRST ────────────
    // More weekly_hours = harder → schedule those first
    const requirements = [...curriculumRows].sort(
      (a, b) => b.weekly_hours - a.weekly_hours
    );

    // ── Phase 4: GREEDY ASSIGN ───────────────────────────────
    const sectionSlots = {};
    sections.forEach((sec) => {
      sectionSlots[sec.section_id] = slotsForSection(sec);
    });

    // Track hours placed per (section, subject)
    const hoursPlaced = {};
    const lastSubjectPerSection = {};
    const dayLoadPerSection = {};

    // Group by section for fair round-robin scheduling
    const bySectionSubject = {};
    for (const req of requirements) {
      const key = `${req.section_id}`;
      if (!bySectionSubject[key]) bySectionSubject[key] = [];
      bySectionSubject[key].push({ ...req });
    }

    // Slot pointer per section (so we spread across days)
    const sectionSlotPointer = {};

    // For Lab subjects, try to assign 2-hour consecutive blocks
    const requiresLab = (name) => isLabSubject(name);

    const pickRoom = (day, slotStart, subjectName) => {
      const neededType = requiresLab(subjectName) ? 'Lab' : 'Theory';
      const dayRoomBusy = (roomBusy[day] || {})[slotStart] || {};
      return rooms.find(
        (r) => r.type === neededType && !dayRoomBusy[r.room_id]
      ) || rooms.find((r) => !dayRoomBusy[r.room_id]); // fallback: any free room
    };

    for (const [sectionId, reqs] of Object.entries(bySectionSubject)) {
      const secNum = parseInt(sectionId, 10);

      if (!dayLoadPerSection[secNum]) {
        dayLoadPerSection[secNum] = {};
        DAYS.forEach(d => dayLoadPerSection[secNum][d] = 0);
      }
      const slots = sectionSlots[secNum];
      if (!sectionSlotPointer[secNum]) sectionSlotPointer[secNum] = 0;

      for (const req of reqs) {
        const reqKey = `${req.section_id}_${req.subject_id}`;
        if (!hoursPlaced[reqKey]) hoursPlaced[reqKey] = 0;

        let attempts = 0;
        const maxAttempts = slots.length * 2;

        while (
          hoursPlaced[reqKey] < req.weekly_hours &&
          attempts < maxAttempts
        ) {
          
          attempts++;

          // Pick slot from least-used day
          const sortedSlots = [...slots].sort(
            (a, b) => {
              const dayDiff =
                dayLoadPerSection[secNum][a.day] -
                dayLoadPerSection[secNum][b.day];

              if (dayDiff !== 0) return dayDiff;

              // 🔥 Balance time also
              return getTimePriority(a.start) - getTimePriority(b.start);
            }
          );
          sortedSlots.sort(() => Math.random() - 0.5);

          let slot = null;

          for (const s of sortedSlots) {
            const d = s.day;
            const t = s.start;

            // 🔥 CONTROLLED GAPS (IMPORTANT)
            if (dayLoadPerSection[secNum][d] >= MAX_LECTURES_PER_DAY) continue;

            if (sectionBusy[d]?.[t]?.[secNum]) continue;
            if (req.teacher_id && teacherBusy[d]?.[t]?.[req.teacher_id]) continue;

            // Prevent same subject continuous
            const last = lastSubjectPerSection[secNum]?.[d];
            if (last === req.subject_id) continue;

            // Optional: random gap (natural feel)
            if (Math.random() < 0.15) continue;

            slot = s;
            break;
          }

          if (!slot) continue;

          const { day, start, end } = slot;

          initBusy(teacherBusy, day, start);
          initBusy(roomBusy, day, start);
          initBusy(sectionBusy, day, start);

          // Section already busy in this slot?
          if (sectionBusy[day][start][secNum]) continue;

          // Teacher already busy?
          if (req.teacher_id && teacherBusy[day][start][req.teacher_id]) continue;

          // Pick a room
          const room = pickRoom(day, start, req.subject_name);
          if (!room) {
            conflicts.push({
              type: 'NO_ROOM',
              description: `No room available for ${req.subject_name} on ${day} ${start}`,
              day, start_time: start, section_id: secNum,
            });
            continue;
          }

          // Mark busy
          if (req.teacher_id) teacherBusy[day][start][req.teacher_id] = true;
          roomBusy[day][start][room.room_id] = true;
          sectionBusy[day][start][secNum] = true;

          entries.push({
            day,
            start_time: start,
            end_time: end,
            teacher_id: req.teacher_id,
            subject_id: req.subject_id,
            room_id: room.room_id,
            section_id: secNum,
          });
          dayLoadPerSection[secNum][day]++;
          if (!lastSubjectPerSection[secNum]) {
            lastSubjectPerSection[secNum] = {};
          }
          lastSubjectPerSection[secNum][day] = req.subject_id;

          hoursPlaced[reqKey]++;
        }

        // Did we fulfill the weekly_hours?
        if (hoursPlaced[reqKey] < req.weekly_hours) {
          conflicts.push({
            type: 'UNFULFILLED_HOURS',
            description: `${req.subject_name} for section ${req.section_id}: placed ${hoursPlaced[reqKey]}/${req.weekly_hours} hrs`,
            section_id: secNum,
            subject_id: req.subject_id,
          });
        }
      }
    }

    // ── Phase 5: PERSIST ─────────────────────────────────────
    if (clearExisting) {
      await client.query('DELETE FROM timetable');
    }

    for (const e of entries) {
      await client.query(
        `INSERT INTO timetable (day, start_time, end_time, teacher_id, subject_id, room_id, section_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [e.day, e.start_time, e.end_time, e.teacher_id, e.subject_id, e.room_id, e.section_id]
      );
    }

    // ── Phase 6: LOG ─────────────────────────────────────────
    const logResult = await client.query(
      `INSERT INTO generation_logs
         (generated_by, algorithm, entries_created, conflicts_found, status, detail)
       VALUES ($1, 'greedy_csp', $2, $3, $4, $5)
       RETURNING log_id`,
      [
        adminId,
        entries.length,
        conflicts.length,
        conflicts.length > 0 ? 'partial' : 'success',
        JSON.stringify({ conflicts }),
      ]
    );

    if (conflicts.length) {
      for (const c of conflicts) {
        await client.query(
          `INSERT INTO conflict_logs
             (log_id, conflict_type, description, day, start_time, section_id)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [logResult.rows[0].log_id, c.type, c.description, c.day || null,
           c.start_time || null, c.section_id || null]
        );
      }
    }

    await client.query('COMMIT');

    logger.info('Timetable generated', {
      entries: entries.length,
      conflicts: conflicts.length,
      logId: logResult.rows[0].log_id,
    });

    return {
      success: true,
      entriesCreated: entries.length,
      conflicts,
      logId: logResult.rows[0].log_id,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Timetable generation failed', { error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { generateTimetable };
