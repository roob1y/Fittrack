# FitTrack Backlog

## v1.1 Bundle — Complete ✓

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

- [ ] Logo updated to FitTRACK — two tone, "Fit" in lime green, "TRACK" in white
- [ ] Warmup section redesign:
  - Two types of warmup cards — timed and rep-based
  - Timed card — movement name, description, countdown timer only
  - Rep card — movement name, description, rep target, tick when done
  - Light loading movements show clear weight guidance
  - Remove sets concept from warmups entirely
  - Review and rewrite all warmup data across all 5 days
- [ ] Day cards layout — single full-width column on mobile, 2 columns on desktop
- [ ] Skipped day cards not updating colour on week overview
- [ ] Reset data confirmation — replace browser confirm() with in-app modal
- [ ] Session timer not resetting correctly when switching between days
- [ ] Warmup timer cannot be stopped or reset once started
- [ ] Weight tracker save button overflows outside its container
- [ ] App icon — replace default Android icon with FitTrack branding
- [ ] Splash screen — replace plain white with branded screen
- [ ] Remove meals logged and avg daily kcal stats from Progress tab
- [ ] Show original exercise name on substituted exercise cards
- [ ] Calendar day selection — tapping a date doesn't visually
      highlight it with an outline to show it's selected

---

## v1.3 — React + Capacitor Migration

- [ ] Migrate to React + Capacitor stack
- [ ] Convert all JS modules to React components
- [ ] Implement proper state management (React Context or Zustand)
- [ ] Shared component library for use across all ecosystem apps
- [ ] No new features — migration only
- [ ] Ensure all v1.2 functionality works identically after migration

---

## v1.4 — Complex Features (Post React Migration)

- [ ] Modal/bottom sheet for calendar — replaces calendar tab,
      opens from header week badge
- [ ] Modal/bottom sheet for settings — replaces current settings view
- [ ] Weekly completion meter — animated circular arc gauge on Progress tab
- [ ] Motivational quotes and nudges:
  - Daily quote shown on week overview
  - Pre-workout nudge if not yet trained today
  - Full screen celebration moment when marking a day complete
  - Streak motivation if no workout logged in 2+ days
  - Tone setting in settings (Hardcore, Positive, Stoic, Off)
- [ ] Equipment selection UI redesign:
  - Add icons/emojis next to each equipment item
  - Group equipment by type (Barbells, Dumbbells, Machines, Accessories)
  - Add preset options (Full home gym, Dumbbells only, Full commercial gym)
  - Select all / deselect all option
- [ ] Background timer support — rest and session timers continue
      when app is backgrounded
- [ ] Push notifications for rest timer completion
- [ ] Keep screen awake during workout session
- [ ] Haptic feedback when ticking a set done
- [ ] Sound option — beep when rest timer finishes
- [ ] Back button behaviour — Android back button navigates within
      the app not exit it
- [ ] Android pinch-to-zoom — prevent stretching the view
- [ ] SVG muscle group icons for day cards — body silhouette SVGs
      with relevant muscle groups highlighted in lime green

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

- [ ] **Warmup exercise demonstrations** — diagrams, GIFs or short
      videos showing correct form for each warmup movement
- [ ] **Quick log** — one tap set counter per exercise
- [ ] **Plate calculator** — enter total weight, shows plates needed per side
- [ ] **Export data** — CSV or PDF workout history
- [ ] **Workout summary screen** on day completion
- [ ] **Dark/light mode toggle**
- [ ] **First time user onboarding guide**

---

## Future Considerations

- On-device AI coaching using WebLLM with Llama 3.2 3B — free, offline,
  downloads once over WiFi. Plateau detection, progression suggestions,
  recovery advice. Target device S23 (Snapdragon 8 Gen 2)
- Exercise database API (e.g. wger.de)
- User selectable exercise alternatives
- Deload week suggestions after every 4-6 weeks
- Integration with MindTrack, NutriTrack, BodyTrack
- Dashboard tying all ecosystem apps together
- Programme customisation — edit sets and reps per exercise
- Session timer that learns average rest periods over time
- Play Store release — signed APK, screenshots, privacy policy
- iOS version via Capacitor
