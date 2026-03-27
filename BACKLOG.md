# FitTrack Backlog

## v1.1 Bundle — In Progress

- [x] No way to undo marking a day complete
- [x] Update Day 1 data — push-ups reduced to 1 set to failure as a chest finisher
- [x] Make supersets visually clearer — merge paired exercises into one card
- [x] Show estimated workout duration on each day card
- [x] Week number tracker — manually increment week number
- [x] Notes field per workout day
- [x] Skip day with reason
- [x] Equipment summary shown at the top of each day
- [x] Record how long each day's workout took
- [x] Reorder exercises in Day 3 — front squats before hip thrusts
- [x] Reorder exercises in Day 4 — shoulder press before lateral raises

## v1.2 Bundle — Planned

- [ ] Make session timer visible on screen during workout
- [ ] Skipping a day should auto-complete it and hide the complete button

---

## Ship Alone — In Priority Order

1. **Review and trim Day 4 and Day 5 to fit within 60 minute target**
   - Day 4 currently ~66 mins
   - Day 5 currently ~69 mins

2. **If a user logs a lower weight than recommended, ask if they want to update the default**
   - Prompt user when logged weight is lower than the exercise default
   - Allow them to update the default for future sessions

3. **Rest timer / full session timer**
   - Countdown timer between sets
   - 60-90 seconds for isolation exercises
   - 2-3 minutes for heavy compounds (deadlifts, squats, bench press)
   - Rest after both exercises for supersets
   - Total session timer running in background
   - Compare actual time vs estimated time at end of session
   - Over time learns user's average rest periods to improve estimates

4. **Calendar view**
   - Map workout days to real calendar dates
   - User can start Day 1 on any weekday
   - See which days were trained each week
   - View full training history by date
   - Flag if too long left between sessions
   - Eventually warn if muscle groups trained too close together

5. **Equipment profile on setup** ← required before items 6 and 9
   - User sets available equipment on first open
   - Each exercise tagged with required equipment
   - Exercises swapped or replaced with bodyweight alternatives if equipment unavailable

6. **Equipment notes / barbell weights** ← depends on equipment profile
   - Store personal equipment details (e.g. 5ft barbell = 7.5kg, 7ft barbell = 10kg)
   - Factor bar weight into total weight displayed
   - Show as reminder on relevant exercises

7. **Body weight tracker**
   - Daily weight logging
   - Trend graph over time
   - Feeds into BodyTrack when that app is built

8. **Personal bests / PB alerts** ← depends on weight logging being stable
   - Automatically detect when a new weight record is set on any exercise
   - Celebrate with a notification or visual indicator

9. **Strength progress graphs per body part** ← depends on items 7 and 8
   - Graph showing weight progression over time per exercise
   - Grouped by muscle group / body part

10. **Targeted warmup per muscle group** ← depends on equipment profile (item 5)
    - Short specific warmup shown before each day
    - Based on muscles being trained that day
    - Filtered by available equipment
    - Bodyweight alternatives always available as fallback

---

## Future Considerations

- AI coaching — plateau detection, progression suggestions, recovery advice
- Session timer that learns user's average rest periods over time
- Deload week suggestions after every 4-6 weeks
- Integration with MindTrack recovery score to suggest lighter sessions
- Integration with NutriTrack to adjust calorie targets based on training day
