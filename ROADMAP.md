# Health Ecosystem Roadmap

## Vision

A personal health operating system built around one person's specific needs.
Not a generic app for the average user — a tightly integrated suite of tools
that understand how fitness, nutrition, body composition and mental wellness
connect with each other.

Built vegan-first, home-gym friendly, and designed to fit within a 60 minute
workout window at 1800 calories per day.

---

## The Apps

### 1. FitTrack ← Active Development

**Workout tracking and session management**

- Progressive overload tracking per exercise
- Weekly programme with 5 training days
- Superset support
- Session timer and efficiency tracking
- Equipment-aware exercise substitution
- Strength progress graphs per muscle group
- Personal bests detection
- Motivational quotes and nudges
- Muscle group visualisation on day cards
- Calendar and settings as bottom sheets

---

### 2. NutriTrack ← Planned

**Vegan meal planning and nutrition tracking**

- Daily calorie and macro tracking
- Vegan meal plan builder
- Recipe storage with nutritional breakdown
- Weekly grocery list generator based on meal plan
- Meal suggestions based on training day (e.g. higher protein on leg day)
- Integrates with FitTrack — knows what day you trained and adjusts targets

---

### 3. BodyTrack ← Planned

**Body composition and progress monitoring**

- Daily weight logging with trend graph
- Body measurements (chest, waist, hips, arms, legs)
- Progress photo storage with side-by-side comparison
- Body fat percentage estimates over time
- Integrates with NutriTrack — flags risk of muscle loss if calorie deficit too aggressive
- Integrates with FitTrack — correlates strength gains with body composition changes

---

### 4. MindTrack ← Planned

**Recovery and mental wellness monitoring**

- Daily sleep quality logging (duration and quality rating)
- Energy levels and stress rating each day
- Mood tracking with notes
- Recovery score calculated from sleep, stress and energy
- Caffeine tracking with source presets, L-theanine tagging, tiered cutoff warnings
- Long-term caffeine timing optimiser (learns from 30+ days of data)
- Sleep data via Samsung Health → Health Connect passive data flow
- Integrates with FitTrack — low recovery score suggests a deload or rest day
- Integrates with BodyTrack — flags correlation between poor sleep and weight fluctuation

---

## How They Connect

```
MindTrack (sleep, stress, energy)
        ↓
    Recovery Score
        ↓
FitTrack ←→ NutriTrack
(training)   (nutrition)
        ↓         ↓
        BodyTrack
    (body composition)
```

### Key Integrations

- **MindTrack → FitTrack**: Poor recovery score triggers lighter session suggestion
- **FitTrack → NutriTrack**: Training day type adjusts calorie and protein targets
- **NutriTrack → BodyTrack**: Calorie deficit size flags muscle loss risk
- **BodyTrack → NutriTrack**: Weight trend informs meal plan adjustments
- **All apps → Dashboard**: Single view showing today's training, nutrition, body and recovery status

---

## Shared Data Layer

All apps read and write to the same local database (SQLite for now, PostgreSQL when scaling).

### Core tables

- `users` — profile, equipment, preferences
- `workouts` — sessions, sets, reps, weights
- `meals` — daily meal logs, calories, macros
- `body_metrics` — weight, measurements, photos
- `mind_metrics` — sleep, stress, energy, mood

---

## Build Order

| Phase | App                                         | Status         |
| ----- | ------------------------------------------- | -------------- |
| 1     | FitTrack v1.0                               | ✓ Complete     |
| 2     | FitTrack v1.1                               | ✓ Complete     |
| 3     | FitTrack v1.2                               | ✓ Complete     |
| 4     | FitTrack v1.3 — React + Capacitor migration | ✓ Complete     |
| 5     | FitTrack v1.4 — Complex features            | ✓ Complete     |
| 6     | BodyTrack                                   | Planned        |
| 7     | MindTrack                                   | Planned        |
| 8     | NutriTrack                                  | Planned        |
| 9     | Dashboard                                   | Planned        |
| 10    | Integrations                                | Planned        |

---

## FitTrack v1.4 Progress

### Bundle 1 — Visual Polish ✓ Complete

- Weekly completion meter — animated segmented arc on Progress tab
- Muscle group SVG icons on day cards using react-body-highlighter
- Equipment selection UI redesign — grouped, emoji headers, presets

### Bundle 2 — UX Improvements ✓ Complete

- Settings as bottom sheet — opens from header gear icon
- Calendar as bottom sheet — opens from week badge
- Motivational quotes and nudges — daily quote, pre-workout nudge, streak nudge, celebration screen, tone setting

### Bundle 3 — Android Native Features ✓ Complete

- Haptic feedback on set tick
- Keep screen awake during workout
- Sound option for rest timer
- Background timer support
- Push notifications for rest timer
- Android back button behaviour

---

## Tech Stack

- **Frontend**: React + Vite
- **State**: Zustand with localStorage persistence
- **Mobile**: Capacitor (Android primary, iOS planned)
- **Health data**: Samsung Health → Health Connect (passive sleep data for MindTrack)
- **Future AI**: On-device model via WebLLM with Llama 3.2 3B for coaching features

---

## Design System

- **Fonts**: Bebas Neue (headings, stats, CTAs) + DM Sans (body)
- **Background**: `#0d0d0f`
- **FitTrack accent**: `#c8f135` (lime green)
- **NutriTrack accent**: `#ff8c42` (warm orange)
- **BodyTrack accent**: `#4fc3f7` (electric blue)
- **MindTrack accent**: `#b388ff` (soft purple)

---

## Design Principles

- **Personal first** — built for one specific person's needs, not the average user
- **Simple over clever** — each app does one thing well
- **Own your data** — everything stored locally, no third party services
- **60 minute rule** — FitTrack sessions should fit within 60 minutes
- **Vegan by default** — nutrition recommendations always plant-based
- **No bloat** — if a feature doesn't serve the user directly, it doesn't ship
