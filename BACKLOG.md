# FitTrack Backlog

## v1.1 Bundle

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

---

## v1.2 Bundle — Simple Fixes (Vanilla JS)

- [x] Logo updated to FitTRACK — two tone, "Fit" in lime green, "TRACK" in white
- [x] Warmup section redesign:
  - Two types of warmup cards — timed and rep-based
  - Timed card — movement name, description, countdown timer only
  - Rep card — movement name, description, rep target, tick when done
  - Light loading movements show clear weight guidance
  - Remove sets concept from warmups entirely
  - Review and rewrite all warmup data across all 5 days
- [x] Day cards layout — single full-width column on mobile, 2 columns on desktop
- [x] Skipped day cards not updating colour on week overview
- [x] Reset data confirmation — replace browser confirm() with in-app modal
- [x] Session timer not resetting correctly when switching between days
- [x] Warmup timer cannot be stopped or reset once started
- [x] Weight tracker save button overflows outside its container
- [x] App icon — replace default Android icon with FitTrack branding
- [x] Splash screen — replace plain white with branded screen
- [x] Remove meals logged and avg daily kcal stats from Progress tab
- [x] Show original exercise name on substituted exercise cards
- [x] Calendar day selection — tapping a date doesn't visually
      highlight it with an outline to show it's selected

---

## v1.3 — React + Capacitor Migration

- [x] Migrate to React + Capacitor stack
- [x] Convert all JS modules to React components
- [x] Implement proper state management (React Context or Zustand)
- [x] Shared component library for use across all ecosystem apps
- [x] No new features — migration only
- [x] Ensure all v1.2 functionality works identically after migration

---

## v1.4.1 — Complex Features (Post React Migration)

- [x] Modal/bottom sheet for calendar — replaces calendar tab,
      opens from header week badge
- [x] Modal/bottom sheet for settings — replaces current settings view
- [x] Weekly completion meter — animated circular arc gauge on Progress tab
- [x] Motivational quotes and nudges:
  - Daily quote shown on week overview
  - Pre-workout nudge if not yet trained today
  - Full screen celebration moment when marking a day complete
  - Streak motivation if no workout logged in 2+ days
  - Tone setting in settings (Hardcore, Positive, Stoic, Off)
- [x] Equipment selection UI redesign:
  - Add icons/emojis next to each equipment item
  - Group equipment by type (Barbells, Dumbbells, Machines, Accessories)
  - Add preset options (Full home gym, Dumbbells only, Full commercial gym)
  - Select all / deselect all option
- [x] Android pinch-to-zoom — prevent stretching the view
- [x] SVG muscle group icons for day cards — body silhouette SVGs
      with relevant muscle groups highlighted in lime green

## v1.4.2 — Complex Features (Post React Migration)

- [x] Background timer support — rest and session timers continue when app is backgrounded
- [x] Push notifications for rest timer completion
- [x] Keep screen awake during workout session
- [x] Haptic feedback when ticking a set done
- [x] Sound option — beep when rest timer finishes
- [x] Back button behaviour — Android back button navigates within the app not exit it

---

## Ship Alone — In Priority Order

- [x] ~~Calendar view~~
- [x] ~~Review and trim Day 4 and Day 5 to fit within 60 minute target~~
- [x] ~~Equipment profile on setup~~
- [x] ~~Equipment notes / barbell weights~~
- [x] ~~If a user logs a lower weight than recommended, ask if they want to update the default~~
- [x] ~~Rest timer / full session timer~~
- [x] ~~Body weight tracker~~
- [x] ~~Personal bests / PB alerts~~
- [x] ~~Strength progress graphs per body part~~
- [x] ~~Fix setData week-awareness~~
- [x] ~~Targeted warmup per muscle group~~

- [x] ~~Warmup exercise demonstrations~~ — diagrams, GIFs or short videos showing correct form for each warmup movement
- [x] ~~Quick log~~ — one tap set counter per exercise
- [x] ~~Plate calculator~~ — enter total weight, shows plates needed per side
- [x] ~~Export data~~ — CSV or PDF workout history
- [x] ~~Workout summary screen~~ on day completion
- [x] ~~Dark/light mode toggle~~
- [x] ~~First time user onboarding guide~~

---

## 1.4.3 Quick Fixes & Polish

XS

- [x] Decrease the size of the settings icon
- [x] Remove visible scrollbar on the right when scrolling (hide via CSS)
- [x] Fix padding — top and bottom of exercise cards are too big
- [x] Weight view — "Log Today / Save" button is outside its container
- [x] Circular progress graph — add more space between text and edge of circle
- [x] FitTrack version tag in settings — unclickable button at the bottom reading "FitTrack v1.0 / Fitness tracking made easy"
- [x] Strength progress section — when no data exists show a friendly empty state instead of just workout names
- [x] Improve visual distinction between similar exercises — exercises like Bench Press and Incline Bench Press should be clearly visually differentiated to reduce misclicks, e.g. subtle secondary label, icon or colour tag
- [x] Light mode — the lime green accent does not pop sufficiently on the light background. Reassess light mode colour treatment or consider removing light mode entirely in favour of dark only
- [x] Confetti on the workout complete screen stops, starts and moves periodically — fix animation to run smoothly and continuously until dismissed

S

- [x] Moving between views — automatically scroll to top on view change
- [x] Weight view — move the trend graph to the bottom below all other content
- [x] Tapping anywhere to continue on celebration screen — animate opacity pulsing in and out to hint it's tappable
- [x] Highlight today's exercise on the workouts screen so the current day is immediately obvious
- [x] Prevent the user from skipping a day that has already been completed
- [x] On the last set of the last exercise in a routine hide the rest timer — the user will not need it after the final set

M

- [x] Background timer — if user leaves the app mid-workout and the timer finishes, fire a local notification with sound alerting them rest is over
- [x] Workout running in background — if a workout has been active for more than 30 minutes notify the user it is still running in the background

---

## Bug Fixes

S

- [x] Export PDF and CSV not working — investigate and fix
- [x] Rest screen — Skip and Done Resting do the same thing, remove one, keep Skip only
- [x] The workouts screen should not be scrollable when the rest timer is on display
- [x] Personal best indicator should not trigger when the user logs a weight lower than the default — only show PB when a genuine best is achieved

---

## UX Improvements 1.5

S

- [x] Session complete screen — move notes input here, remove it from the main exercise window
- [x] Previous week session notes — when starting a new week's session the user can see the notes from the same workout the previous week so they know what happened last time
- [x] Undo workout for the day — if the user wants to remove the day's workout entirely show a warning prompt asking them to confirm before deleting
- [x] First workout detection — remove the "when do you start" screen entirely. Detect the start date automatically when the user completes their first workout. Show a congratulations message on completion.
- [x] Failure sets — allow the user to log the number of reps reached before failure, stored for progress tracking

M

- [x] Rest timer — display at the top of the screen instead of sliding up as a bottom sheet
- [x] Bench press — if no barbell is present in the user's equipment suggest dumbbell bench press as an automatic substitution
- [x] Timer — move out of the header into a more appropriate position within the workout view
- [x] Add fanfare sound alongside the confetti on the celebration screen
- [x] Exercise card — tapping the card opens a dedicated exercise detail view showing equipment tags, description and any relevant info
- [x] Calendar — move into the Progress view, remove slide-up animation, make it fill the full screen within that view. Actually might have a button dedicated to the calendar somewhere else. The calendar isnt neccesary for the user to see perhaps?

L

- [x] Unit setting — when the user changes the default unit between kg and lbs all default weight values throughout the app must update accordingly. Prompt the user to confirm whether they want to convert existing values.

---


## Backup Data

M

- [x] JSON Backup & Restore — export full app data as a .json file and restore from a previously exported file. Lives in Settings. Warn the user before import that it will overwrite all current data.

---

## Nav Refactor

L

- [x] Full bottom navigation refactor. Workouts, Weight and Progress become persistent overlay buttons at the bottom of the screen, matching the NutriTrack navigation pattern for consistency across the ecosystem. This is a full architectural change

---

## Per-Set Weight Refactor

L
[x] Re structure the data model for per set weight logging:

- Full data model refactor to store weight per individual set rather than a single default weight for the whole day
- Each set in every exercise stores its own kg value independently
- The default weight pre-populates each set but the user can adjust per set during the session
- The timer screen prompts the user to confirm or adjust the weight for the upcoming set


---

## Bug Fixes — v1.6

S

- [x] **Timer weight not updating after expiry** — if the user edits the weight input and the timer runs out before confirming, the new value is not saved. The auto-complete handler must read current input state, not the initial `nextSetWeight` prop.
- [x] **Info sheet scrolls behind overlay** — body scroll is not locked while the exercise info sheet is open. Apply the same `overflow: hidden` / `position: fixed` pattern used in `RestTimer`.
- [x] **"Few days" nudge persists after workout complete** — streak nudge does not dismiss once today's workout is marked done. Clear it as soon as today's key exists in `completedDays`.

---

## Timer Improvements

S

- [x] **Countdown beeps for 3–2–1** — play a short distinct beep at 3, 2, and 1 seconds remaining, separate from the rest-complete sound.
- [x] **Suppress weight input on final rest timer** — the next-set weight input must not appear on the last set of the last exercise. Apply the same guard already used to suppress the timer itself.

M

- [x] **Confirm weight applies to all remaining sets** — when the user confirms a new weight on the timer, apply it to every subsequent set of the same exercise, not just the next one.
- [x] **Next set info footer on timer** — show a small line at the bottom of the rest timer screen: e.g. "Next: 3 × 10 reps". On the final set of an exercise, show the upcoming exercise name instead: e.g. "Next exercise: Romanian Deadlift".
- [x] **User-adjustable rest duration** — add a rest time setting in Settings with science-backed presets: 60s (Isolation), 90s (Compound), 120s (Heavy / strength). Current auto-select logic remains the default; this setting overrides it. Could also expose a ± nudge directly on the timer screen.

---

## Notes

M

- [x] **Per-exercise notes as collapsible dropdown** — replace the current notes UX with an inline collapsible "📝 Add note" row per exercise card. Session-level notes remain on the workout summary screen as a general catch-all.

---

## Play Store Defaults - USER CAN NO LONGER SET BARBELL WEIGHT

S

- [x] **Beginner-friendly default barbell weights** — personal bar weights (10 kg / 7.5 kg) are not suitable as app-wide defaults. Set standard defaults (e.g. 20 kg Olympic bar / 15 kg EZ bar) or prompt the user to enter bar weights during onboarding. No legal issue — a standard "consult a physician" disclaimer in onboarding satisfies Play Store health app requirements. Revisit alongside the onboarding flow.

---

## Warmup Refactor

L

[x] Redesign the warmup flow:

- Each warmup exercise becomes its own screen, fast and snappy transitions between them
- Timed warmups automatically advance to the next screen when complete
- Each screen shows a simple gif representing the motion
- Description of the exercise underneath the gif
- Flow moves automatically through all warmups before the main session begins

---

## Install Animation Library

S

- [x] Install an animation library (e.g. Framer Motion or Lottie) to power the celebration screen animations, tappable hint animation, and warmup transitions

---

## Complex / New Features

L

- [x] Input validation — consider setting sensible maximum values for weight and reps to prevent unrealistic entries skewing progress graphs. Research realistic upper limits rather than hard blocking the user.

---

## BodyTrack Features

S

- [x] **Weight tracker expansion** — consolidate weight logging and body measurements into a unified Body Composition section in Progress tab. Replaces the current standalone weight view.

M

- [x] **Body measurements logging** — track chest, waist, hips, arms (bicep), and legs (thigh) measurements. Same logging pattern as weight — date-stamped entries, history list, trend line per measurement. Accessible from a new section in the Progress tab.

- [ ] **Body fat % estimate** — calculate body fat percentage from logged measurements using the Navy method. Display as a trend graph alongside weight. No API needed — pure calculation from existing data.

L

- [ ] **Progress photos** — date-stamped photo storage using `@capacitor/filesystem`. Side-by-side comparison of any two photos. Ship alone — filesystem access is a meaningful chunk of work separate from measurements.

---

## Programme Swap — PPL

XL

- [x] **Replace 5-day split with Push / Pull / Legs** — swap the current chest/biceps, back, hamstrings/glutes, shoulders/triceps, quads programme for a 3-day PPL split (Mon/Wed/Fri). Full rewrite of `program.js` and `warmups.js`. Pull-ups listed as primary exercise on Pull day with inverted row as the equipment-conditional alternative (requires Pull Up Bar). Deadlift on Pull day, RDL on Legs day. A complete data storage refactor is neccesary to keep data between programmes seperate and coexisting.

---

## Bug Fixes

S

- [ ] **Week advancement mismatch** — week number increments based on programme start date rather than actual workout completion. If the user doesn't complete workouts within the expected window, week advances but data remains under previous week keys, causing progress and set data to appear missing. Week advancement should be tied to workout completion, not calendar time.


## Future Considerations

- [ ] Strength vs body composition correlation — overlay strength progress graphs with body composition changes to surface patterns over time. Requires sufficient data history to be meaningful.

- [ ] Full lbs support polish pass — input-time unit conversion on set weight inputs, unit label on weight input field, plate calculator lbs plate set (45, 35, 25, 10, 5, 2.5), program default weights converted on display. Prerequisite: unit setting (done).

XL

- [ ] Background timer sync — when user is outside the app, timer continues accurately, notification fires on completion with two-beep sound. Requires Capacitor local notifications plugin and background task handling.

- On-device AI coaching using WebLLM with Llama 3.2 3B — free, offline,
  downloads once over WiFi. Plateau detection, progression suggestions,
  recovery advice. Target device S23 (Snapdragon 8 Gen 2). Could the model be pre downlkoaded into the premium version of this app?
- Exercise database API (e.g. wger.de)
- User selectable exercise alternatives
- Deload week suggestions after every 4-6 weeks
- Integration with MindTrack, NutriTrack, BodyTrack
- Dashboard tying all ecosystem apps together
- Programme customisation — edit sets and reps per exercise
- Session timer that learns average rest periods over time
- Play Store release like signed APK, screenshots, privacy policy
- iOS version via Capacitor
- Social features. Gives ability to connect with other users for motivation, sharing progress and accountability.


## Onboarding Redesign

M

- [ ] **Streamlined onboarding flow** — reduce first-launch setup to 3–4 screens by combining related questions. Proposed flow:
  - Screen 1: Name + units
  - Screen 2: Goal + experience level
  - Screen 3: Equipment multi-select
  - Then straight into the app
  - Defer permission requests, email opt-in and attribution screens entirely

- [ ] **Show the program before the user commits** — after equipment selection, show a preview of the actual first workout with real exercises, sets and rest times before entering the main app.

- [ ] **Permission deferral** — request notification permissions at the moment they become relevant (e.g. first rest timer), not during onboarding.

---

## Equipment vs Routine Mismatch

M

- [ ] **Exercise swap** — add a Swap option inside `ExerciseDetailSheet` alongside the existing ⓘ button. Opens a filtered picker showing same-muscle alternatives limited to the user's declared equipment. Requires a substitution map in `program.js` keyed by muscle group and equipment type.

- [ ] **Routine validation on import** — when a routine is added, flag any exercise requiring equipment not in the user's profile and offer an inline swap at that point rather than mid-workout.

## Social Feed

XL

- [ ] **Social tab** — fourth bottom nav item. Activity feed showing workout completions, PB milestones and streak achievements from friends. Each post auto-generates from existing app events — no manual posting needed. Includes fire reaction and comments.
- [ ] **Leaderboard** — weekly volume ranking among friends, surfaced inline in the feed.
- [ ] **Milestone cards** — distinct post formats for PB and streak achievements.
- [ ] **Challenges** — friend group challenges based on weekly volume or session count.
- [ ] Requires backend — user accounts and shared database are a prerequisite.

---

## Profile Tab

M

- [ ] **Profile tab** — dedicated fifth nav item replacing the settings icon in the header. Houses social identity, personal stats, friends list and settings.
- [ ] **Settings consolidation** — Settings moves inside Profile entirely, freeing up the header.
- [ ] Exact content and relationship with the Body tab to be decided at build time.