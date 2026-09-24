// ══════════════════════════════════════════
//  program.js
//  All programme data. Add new programmes
//  to PROGRAMMES — nothing else needs changing.
// ══════════════════════════════════════════
//
// Exercise fields, beyond the obvious ones:
//
//   compound: true    90s rest instead of 60s, and the "Compound" badge on the
//                     rest timer. Set it explicitly — the old COMPOUND_NAMES
//                     list in RestTimer.jsx only matches names it happens to
//                     know, which is how a whole Pull day ran on 60s rest.
//
//   restSeconds: 45   Overrides the rest for THIS exercise only, ahead of both
//                     the compound/isolation default and the user's global rest
//                     overrides in Settings. For the case `compound` cannot
//                     express: a genuine compound movement used as an
//                     activation or ramp set, which does not need 90s.
//
//   assisted: true    The logged number is a COUNTERWEIGHT, not a load — an
//                     assisted chin/dip stack. The app stores `assist` (what you
//                     read off the machine) and derives `weight` as bodyweight
//                     minus assist, so graphs and PBs keep seeing a real load.
//                     Pair with `defaultAssist`. See utils/loads.js.
//
//   id: 'bench-press' Optional. Pins the storage key for this exercise so its
//                     logged history survives a RENAME. Without it the key is
//                     a slug of `name`, so renaming an exercise orphans every
//                     set logged under the old name. Set `id` to the old
//                     slug before you rename. See utils/setKeys.js.
//
// Inserting and reordering exercises is safe — keys no longer depend on
// position. Renaming is the one edit that needs thought.

const PROGRAMMES = {
  '5day': {
    id: '5day',
    name: '5 Day Split',
    shortDescription: 'Chest & Biceps · Back · Hamstrings & Glutes · Shoulders & Triceps · Quads',
    days: [
      {
        id: 'chest-biceps',
        label: 'Day 1',
        focus: 'Chest & Biceps',
        equipment: ['Barbell', 'Dumbbells', 'Incline Bench', 'Flat Bench'],
        exercises: [
          {
            name: 'Incline Bench Press',
            muscles: { primary: ['chest'], secondary: ['front-delts', 'triceps'] },
            sets: 5,
            reps: '15/15/12/12/10',
            defaultWeight: 30,
            equipment: ['Barbell', 'Incline Bench'],
            alternative: {
              name: 'Incline Dumbbell Press',
              muscles: { primary: ['chest'], secondary: ['front-delts', 'triceps'] },
              equipment: ['Dumbbells', 'Incline Bench'],
            },
            description:
              'Targets the upper chest. The incline angle shifts emphasis to the top of the pec for more fullness over time.',
            howTo: [
              'Set the bench to 30–45° and unrack the bar with a grip slightly wider than shoulder-width.',
              'Lower the bar to your upper chest with control, keeping shoulder blades retracted.',
              'Press back up in a slight arc, squeezing the chest at the top.',
              'Keep feet flat, back naturally arched, and elbows at roughly 45–75° from your torso throughout.',
            ],
          },
          {
            name: 'Bench Press',
            muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
            sets: 4,
            reps: '12/10/8/8',
            defaultWeight: 30,
            equipment: ['Barbell', 'Flat Bench'],
            alternative: {
              name: 'Dumbbell Chest Press',
              muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
              equipment: ['Dumbbells', 'Flat Bench'],
            },
            description:
              'The cornerstone chest builder. Develops overall chest mass alongside front delts and triceps.',
            howTo: [
              'Lie flat, grip just wider than shoulder-width, shoulder blades pinched together.',
              'Lower the bar to your mid-chest in a controlled descent.',
              'Press back up explosively, driving your feet into the floor.',
              "Keep elbows at 45–75° from your torso — don't let them flare fully wide.",
            ],
          },
          {
            name: 'Incline Dumbbell Flys',
            muscles: { primary: ['chest'] },
            sets: 3,
            reps: '15/12/12',
            defaultWeight: 12.5,
            equipment: ['Dumbbells', 'Incline Bench'],
            alternative: {
              name: 'Wide Push-ups',
              muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
              equipment: [],
            },
            description:
              'Isolates the upper chest through a wide range of motion. Great for stretch and muscle development across the pec.',
            howTo: [
              'Lie on an incline bench, dumbbells above your chest with a slight bend in the elbows.',
              'Lower the weights out in a wide arc until you feel a deep stretch across the chest.',
              'Bring them back together at the top, squeezing as if hugging a tree.',
              "Keep the elbow angle consistent — don't turn this into a press.",
            ],
          },
          {
            name: 'Barbell Curl',
            muscles: { primary: ['biceps'], secondary: ['forearms'] },
            sets: 4,
            reps: '12/10/10/8',
            defaultWeight: 20,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Curl',
              muscles: { primary: ['biceps'], secondary: ['forearms'] },
              equipment: ['Dumbbells'],
            },
            description:
              'The most loadable bicep exercise. Builds peak and overall bicep mass with consistent progressive overload.',
            howTo: [
              'Stand with a shoulder-width underhand grip.',
              'Pin your elbows to your sides — they must not move forward.',
              'Curl the bar up in a smooth arc, squeezing the bicep at the top.',
              'Lower in 2–3 seconds — controlled eccentric is key.',
            ],
          },
          {
            name: 'Hammer Curls',
            muscles: { primary: ['biceps'], secondary: ['forearms'] },
            sets: 3,
            reps: '12/10/10',
            defaultWeight: 10,
            equipment: ['Dumbbells'],
            alternative: null,
            description:
              'Neutral grip curl targeting the brachialis and long head. Adds thickness and fullness that standard curls miss.',
            howTo: [
              'Hold dumbbells with palms facing each other throughout.',
              'Curl both simultaneously or alternate — either works.',
              'Keep elbows pinned. No swinging.',
              'Lower with control — 2 seconds down.',
            ],
          },
          {
            name: 'Push-Ups',
            muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
            sets: 1,
            reps: 'To failure',
            defaultWeight: null,
            equipment: [],
            alternative: null,
            description:
              'Chest finisher. One all-out set to failure — flushes blood into the muscle and extends the stimulus.',
            howTo: [
              'Hands slightly wider than shoulder-width, body in a straight line.',
              'Lower your chest to the floor with control.',
              'Push back up explosively. Keep your core braced throughout.',
              'Go until you physically cannot complete another rep with good form.',
            ],
          },
        ],
      },
      {
        id: 'back',
        label: 'Day 2',
        focus: 'Back',
        equipment: ['Barbell', 'Dumbbells', 'Flat Bench'],
        exercises: [
          {
            name: 'Deadlifts',
            muscles: { primary: ['lower-back', 'hamstrings', 'glutes'], secondary: ['upper-back', 'forearms'] },
            sets: 4,
            reps: '8/8/6/6',
            defaultWeight: 60,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Romanian Deadlift',
              muscles: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
              equipment: ['Dumbbells'],
            },
            description:
              'Builds the entire back, glutes, hamstrings and grip simultaneously. The heaviest compound movement in the programme.',
            howTo: [
              'Bar over mid-foot, hip-width stance. Grip just outside your legs.',
              'Flatten your back, brace your core hard, and push the floor away rather than pulling.',
              'Lock out at the top by squeezing your glutes. Keep the bar close to your body throughout.',
              'Lower under control.',
            ],
          },
          {
            name: 'Bent Over Rows',
            muscles: { primary: ['upper-back', 'lats'], secondary: ['biceps', 'rear-delts'] },
            sets: 4,
            reps: '12/10/10/8',
            defaultWeight: 35,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Rows',
              muscles: { primary: ['upper-back', 'lats'], secondary: ['biceps', 'rear-delts'] },
              equipment: ['Dumbbells', 'Flat Bench'],
            },
            description:
              'Builds mid and upper back thickness. Alternating grip targets different parts — underhand recruits more bicep and lower lat, overhand hits upper traps and rhomboids.',
            howTo: [
              "Hinge forward to roughly 45°, bar hanging at arm's length.",
              'Pull the bar into your lower stomach, driving elbows back and up.',
              "Lower with control. Keep your back flat — don't round under load.",
              'Alternate between underhand and overhand grip each set.',
            ],
          },
          {
            name: 'Power Shrug',
            muscles: { primary: ['upper-back'], secondary: ['forearms'] },
            sets: 3,
            reps: '12/12/12',
            defaultWeight: 62,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Shrugs',
              muscles: { primary: ['upper-back'], secondary: ['forearms'] },
              equipment: ['Dumbbells'],
            },
            description: 'Builds the traps and develops explosive pulling power. Heavy and fast.',
            howTo: [
              'Stand holding the bar with an overhand grip, arms straight.',
              'Explosively shrug your shoulders straight up toward your ears — no rolling.',
              'Hold briefly at the top then lower. Keep the movement sharp.',
            ],
          },
          {
            name: 'Chest Supported Row',
            muscles: { primary: ['upper-back', 'lats'], secondary: ['biceps', 'rear-delts'] },
            sets: 4,
            reps: '12/10/10/8',
            defaultWeight: 17.5,
            equipment: ['Chest Supported Row Machine'],
            alternative: {
              name: 'Dumbbell Rows',
              muscles: { primary: ['upper-back', 'lats'], secondary: ['biceps', 'rear-delts'] },
              equipment: ['Dumbbells', 'Flat Bench'],
            },
            description:
              'Removes the lower back from the equation entirely, letting you isolate the mid-back and rhomboids with pure pulling force.',
            howTo: [
              'Lie chest-down on the incline pad and let the handles hang at full extension.',
              'Row them up by driving your elbows back. Squeeze your shoulder blades together hard at the top.',
              "Lower slowly. Don't use momentum.",
            ],
          },
          {
            name: 'Straight-Legged Deadlifts',
            muscles: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
            sets: 3,
            reps: '10/10/10',
            defaultWeight: 40,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Romanian Deadlift',
              muscles: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
              equipment: ['Dumbbells'],
            },
            description:
              'Targets the lower back and hamstrings through a long range of motion. Keeps constant tension on the posterior chain.',
            howTo: [
              'Stand holding the bar, legs nearly straight with a soft bend.',
              'Hinge at the hips, lowering the bar down your legs until you feel a strong hamstring stretch.',
              'Drive your hips forward to return to standing. Squeeze glutes at the top.',
            ],
          },
        ],
      },
      {
        id: 'ham-glutes',
        label: 'Day 3',
        focus: 'Hamstrings & Glutes',
        equipment: ['Barbell', 'Squat Rack', 'Flat Bench', 'Dumbbells'],
        exercises: [
          {
            name: 'Front Barbell Squat',
            muscles: { primary: ['quads'], secondary: ['glutes', 'lower-back'] },
            sets: 4,
            reps: '10/10/8/8',
            defaultWeight: 40,
            equipment: ['Barbell', 'Squat Rack'],
            alternative: {
              name: 'Dumbbell Goblet Squat',
              muscles: { primary: ['quads'], secondary: ['glutes'] },
              equipment: ['Dumbbells'],
            },
            description:
              'Front-loaded squat that hammers the quads and forces an upright torso. Harder than back squats but uniquely effective for quad development.',
            howTo: [
              'Bar rests across the front of your shoulders. Elbows high, parallel to the floor.',
              'Feet shoulder-width, toes slightly out.',
              'Squat deep — the front load forces you to stay upright.',
              'Drive back up through your whole foot. Keep those elbows up throughout.',
            ],
          },
          {
            name: 'Hip Thrusts',
            muscles: { primary: ['glutes'], secondary: ['hamstrings'] },
            sets: 4,
            reps: '12/12/10/10',
            defaultWeight: 40,
            equipment: ['Barbell', 'Flat Bench'],
            alternative: {
              name: 'Glute Bridge',
              muscles: { primary: ['glutes'], secondary: ['hamstrings'] },
              equipment: ['Barbell'],
            },
            description:
              'The most direct glute exercise there is. Places glutes under maximum tension at the point of full hip extension.',
            howTo: [
              'Upper back against the bench, bar over your hips with a pad.',
              'Feet flat on the floor, hip-width apart.',
              'Drive through your heels, pushing your hips up until your body is a straight line from knees to shoulders.',
              'Squeeze your glutes hard at the top and hold for 1 second.',
            ],
          },
          {
            name: 'Romanian Deadlifts',
            muscles: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
            sets: 3,
            reps: '12/10/10',
            defaultWeight: 40,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Romanian Deadlift',
              muscles: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
              equipment: ['Dumbbells'],
            },
            description:
              'Primary hamstring builder. Keeps the posterior chain under constant load through a long range of motion.',
            howTo: [
              'Stand with bar at hip height, slight bend in the knees throughout.',
              'Push your hips back — not down. This is a hinge, not a squat.',
              'Lower until you feel a deep hamstring stretch. Stop before your back rounds.',
              'Drive your hips forward to stand. Glutes finish the rep.',
            ],
          },
          {
            name: 'Bulgarian Split Squats',
            muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
            sets: 3,
            reps: '10/10/10',
            defaultWeight: null,
            equipment: ['Flat Bench'],
            alternative: {
              name: 'Reverse Lunges',
              muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
              equipment: [],
            },
            description:
              'One of the hardest single-leg exercises there is. Builds quad and glute strength unilaterally and exposes imbalances between legs.',
            howTo: [
              'Rear foot elevated on the bench, front foot stepped well out in front.',
              'Lower your back knee toward the floor, keeping your front shin as vertical as possible.',
              'Drive back up through your front heel. Keep your torso upright.',
              "Expect these to be brutal — that's normal.",
            ],
          },
          {
            name: 'Leg Extensions',
            muscles: { primary: ['quads'] },
            sets: 4,
            reps: '15 each',
            defaultWeight: null,
            equipment: ['Leg Extension Machine'],
            alternative: { name: 'Sissy Squats', muscles: { primary: ['quads'] }, equipment: [] },
            superset: {
              name: 'Standing Lunges',
              muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
              reps: '6-8 each',
              defaultWeight: null,
              equipment: [],
              alternative: null,
            },
            description:
              'Extensions isolate the quad at full contraction. Lunges immediately after add loaded movement through the full range of motion.',
            howTo: [
              'Leg extensions: seated, pad across the shins. Extend your legs fully and squeeze hard at the top.',
              "Lower slowly — don't let the weight stack crash.",
              'Go straight into standing lunges: step forward and lower your back knee toward the floor.',
              'Push back to standing through your front heel. Alternate legs each rep.',
            ],
          },
        ],
      },
      {
        id: 'shoulders-tri',
        label: 'Day 4',
        focus: 'Shoulders & Triceps',
        equipment: ['Barbell', 'Dumbbells', 'Flat Bench', 'Squat Rack'],
        exercises: [
          {
            name: 'Barbell Shoulder Press',
            muscles: { primary: ['front-delts'], secondary: ['triceps', 'side-delts'] },
            sets: 4,
            reps: '10/10/8/8',
            defaultWeight: 30,
            equipment: ['Barbell', 'Squat Rack'],
            alternative: {
              name: 'Dumbbell Shoulder Press',
              muscles: { primary: ['front-delts'], secondary: ['triceps', 'side-delts'] },
              equipment: ['Dumbbells'],
            },
            description:
              'The foundational overhead press. Builds front and lateral deltoid mass and overall pressing strength.',
            howTo: [
              'Bar at collar-bone height in the rack. Grip just outside shoulder-width.',
              'Unrack and press straight overhead to full lockout.',
              'Lower back to collar-bone level with control.',
              'Keep your core braced — avoid excessive lower back arch.',
            ],
          },
          {
            name: 'Lateral Raises',
            muscles: { primary: ['side-delts'] },
            sets: 4,
            reps: '15/15/12/12',
            defaultWeight: 8,
            equipment: ['Dumbbells'],
            alternative: null,
            description:
              'Isolates the lateral deltoid — the muscle responsible for shoulder width. Strict form is everything here.',
            howTo: [
              'Stand with dumbbells at your sides. Slight bend in the elbows throughout.',
              'Lead with your elbows, not your hands — think of pouring water from a jug.',
              'Raise to shoulder height only. No higher.',
              'Lower in 3 seconds — the eccentric is where the work happens.',
            ],
          },
          {
            name: 'Upright Rows',
            muscles: { primary: ['side-delts', 'upper-back'], secondary: ['biceps'] },
            sets: 3,
            reps: '12/10/10',
            defaultWeight: 25,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Upright Rows',
              muscles: { primary: ['side-delts', 'upper-back'], secondary: ['biceps'] },
              equipment: ['Dumbbells'],
            },
            description:
              'Builds the upper traps and lateral deltoids simultaneously. Keep the grip wide to protect the shoulder joint.',
            howTo: [
              'Hold the bar with a shoulder-width or slightly wider overhand grip.',
              'Pull the bar straight up along your body until it reaches chin height.',
              'Lead with your elbows — they should always be above your wrists.',
              'Lower with control. Never let the bar drop.',
            ],
          },
          {
            name: 'Bench Dips / Skull Crushers',
            muscles: { primary: ['triceps'], secondary: ['chest', 'front-delts'] },
            sets: 3,
            reps: '10/10/10',
            defaultWeight: 15,
            equipment: ['Flat Bench', 'Barbell'],
            alternative: null,
            superset: {
              name: 'Skull Crushers',
              muscles: { primary: ['triceps'] },
              reps: '10/10/10',
              defaultWeight: 15,
              equipment: ['Barbell', 'Flat Bench'],
              alternative: null,
            },
            description:
              'Bench dips isolate the long head of the tricep. Skull crushers immediately after extend the stimulus through the full range of motion.',
            howTo: [
              'Bench dips: hands on the edge of the bench behind you, feet out in front. Lower to 90° then push back up.',
              'Go straight into skull crushers: lie on the bench, close grip on the bar held above your chest.',
              'Keeping your upper arms still, lower the bar toward your forehead by bending the elbows.',
              "Extend back up. Don't let the elbows flare out.",
            ],
          },
        ],
      },
      {
        id: 'quads',
        label: 'Day 5',
        focus: 'Quads',
        equipment: ['Barbell', 'Squat Rack', 'Flat Bench'],
        exercises: [
          {
            name: 'Squats (heavy)',
            muscles: { primary: ['quads'], secondary: ['glutes', 'hamstrings'] },
            sets: 2,
            reps: '8/8',
            defaultWeight: 50,
            equipment: ['Barbell', 'Squat Rack'],
            alternative: {
              name: 'Dumbbell Goblet Squats',
              muscles: { primary: ['quads'], secondary: ['glutes'] },
              equipment: ['Dumbbells'],
            },
            description: 'Low-rep heavy squats to build raw quad strength. Priority here is loading, not volume.',
            howTo: [
              'Bar on your upper traps, feet shoulder-width, toes slightly out.',
              "Brace your core hard before each rep — like you're about to take a punch.",
              'Break at hips and knees simultaneously and squat to at least parallel, ideally below.',
              'Drive back up hard through your whole foot.',
            ],
          },
          {
            name: 'Squats (lighter)',
            muscles: { primary: ['quads'], secondary: ['glutes', 'hamstrings'] },
            sets: 3,
            reps: '10-12 each',
            defaultWeight: 35,
            equipment: ['Barbell', 'Squat Rack'],
            alternative: {
              name: 'Dumbbell Goblet Squats',
              muscles: { primary: ['quads'], secondary: ['glutes'] },
              equipment: ['Dumbbells'],
            },
            description:
              'Higher-rep squats to build quad volume and endurance after the heavy sets. Same form, lighter load, more burn.',
            howTo: [
              'Same technique as the heavy squat.',
              'The lighter weight lets you go a little deeper — focus on feeling the quads working.',
              "Control the descent. Don't rush.",
            ],
          },
          {
            name: 'Bulgarian Split Squats',
            muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
            sets: 3,
            reps: '10-12 each',
            defaultWeight: null,
            equipment: ['Flat Bench'],
            alternative: {
              name: 'Reverse Lunges',
              muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
              equipment: [],
            },
            description:
              'One of the hardest single-leg exercises there is. Builds quad strength unilaterally and exposes imbalances between legs.',
            howTo: [
              'Rear foot elevated on the bench, front foot stepped well out in front.',
              'Lower your back knee toward the floor, keeping your front shin as vertical as possible.',
              'Drive back up through your front heel. Keep your torso upright.',
              "Expect these to be brutal — that's normal.",
            ],
          },
          {
            name: 'Leg Extensions',
            muscles: { primary: ['quads'] },
            sets: 4,
            reps: '15 each',
            defaultWeight: null,
            equipment: ['Leg Extension Machine'],
            alternative: { name: 'Sissy Squats', muscles: { primary: ['quads'] }, equipment: [] },
            superset: {
              name: 'Standing Lunges',
              muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
              reps: '6-8 each',
              defaultWeight: null,
              equipment: [],
              alternative: null,
            },
            description:
              'Extensions isolate the quad at full contraction. Lunges immediately after add loaded movement through the full range of motion.',
            howTo: [
              'Leg extensions: seated, pad across the shins. Extend your legs fully and squeeze hard at the top.',
              "Lower slowly — don't let the weight stack crash. Control both directions.",
              'Go straight into standing lunges: step forward and lower your back knee toward the floor.',
              'Push back to standing through your front heel. Alternate legs each rep.',
            ],
          },
        ],
      },
    ],
  },

  ppl: {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    shortDescription: 'Mon · Wed · Fri — 3 day split',
    days: [
      {
        id: 'push',
        label: 'Day 1',
        focus: 'Push',
        equipment: ['Barbell', 'Dumbbells', 'Flat Bench', 'Incline Bench'],
        exercises: [
          {
            name: 'Barbell Bench Press',
            muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
            sets: 4,
            reps: '5/5/8/10',
            defaultWeight: 60,
            equipment: ['Barbell', 'Flat Bench'],
            alternative: {
              name: 'Dumbbell Bench Press',
              muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
              equipment: ['Dumbbells', 'Flat Bench'],
            },
            description:
              'The foundation of push day. Heavy compound pressing that builds overall chest mass, front delts and triceps. Lower rep sets build strength; back-off sets drive hypertrophy.',
            howTo: [
              'Lie flat, grip just wider than shoulder-width, shoulder blades pinched together and down.',
              'Lower the bar to your mid-chest in a controlled descent — 2 seconds down.',
              'Press back up explosively, driving your feet into the floor.',
              'Keep elbows at 45–75° from your torso throughout.',
            ],
          },
          {
            name: 'Incline Dumbbell Press',
            muscles: { primary: ['chest'], secondary: ['front-delts', 'triceps'] },
            sets: 3,
            reps: '10/10/12',
            defaultWeight: 20,
            equipment: ['Dumbbells', 'Incline Bench'],
            alternative: {
              name: 'Incline Barbell Press',
              muscles: { primary: ['chest'], secondary: ['front-delts', 'triceps'] },
              equipment: ['Barbell', 'Incline Bench'],
            },
            description:
              'Targets the upper chest. Dumbbells allow greater range of motion than a barbell, giving better pec activation and stretch at the bottom.',
            howTo: [
              'Set bench to 30–45°. Hold dumbbells at chest level.',
              'Press up and slightly in, squeezing the chest at the top.',
              'Lower slowly until you feel a deep stretch across the upper chest.',
              "Keep shoulder blades retracted throughout — don't let shoulders roll forward.",
            ],
          },
          {
            name: 'Dumbbell Shoulder Press',
            muscles: { primary: ['front-delts'], secondary: ['triceps', 'side-delts'] },
            sets: 3,
            reps: '8/10/10',
            defaultWeight: 16,
            equipment: ['Dumbbells'],
            alternative: {
              name: 'Barbell Overhead Press',
              muscles: { primary: ['front-delts'], secondary: ['triceps', 'side-delts'] },
              equipment: ['Barbell', 'Squat Rack'],
            },
            description:
              'Primary shoulder builder. Dumbbells allow a more natural pressing path and develop each side independently, reducing imbalances.',
            howTo: [
              'Sit upright with dumbbells at shoulder height, palms facing forward.',
              'Press straight overhead to full lockout.',
              'Lower with control back to shoulder height.',
              'Brace your core hard throughout.',
            ],
          },
          {
            name: 'Lateral Raises',
            muscles: { primary: ['side-delts'] },
            sets: 3,
            reps: '15/15/15',
            defaultWeight: 8,
            equipment: ['Dumbbells'],
            alternative: null,
            description:
              'Isolates the lateral deltoid — the muscle responsible for shoulder width. Lighter weight, strict form. This is not an ego exercise.',
            howTo: [
              'Stand with dumbbells at your sides. Slight bend in the elbows throughout.',
              'Lead with your elbows — think of pouring water from a jug.',
              'Raise to shoulder height only. No higher.',
              'Lower in 3 seconds — the eccentric is where the work happens.',
            ],
          },
          {
            name: 'Skull Crushers',
            muscles: { primary: ['triceps'] },
            sets: 3,
            reps: '10/10/12',
            defaultWeight: 20,
            equipment: ['Barbell', 'Flat Bench'],
            alternative: {
              name: 'Dumbbell Skull Crushers',
              muscles: { primary: ['triceps'] },
              equipment: ['Dumbbells', 'Flat Bench'],
            },
            description:
              'Targets the long head of the tricep, which makes up 50% of tricep volume. The overhead stretch is unique to this movement.',
            howTo: [
              'Lie on the bench. Hold the bar with a close grip directly above your chest.',
              'Keeping upper arms completely still, lower the bar toward your forehead.',
              'Stop just before the bar reaches your head — full stretch.',
              "Drive back up to lockout. Don't let the elbows flare wide.",
            ],
          },
        ],
      },
      {
        id: 'pull',
        label: 'Day 2',
        focus: 'Pull',
        equipment: ['Barbell', 'Dumbbells', 'Flat Bench', 'Pull Up Bar'],
        exercises: [
          {
            name: 'Barbell Deadlift',
            muscles: { primary: ['lower-back', 'hamstrings', 'glutes'], secondary: ['upper-back', 'forearms'] },
            sets: 3,
            reps: '5/5/8',
            defaultWeight: 80,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Romanian Deadlift',
              muscles: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
              equipment: ['Dumbbells'],
            },
            description:
              'The most complete pulling exercise there is. Builds the entire posterior chain — lats, traps, erectors, glutes and hamstrings — as well as grip strength.',
            howTo: [
              'Bar over mid-foot, hip-width stance. Grip just outside your legs.',
              "Flatten your back hard, brace your core, and push the floor away — don't think about pulling.",
              'Keep the bar in contact with your legs throughout the lift.',
              'Lock out at the top by squeezing your glutes. Lower under control.',
            ],
          },
          {
            name: 'Bent-Over Barbell Row',
            muscles: { primary: ['upper-back', 'lats'], secondary: ['biceps', 'rear-delts'] },
            sets: 3,
            reps: '8/8/10',
            defaultWeight: 50,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Row',
              muscles: { primary: ['upper-back', 'lats'], secondary: ['biceps', 'rear-delts'] },
              equipment: ['Dumbbells', 'Flat Bench'],
            },
            description:
              'The primary horizontal pull. Builds mid and upper back thickness — rhomboids, traps, and rear delts.',
            howTo: [
              "Hinge to roughly 45°, bar hanging at arm's length.",
              'Pull the bar into your lower stomach, driving elbows back and close to your body.',
              'Squeeze your shoulder blades together hard at the top.',
              'Lower with control. Keep your back flat — never round under load.',
            ],
          },
          {
            name: 'Pull-Ups',
            muscles: { primary: ['lats'], secondary: ['biceps', 'upper-back'] },
            sets: 3,
            reps: '6-10/6-10/6-10',
            defaultWeight: null,
            equipment: ['Pull Up Bar'],
            alternative: {
              name: 'Inverted Rows',
              muscles: { primary: ['upper-back', 'lats'], secondary: ['biceps', 'rear-delts'] },
              equipment: ['Barbell', 'Squat Rack'],
            },
            description:
              "The only vertical pulling movement in the programme. Builds lat width and creates the V-taper. If you can't do 6 clean reps yet, use inverted rows and build toward it.",
            howTo: [
              'Hang from the bar with an overhand grip, slightly wider than shoulder-width.',
              'Initiate by depressing your shoulder blades before bending your elbows.',
              'Pull your chest to the bar, driving your elbows down toward your hips.',
              'Lower slowly and with full control to a dead hang before each rep.',
              'For inverted rows: set barbell in rack at hip height. Hang underneath, body straight, pull chest to bar.',
            ],
          },
          {
            name: 'Barbell Curl',
            muscles: { primary: ['biceps'], secondary: ['forearms'] },
            sets: 3,
            reps: '10/10/12',
            defaultWeight: 25,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Curl',
              muscles: { primary: ['biceps'], secondary: ['forearms'] },
              equipment: ['Dumbbells'],
            },
            description:
              'Primary bicep builder. The barbell allows heavier loading and more consistent progressive overload than dumbbells over time.',
            howTo: [
              'Stand with a shoulder-width underhand grip.',
              'Pin your elbows to your sides — they must not move forward.',
              'Curl the bar up in a smooth arc, squeezing the bicep at the top.',
              "Lower in 2–3 seconds — don't let the bar drop.",
            ],
          },
          {
            name: 'Hammer Curls',
            muscles: { primary: ['biceps'], secondary: ['forearms'] },
            sets: 2,
            reps: '12/12',
            defaultWeight: 12,
            equipment: ['Dumbbells'],
            alternative: null,
            description:
              'Neutral grip curl that targets the brachialis and long head. Adds thickness and fullness that regular curls miss.',
            howTo: [
              'Hold dumbbells with palms facing each other throughout.',
              'Curl both simultaneously or alternate.',
              'Keep elbows pinned. No swinging.',
              'Lower with control — 2 seconds down.',
            ],
          },
          {
            name: 'Rear Delt Fly',
            muscles: { primary: ['rear-delts'] },
            sets: 2,
            reps: '15/15',
            defaultWeight: 6,
            equipment: ['Dumbbells'],
            alternative: null,
            description:
              'Targets the rear deltoid and upper back stabilisers. Essential for shoulder health and balanced development.',
            howTo: [
              'Hinge at the hips until your torso is nearly parallel to the floor.',
              'Hold dumbbells hanging straight down with a slight bend in the elbows.',
              'Raise both arms out to the sides in a wide arc until level with your shoulders.',
              'Squeeze your rear delts at the top. Lower slowly.',
            ],
          },
        ],
      },
      {
        id: 'legs',
        label: 'Day 3',
        focus: 'Legs',
        equipment: ['Barbell', 'Squat Rack', 'Flat Bench', 'Dumbbells'],
        exercises: [
          {
            name: 'Barbell Back Squat',
            muscles: { primary: ['quads'], secondary: ['glutes', 'hamstrings'] },
            sets: 4,
            reps: '5/5/8/10',
            defaultWeight: 70,
            equipment: ['Barbell', 'Squat Rack'],
            alternative: {
              name: 'Dumbbell Goblet Squat',
              muscles: { primary: ['quads'], secondary: ['glutes'] },
              equipment: ['Dumbbells'],
            },
            description: 'The king of leg exercises. Hits quads, glutes, hamstrings and core simultaneously.',
            howTo: [
              'Bar across your upper traps. Feet shoulder-width, toes slightly out.',
              'Brace your core hard before you unrack.',
              'Break at hips and knees simultaneously and squat to at least parallel.',
              'Drive back up through your whole foot, keeping knees tracking over toes.',
            ],
          },
          {
            name: 'Romanian Deadlift',
            muscles: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
            sets: 3,
            reps: '10/10/12',
            defaultWeight: 50,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Romanian Deadlift',
              muscles: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
              equipment: ['Dumbbells'],
            },
            description:
              'Best hamstring and glute builder in the programme. Keeps the posterior chain under load through a long range of motion.',
            howTo: [
              'Stand holding the bar, slight bend in your knees.',
              'Push your hips back — not down. This is a hinge, not a squat.',
              'Lower the bar down your legs until you feel a deep hamstring stretch.',
              'Drive your hips forward to stand, squeezing glutes at the top.',
            ],
          },
          {
            name: 'Bulgarian Split Squat',
            muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
            sets: 3,
            reps: '10/10/12',
            defaultWeight: null,
            equipment: ['Flat Bench', 'Dumbbells'],
            alternative: {
              name: 'Reverse Lunges',
              muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
              equipment: [],
            },
            description: 'Exposes and corrects imbalances between legs while building serious quad and glute strength.',
            howTo: [
              'Rear foot elevated on the bench, front foot stepped well out in front.',
              'Lower your back knee toward the floor, keeping your front shin as vertical as possible.',
              'Drive back up through your front heel. Keep your torso upright.',
              'Hold dumbbells at your sides for added resistance.',
            ],
          },
          {
            name: 'Barbell Hip Thrust',
            muscles: { primary: ['glutes'], secondary: ['hamstrings'] },
            sets: 3,
            reps: '12/12/12',
            defaultWeight: 40,
            equipment: ['Barbell', 'Flat Bench'],
            alternative: {
              name: 'Glute Bridge',
              muscles: { primary: ['glutes'], secondary: ['hamstrings'] },
              equipment: ['Barbell'],
            },
            description:
              'The most direct glute exercise available. Places the glutes under maximum tension at the top where squats and deadlifts fall short.',
            howTo: [
              'Sit on the floor with your upper back against the bench. Roll the bar over your hips — use a pad if needed.',
              'Feet flat on the floor, hip-width apart.',
              'Drive through your heels until your body forms a straight line from knees to shoulders.',
              'Squeeze your glutes hard at the top and hold for 1 second.',
            ],
          },
          {
            name: 'Calf Raises',
            muscles: { primary: ['calves'] },
            sets: 3,
            reps: '15/15/15',
            defaultWeight: 20,
            equipment: ['Barbell', 'Squat Rack'],
            alternative: { name: 'Bodyweight Calf Raises', muscles: { primary: ['calves'] }, equipment: [] },
            description:
              'Calves respond well to volume. Standing with the bar and heels on a plate edge gives a full range that bodyweight alone cannot match.',
            howTo: [
              'Set up like a squat but with your heels on the edge of a weight plate.',
              'Lower your heels as far as possible for a deep stretch.',
              'Drive up onto your toes as high as you can — full contraction at the top.',
              'Pause 1 second at the top. Lower slowly — 3 seconds down.',
            ],
          },
        ],
      },
    ],
  },
  'ppl-v2': {
    id: 'ppl-v2',
    name: 'PPL — Revised',
    shortDescription: 'Revised Push / Pull / Legs — 3 day split',
    days: [
      {
        id: 'push-v2',
        label: 'Day 1',
        focus: 'Push',
        equipment: ['Barbell', 'Dumbbells', 'Flat Bench', 'Incline Bench', 'Cable Machine', 'Chest Fly Machine'],
        exercises: [
          {
            // Requested 6 Sep — "Why cant I substitute this with the chest press on
            // smith machine?" It was added as an `alternative` that day, which was
            // the wrong shape twice over: the ⇄ button only renders for barbell ↔
            // dumbbell pairs, so it never appeared, and an alternative logs under the
            // primary's key, so Smith numbers would have landed in the barbell bench
            // history and dragged the chest strength score with them.
            //
            // Same two-stations-one-movement treatment as the leg presses, the
            // Romanian deadlifts and the shoulder presses. `id` pins the existing
            // slug so every barbell session logged so far stays attached.
            id: 'bench-press',
            slot: 'bench-press',
            name: 'Bench Press',
            muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
            compound: true,
            sets: 3,
            reps: '6-8/6-8/6-8',
            defaultWeight: 50,
            equipment: ['Barbell', 'Flat Bench'],
            description:
              'The anchor of the session. Flat or incline both work — pick one and stay with it for the block so the numbers stay comparable. The machine is the substitute when the rack is taken; note it on the set, because a machine and a free bar at the same number on the plate are not the same lift. Full range of motion takes priority over load here. Progression: when you hit 8 reps on all three sets, add 2.5 kg next session and expect to drop back to 6 reps. Repeat.',
            howTo: [
              'Lie flat (or set the bench to 30°), grip just wider than shoulder-width, shoulder blades pinched together and down.',
              'Lower the bar to your mid-chest under control — 2 seconds down, touch, no bouncing.',
              'Press back up to full lockout, driving your feet into the floor.',
              'If you cannot reach your chest with good form, drop the weight. Range beats load on this one.',
              'Log reps and reps-in-reserve every set — that is what tells you when to add weight.',
            ],
          },
          {
            slot: 'bench-press',
            name: 'Smith Machine Chest Press',
            muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] },
            compound: true,
            sets: 3,
            reps: '6-8/6-8/6-8',
            // Its own history, its own starting number. The Smith bar is counterbalanced
            // and runs on rails, so the same plate figure is not the same lift as a free
            // bar — which is exactly why these are two entries and not one.
            defaultWeight: 50,
            equipment: ['Smith Machine', 'Flat Bench'],
            description:
              'The substitute when the rack is taken, and a lift in its own right. The Smith bar runs a fixed vertical path, so it is a closer stand-in for a barbell press than a seated machine is — but the rails take the stabilising work, so expect the number to run higher than your free-bar bench and do not read across between them. The app keeps the two histories apart for that reason. Progression is the same: 8 reps on all three sets, then add 2.5 kg.',
            howTo: [
              'Set the bench so the bar lands on your mid-chest, not your throat — slide it before you load up.',
              'Grip just wider than shoulder-width, shoulder blades pinched together and down.',
              'Twist the bar to unrack, lower to your chest over 2 seconds, touch, no bounce.',
              'Press to lockout. If the path feels wrong at the bottom, move the bench, not your shoulders.',
              'Re-rack by twisting back — check the hooks have caught before you let go.',
            ],
          },
          {
            // Chest joined shoulders and arms as a size goal on 18 Sep. Volume was not
            // the gap — 8 direct chest sets a Push day was already plenty in a deficit —
            // the ANGLE was: flat bench, flat push-ups, flyes, and nothing for the upper
            // chest he felt working on 14 Sep. This replaced Push-Ups, which had sat at
            // 15/15 for four sessions and could not progress at 88 kg bodyweight.
            //
            // 30 kg is PAIR TOTAL (15 a hand) and deliberately light — an estimate off
            // flat bench says 34-40, but badly-guessed accessory loads set too heavy are
            // what caused the August problem. The first session calibrates it, and the
            // first logged session seeds every later pre-fill, so log it as a pair.
            //
            // Third press on Push (bench, incline, shoulder press). Incline, not overhead,
            // so not the impingement position — but if the left cuff ache comes back,
            // this is the new variable.
            name: 'Incline Dumbbell Press',
            muscles: { primary: ['chest'], secondary: ['front-delts', 'triceps'] },
            compound: true,
            sets: 3,
            reps: '8-12/8-12/8-12',
            defaultWeight: 30,
            equipment: ['Dumbbells', 'Incline Bench'],
            alternative: null,
            description:
              'Upper-chest work after the flat press. Bench at about 30° — steeper turns it into a shoulder press. Weights are the PAIR TOTAL, like every dumbbell in this app: 30 means a 15 in each hand. Start light and let the first session tell you the number. Progression: total reps across the three sets within one of 36 at the same weight, then go up 2 kg.',
            howTo: [
              'Set the bench to about 30°. Kick the dumbbells up off your knees as you lie back.',
              'Shoulder blades back and down, feet driving into the floor — the same setup that moved your flat bench.',
              'Lower under control until the dumbbells are level with your upper chest and you feel the stretch, elbows about 45° from your body.',
              'Press up and slightly in, without clanging the dumbbells together at the top.',
              'Log the pair total. If the front of the shoulder complains, drop the angle before you drop the weight.',
            ],
          },
          {
            name: 'Chest Flyes',
            muscles: { primary: ['chest'] },
            sets: 3,
            reps: '10-12/10-12/10-12',
            defaultWeight: 40,
            equipment: ['Chest Fly Machine'],
            alternative: {
              name: 'Incline Dumbbell Flys',
              muscles: { primary: ['chest'] },
              equipment: ['Dumbbells', 'Incline Bench'],
              defaultWeight: 20,
            },
            description:
              'Isolation after the press. Machine or cable both keep tension on the pec through the whole arc, which free weights lose at the top. Chase the squeeze, not the stack. Note the weights are not comparable: the machine figure is a stack, the dumbbell figure is per hand. If it feels easy, slow the eccentric and get a deeper stretch before adding load — a heavy fly quietly turns into a press.',
            howTo: [
              'Set the handles at roughly chest height with a slight bend in the elbows.',
              'Bring your hands together in a wide arc, as if hugging a tree.',
              'Squeeze hard for a full second at the point of peak contraction.',
              'Open back out slowly until you feel a deep stretch across the chest — 3 seconds back.',
              'Stack numbers are machine-specific — 40 kg is calibrated to a Technogym pec deck. Expect a different number elsewhere.',
            ],
          },
          {
            // 20 Sep. Side delts were the least-trained muscle on the goal list —
            // 6 direct sets a calendar week against 18 for biceps and 18 for chest,
            // on the muscle named FIRST. Now on Push and Pull both, which doubles it
            // to 12 without adding a session or touching anything else.
            //
            // Cable is the better movement: a dumbbell lateral has almost no tension
            // at the bottom, where the delt is stretched, and that is the half of the
            // range that grows it. The dumbbell version stays as the slot mate — it
            // is the one he was coached on, and form matters more here than on
            // anything else in the programme, so there has to be a version he can do
            // properly when the cable station is taken.
            //
            // Two entries, not an `alternative`: a stack number and a pair total are
            // not the same load, and an alternative logs under the primary's key —
            // the bug-28 shape. The cable was previously an alternative here and
            // would have been silently landing in the dumbbell history.
            id: 'cable-lateral-raise-v2',
            slot: 'lateral-raise',
            historyGroup: 'cable-lateral-raises',
            name: 'Cable Lateral Raise',
            muscles: { primary: ['side-delts'] },
            sets: 3,
            reps: '12-15/12-15/12-15',
            // No default. The first session seeds every future pre-fill, and the
            // right number here is whatever the lightest useful pin turns out to be.
            // `id` is deliberately NOT the old `cable-lateral-raises` slug — those
            // sets were logged before 30 Aug on a different setup and should stay
            // buried rather than pre-filling a movement he is relearning.
            defaultWeight: null,
            increment: 1.5,
            equipment: ['Cable Machine'],
            description:
              'Side delts, one arm at a time, with the cable taking over the job the dumbbell cannot do — holding tension at the bottom of the range where the delt is stretched. That stretched position is where most of the growth stimulus lives, and it is the reason this is worth the extra station. Start on the lightest useful pin and work up across sessions; the number matters far less than the path.',
            howTo: [
              'Set the pulley at the bottom. Stand side-on, take the handle in the outside hand, and step away until there is tension with the arm hanging across your body.',
              'Raise out and slightly FORWARD of your body — around 45°, not directly out to the side. Lead with the elbow, slight bend held throughout.',
              'Stop at shoulder height. Going higher hands the work to your traps, which is the whole thing to avoid.',
              'Lower in 3 seconds and let the arm come fully across at the bottom — that is the part the dumbbell version loses.',
              'Finish all reps on one side, swap, then rest once. Stack numbers are machine-specific, so this figure does not read across to anything else.',
            ],
          },
          {
            // `id` pins the existing slug so every lateral raise logged since August
            // stays attached and the PB survives. Load drops 16 → 12 PAIR TOTAL
            // because the lean changes the lift: leaning out lengthens the moment arm
            // at the bottom, so the same bell is harder in exactly the range being
            // added. Under-setting an accessory is the cheap mistake here; over-
            // setting one is what caused the August problem.
            id: 'dumbbell-lateral-raises',
            slot: 'lateral-raise',
            historyGroup: 'dumbbell-lateral-raises',
            name: 'Dumbbell Lateral Raises',
            muscles: { primary: ['side-delts'] },
            sets: 3,
            reps: '12-15/12-15/12-15',
            defaultWeight: 12,
            increment: 2,
            equipment: ['Dumbbells'],
            description:
              'The version to use when the cable station is taken. Leaning away from a rack upright is what buys back the bottom of the range — stood upright, a dumbbell lateral has almost no tension until the arm is already halfway up. Note 12 kg is the PAIR total, 6 kg in each hand, and it is deliberately below the 16 kg used stood upright: the lean makes the same bell heavier where it counts.',
            howTo: [
              'Hold a rack upright with one hand, feet close to its base, and lean out 15–20° so the working arm hangs clear of your body.',
              'Raise out and slightly forward — about 45° from straight out to the side. Lead with the elbow, slight bend held throughout.',
              'Stop at shoulder height. No higher, or your traps take it.',
              'Lower in 3 seconds and let the arm hang fully at the bottom — that hang is the entire point of leaning.',
              'Finish all reps on one side, swap hands, then rest once.',
            ],
          },
          {
            // Same two-stations-one-movement shape as the leg presses and the
            // Romanian deadlifts. He moved to a machine on 10 Sep — "Im using a
            // shoulder press machine now ... I can easily add more weight" — and
            // 25 kg of dumbbells is not 45 kg of stack. `id` pins the original slug
            // so every dumbbell session stays attached; `migrateShoulderPressSplit`
            // moves the 10 and 14 Sep sets to the machine entry.
            id: 'seated-dumbbell-shoulder-press',
            slot: 'shoulder-press',
            name: 'Seated Dumbbell Shoulder Press',
            muscles: { primary: ['front-delts'], secondary: ['triceps', 'side-delts'] },
            compound: true,
            sets: 2,
            reps: '8-10/8-10',
            defaultWeight: 25,
            equipment: ['Dumbbells', 'Incline Bench'],
            alternative: {
              name: 'Barbell Overhead Press',
              muscles: { primary: ['front-delts'], secondary: ['triceps', 'side-delts'] },
              equipment: ['Barbell', 'Squat Rack'],
            },
            description:
              'Vertical pressing for the front and side delts. Setting the bench slightly inclined rather than fully upright reduces the impingement risk at the top of the press. Only two sets — the delts have already worked on the bench and raises. Weight is the PAIR total: 25 kg means two 12.5 kg dumbbells.',
            howTo: [
              'Set the backrest to around 75–80° — inclined, not bolt upright.',
              'Start with the dumbbells at shoulder height, palms facing forward.',
              'Press up and slightly in until the dumbbells nearly touch overhead.',
              'Lower with control to shoulder height. Brace your core hard so you do not arch off the bench.',
            ],
          },
          {
            slot: 'shoulder-press',
            name: 'Shoulder Press (Machine)',
            muscles: { primary: ['front-delts'], secondary: ['triceps', 'side-delts'] },
            compound: true,
            // THREE sets, unlike the dumbbell version's two. Asked for on 10 Sep —
            // "Ill also like a 3 set to add to this workout rather than 2 sets" —
            // and on 14 Sep he added the third by hand because the app would not
            // let him log it. The dumbbell entry stays at two so its own history
            // does not start reporting a missing set that was never programmed.
            sets: 3,
            reps: '8-10/8-10/8-10',
            defaultWeight: 45,
            increment: 5,
            equipment: ['Shoulder Press Machine'],
            alternative: null,
            description:
              'The pin-loaded overhead press, used from 10 Sep. A supported back and a fixed path mean you can load it properly — his words: "it seems easier to do the same weights on this and I can easily add more weight now." Stack numbers are NOT the same lift as a pair of dumbbells, so this keeps its own history and the ⇄ switches between them. Kinder on a grumbling shoulder than a barbell would be.',
            howTo: [
              'Set the seat so the handles start at about shoulder height, not above.',
              'Press up and slightly in, stopping just short of locking the elbows out.',
              'Lower under control to the start — do not let the stack bang down.',
              'If the shoulder complains at the top, reduce the range before you reduce the weight.',
              'Log against THIS entry only when you used the machine.',
            ],
          },
          {
            name: 'Cable Tricep Pushdowns',
            muscles: { primary: ['triceps'] },
            sets: 3,
            reps: '10-12/10-12/10-12',
            defaultWeight: 18,
            equipment: ['Cable Machine'],
            alternative: {
              name: 'Resistance Band Pushdowns',
              muscles: { primary: ['triceps'] },
              equipment: ['Resistance Bands'],
            },
            description:
              'Hits the lateral and medial heads of the tricep with the elbow at your side. Rope or straight bar both work — the rope lets you spread at the bottom for a harder contraction.',
            howTo: [
              'Set the cable high. Elbows pinned to your sides, forearms roughly parallel to the floor.',
              'Push down to full lockout, keeping the upper arms completely still.',
              'With a rope, spread your hands apart at the bottom and squeeze.',
              'Return under control until your forearms are just past parallel. Only the elbow joint moves.',
              'Tested at 15 kg on an Eleiko stack (3 kg plates). Jumps are coarse at this load — add reps before you add a plate.',
            ],
          },
          {
            name: 'Cable Overhead Tricep Extensions',
            muscles: { primary: ['triceps'] },
            sets: 3,
            reps: '10-12/10-12/10-12',
            defaultWeight: 15,
            equipment: ['Cable Machine'],
            alternative: {
              name: 'Dumbbell Overhead Tricep Extension',
              muscles: { primary: ['triceps'] },
              equipment: ['Dumbbells'],
            },
            description:
              'Targets the long head of the tricep, which pushdowns barely reach. The long head only fully stretches with the arm overhead, and it makes up around half of total tricep mass.',
            howTo: [
              'Set the cable at mid height. Face away from the stack, rope held overhead, one foot forward for balance.',
              'Keep your upper arms locked beside your ears throughout.',
              'Extend forward and up to full lockout, squeezing at the top.',
              'Let the rope pull your hands back behind your head for a deep stretch — that stretch is the point of the exercise.',
              'Tested at 12 kg for 10 reps at the end of a session. Sits in range — hold here until 12 reps come easily.',
            ],
          },
          {
            name: 'Optional Finisher — Weighted Crunches',
            // The same finisher runs on Push and on Pull. Storage stays per day —
            // he trains both inside one programme week, so a shared key would have
            // one session overwrite the other — but pre-fills, the weight
            // suggestion and the graphs read them as ONE timeline. See
            // utils/history.js. Raised 4 Sep: "I went up in kg yesterday and it
            // doesnt show here ... these should be connected".
            historyGroup: 'weighted-crunches',
            muscles: { primary: ['abs'] },
            sets: 3,
            reps: '12-15/12-15/12-15',
            defaultWeight: 10,
            // Equipment ceiling, stated 18 Sep: "The dymbells i can use that are also safe
            // for this exercise only goes up to 20kg." At 20 kg a full house is the end of
            // the road for load, not a cue to add it — nextTarget, isReadyToProgress and
            // exportFlags all stop suggesting an increase here. Raise it if he gets a
            // heavier safe option.
            maxWeight: 20,
            equipment: ['Dumbbells'],
            alternative: { name: 'Bodyweight Crunches', muscles: { primary: ['abs'] }, equipment: [] },
            description:
              'Optional — skip freely on a low-energy day. Swap for 10–15 minutes of steady-state cardio instead if that suits the session better. Logged as an exercise so the volume is tracked when you do it.',
            howTo: [
              'Lie on your back, knees bent, holding a dumbbell or plate against your chest.',
              'Curl your shoulder blades off the floor by shortening the distance between ribs and hips.',
              'Squeeze hard at the top — this is a short range movement, not a sit-up.',
              'Lower slowly. Alternative: 10–15 minutes of cardio at a conversational pace.',
            ],
          },
        ],
      },
      {
        id: 'pull-v2',
        label: 'Day 2',
        focus: 'Pull',
        equipment: ['Dumbbells', 'Incline Bench', 'Cable Machine', 'Assisted Chin/Dip Machine', 'Lat Pulldown Machine'],
        exercises: [
          {
            // 19 Sep: replaced Inverted Barbell Rows at his request — "a better
            // exercise to progress on", it sits next to the assisted chin machine so
            // the two are a quick switch, and he had come to hate the inverted rows.
            // Inverted rows were bodyweight + body angle with no reproducible load
            // (the pin was never logged); a cable stack progresses in real steps.
            // The inverted-row history is still in storage and the JSON backup,
            // under its own key — it simply no longer has a tile to show on.
            name: 'Seated Cable Row',
            muscles: { primary: ['upper-back', 'lats'], secondary: ['biceps', 'rear-delts'] },
            compound: true,
            sets: 3,
            reps: '8-12/8-12/8-12',
            // Deliberately light — the first logged session seeds every pre-fill,
            // and an over-estimated accessory load is what went wrong in August.
            // Chin-ups are at ~60 kg effective; this should end up above that.
            defaultWeight: 40,
            // ASSUMPTION until checked in the gym: a separate selectorised row
            // station, typically 5 kg plates — not the 1.5 kg twin-cable stack.
            increment: 5,
            equipment: ['Cable Machine'],
            alternative: {
              name: 'Chest Supported Row',
              muscles: { primary: ['upper-back', 'lats'], secondary: ['biceps', 'rear-delts'] },
              equipment: ['Chest Supported Row Machine'],
            },
            description:
              'Horizontal pulling for upper-back thickness, on a stack so every session can be matched or beaten by a real number. Right next to the assisted chin machine, so the two run back to back.',
            howTo: [
              'Sit tall with feet on the platform and knees slightly bent. Close-grip V-handle unless the station only has a bar.',
              'Start with arms long and shoulder blades pulled forward — a real stretch across the upper back.',
              'Pull the handle to your lower ribs by driving the elbows back, chest up. Squeeze the shoulder blades together for a beat.',
              'Keep the torso still. A small lean is fine; rocking back to move the weight means it is too heavy.',
              'Return slowly to the full stretch before the next rep.',
              'Log the number on the stack. First session at 40 kg is deliberately light — let it set the starting point.',
            ],
          },
          {
            // Renamed from 'Assisted Chin-Ups' (it is done overhand, as a pull-up).
            // `id` pins the old slug so every logged set stays attached.
            id: 'assisted-chin-ups',
            name: 'Assisted Pull-Ups',
            muscles: { primary: ['lats'], secondary: ['biceps', 'upper-back'] },
            compound: true,
            // The stack is a COUNTERWEIGHT: more of it means less work. Logged as
            // the assist read off the machine; the app derives bodyweight minus
            // assist as the effective load. See utils/loads.js.
            assisted: true,
            defaultAssist: 49,
            sets: 3,
            reps: '8-12/8-12/8-12',
            defaultWeight: 40,
            equipment: ['Assisted Chin/Dip Machine'],
            alternative: {
              name: 'Lat Pulldowns',
              muscles: { primary: ['lats'], secondary: ['biceps', 'upper-back'] },
              equipment: ['Lat Pulldown Machine'],
              defaultWeight: null,
            },
            description:
              'Vertical pulling for lat width. Chosen over the lat pulldown because it trains the same pattern while progressing toward unassisted pull-ups, which a pulldown never does — and the pulldown is always occupied. Swap to the pulldown from the exercise card if the machine is taken.',
            howTo: [
              'Kneel on the pad, hands slightly wider than shoulder-width, palms facing away.',
              'Pull your chest toward the bar leading with the elbows, chest up throughout.',
              'Squeeze the lats hard at the top — think elbows into your back pockets.',
              'Lower under control to a full stretch. Do not let the pad throw you back up.',
              'Log the ASSIST — the number the pin is set to. The app subtracts it from your bodyweight, so the load it stores climbs as you get stronger.',
              'This stack is in KILOS, not pounds. A 49 setting is 49 kg of counterweight, so at 89 kg bodyweight you are lifting 40 kg, not 67.',
              'Tested at 49 assist (40 kg effective): 12/11/9 reps. Drop the assist one plate when 12 reps come easily on all three sets.',
            ],
          },
          {
            name: 'Dumbbell Rear Delt Flys',
            muscles: { primary: ['rear-delts'] },
            sets: 3,
            reps: '12-15/12-15/12-15',
            defaultWeight: 12,
            equipment: ['Dumbbells'],
            alternative: {
              name: 'Cable Rear Delt Fly',
              muscles: { primary: ['rear-delts'] },
              equipment: ['Cable Machine'],
            },
            description:
              'Rear delts, the half of the shoulder that push day never reaches. Standing bent-over, chest-supported on an incline bench, or on cables all work — the bench version takes momentum out of it. Start lighter than feels right.',
            howTo: [
              'Chest down on an incline bench set to about 30°. Bench-supported takes the momentum out of it and is how these are programmed.',
              'Dumbbells hanging straight down, slight bend in the elbows held throughout.',
              'Raise out to the sides in a wide arc, leading with the elbows, until level with your torso.',
              'These need almost no weight to work. If your traps are doing the lifting, go lighter.',
              'Note: 12 kg is the PAIR total — 6 kg in each hand. Sitting just under the lateral raise is right; rear delts are normally the weaker of the two.',
            ],
          },
          {
            // 20 Sep. The second half of the side-delt fix — see the long note on the
            // Push entry. Placed next to the rear delt flys so both dumbbell delt
            // movements sit together and the cable station is one trip.
            //
            // `historyGroup` is what keeps this and the Push entry one timeline:
            // storage stays per day (he trains both inside one programme week, so a
            // shared key would have one session overwrite the other) while pre-fills,
            // the weight suggestion and the graphs read across. Exactly the weighted
            // crunch arrangement, and for the same reason it was needed there.
            id: 'cable-lateral-raise-v2',
            slot: 'lateral-raise',
            historyGroup: 'cable-lateral-raises',
            name: 'Cable Lateral Raise',
            muscles: { primary: ['side-delts'] },
            sets: 3,
            reps: '12-15/12-15/12-15',
            defaultWeight: null,
            increment: 1.5,
            equipment: ['Cable Machine'],
            description:
              'Side delts, one arm at a time, with the cable taking over the job the dumbbell cannot do — holding tension at the bottom of the range where the delt is stretched. That stretched position is where most of the growth stimulus lives, and it is the reason this is worth the extra station. Start on the lightest useful pin and work up across sessions; the number matters far less than the path.',
            howTo: [
              'Set the pulley at the bottom. Stand side-on, take the handle in the outside hand, and step away until there is tension with the arm hanging across your body.',
              'Raise out and slightly FORWARD of your body — around 45°, not directly out to the side. Lead with the elbow, slight bend held throughout.',
              'Stop at shoulder height. Going higher hands the work to your traps, which is the whole thing to avoid.',
              'Lower in 3 seconds and let the arm come fully across at the bottom — that is the part the dumbbell version loses.',
              'Finish all reps on one side, swap, then rest once. Stack numbers are machine-specific, so this figure does not read across to anything else.',
            ],
          },
          {
            id: 'dumbbell-lateral-raises',
            slot: 'lateral-raise',
            historyGroup: 'dumbbell-lateral-raises',
            name: 'Dumbbell Lateral Raises',
            muscles: { primary: ['side-delts'] },
            sets: 3,
            reps: '12-15/12-15/12-15',
            defaultWeight: 12,
            increment: 2,
            equipment: ['Dumbbells'],
            description:
              'The version to use when the cable station is taken. Leaning away from a rack upright is what buys back the bottom of the range — stood upright, a dumbbell lateral has almost no tension until the arm is already halfway up. Note 12 kg is the PAIR total, 6 kg in each hand, and it is deliberately below the 16 kg used stood upright: the lean makes the same bell heavier where it counts.',
            howTo: [
              'Hold a rack upright with one hand, feet close to its base, and lean out 15–20° so the working arm hangs clear of your body.',
              'Raise out and slightly forward — about 45° from straight out to the side. Lead with the elbow, slight bend held throughout.',
              'Stop at shoulder height. No higher, or your traps take it.',
              'Lower in 3 seconds and let the arm hang fully at the bottom — that hang is the entire point of leaning.',
              'Finish all reps on one side, swap hands, then rest once.',
            ],
          },
          {
            // Renamed from 'Barbell Curls' — these have always been done with
            // dumbbells. `id` pins the old slug so the sets already logged stay
            // attached to this exercise. See utils/setKeys.js.
            id: 'barbell-curls',
            name: 'Dumbbell Curls',
            muscles: { primary: ['biceps'], secondary: ['forearms'] },
            sets: 3,
            reps: '8-12/8-12/8-12',
            defaultWeight: 20,
            equipment: ['Dumbbells'],
            alternative: {
              name: 'Barbell Curls',
              muscles: { primary: ['biceps'], secondary: ['forearms'] },
              equipment: ['Barbell'],
            },
            description:
              'Primary biceps mass builder, and the heaviest of the three curl variations, which is why it goes first while you are fresh. Dumbbells let each arm work independently so the stronger one cannot carry the set.',
            howTo: [
              'Stand tall, a dumbbell in each hand, elbows tucked at your sides.',
              'Curl up by bending the elbow only — no swinging, no hip drive.',
              'Squeeze hard at the top without letting the elbows drift forward.',
              'Lower in 3 seconds to a full stretch. The lowering phase builds more than the lift.',
              'Log the PAIR total: 10 kg in each hand is 20, not 10.',
            ],
          },
          {
            name: 'Crossbody Hammer Curls',
            muscles: { primary: ['biceps'], secondary: ['forearms'] },
            // The rep convention changed here: one arm = one rep now, both arms = one
            // rep before. Reps either side of 28 Aug are different units, so anything
            // COMPARING sessions ignores the earlier ones. The graph still shows them —
            // they were real work, just measured on a different ruler.
            compareFrom: '2026-08-28',
            sets: 3,
            reps: '10-12/10-12/10-12',
            defaultWeight: 16,
            equipment: ['Dumbbells'],
            alternative: null,
            description:
              'Neutral grip across the body targets the brachialis, which sits underneath the biceps and pushes it up as it grows. Also builds forearm thickness.',
            howTo: [
              'Dumbbells at your sides, palms facing in. Elbows pinned.',
              'Curl one dumbbell across your body toward the opposite shoulder.',
              'Squeeze at the top, lower slowly, then alternate arms.',
              'Keep your torso completely still — no leaning to help the weight up.',
            ],
          },
          {
            name: 'Incline Bench Curls',
            muscles: { primary: ['biceps'] },
            sets: 3,
            reps: '10-12/10-12/10-12',
            defaultWeight: 12,
            equipment: ['Dumbbells', 'Incline Bench'],
            alternative: null,
            description:
              'Lying back on an incline puts your arms behind your torso, which stretches the long head of the biceps under load. That stretched position is what this variation gives you and the other two do not — expect to use noticeably less weight.',
            howTo: [
              'Lie back on a bench set to 45–60°, arms hanging straight down.',
              'Let the biceps stretch fully at the bottom — that is the whole point of the exercise.',
              'Curl up without letting the elbows travel forward.',
              'Go light. The stretched position is far harder than a standing curl.',
            ],
          },
          {
            name: 'Dumbbell Shrugs',
            muscles: { primary: ['upper-back'], secondary: ['forearms'] },
            sets: 2,
            reps: '12-15/12-15',
            defaultWeight: 50,
            equipment: ['Dumbbells'],
            alternative: {
              name: 'Barbell Shrugs',
              muscles: { primary: ['upper-back'], secondary: ['forearms'] },
              equipment: ['Barbell'],
            },
            description:
              'Upper traps. Straight up and down — rolling the shoulders adds nothing and grinds the joint. Two sets is plenty given the traps already worked on the rows.',
            howTo: [
              'Hold a dumbbell in each hand at your sides, arms straight.',
              'Shrug your shoulders straight up toward your ears as high as they will go.',
              'Pause for a full second at the top — the pause is what makes this work.',
              'Lower under control to a full stretch. No rolling.',
            ],
          },
          {
            name: 'Optional Finisher — Weighted Crunches',
            // The same finisher runs on Push and on Pull. Storage stays per day —
            // he trains both inside one programme week, so a shared key would have
            // one session overwrite the other — but pre-fills, the weight
            // suggestion and the graphs read them as ONE timeline. See
            // utils/history.js. Raised 4 Sep: "I went up in kg yesterday and it
            // doesnt show here ... these should be connected".
            historyGroup: 'weighted-crunches',
            muscles: { primary: ['abs'] },
            sets: 3,
            reps: '12-15/12-15/12-15',
            defaultWeight: 10,
            // Equipment ceiling, stated 18 Sep: "The dymbells i can use that are also safe
            // for this exercise only goes up to 20kg." At 20 kg a full house is the end of
            // the road for load, not a cue to add it — nextTarget, isReadyToProgress and
            // exportFlags all stop suggesting an increase here. Raise it if he gets a
            // heavier safe option.
            maxWeight: 20,
            equipment: ['Dumbbells'],
            alternative: { name: 'Bodyweight Crunches', muscles: { primary: ['abs'] }, equipment: [] },
            description:
              'Optional — skip freely on a low-energy day. Same finisher as push day, 10 kg tested. Swap for 10–15 minutes of steady cardio if that suits the session better.',
            howTo: [
              'Lie on your back, knees bent, holding a dumbbell or plate against your chest.',
              'Curl your shoulder blades off the floor by shortening the distance between ribs and hips.',
              'Squeeze hard at the top — this is a short range movement, not a sit-up.',
              'Lower slowly. Alternative: 10–15 minutes of cardio at a conversational pace.',
            ],
          },
        ],
      },
      {
        id: 'legs-v2',
        label: 'Day 3',
        focus: 'Legs',
        equipment: ['Leg Press Machine', 'Hack Squat Machine', 'Leg Extension Machine', 'Leg Curl Machine'],
        exercises: [
          {
            // Two different leg presses, and Robbie uses whichever is free. They are
            // SEPARATE exercises rather than one with an alternative, because an
            // alternative shares the storage slot by design (see setKeys.js) and these
            // two do not share a scale: the same plate number is a different load once
            // sled weight and lever ratio differ. One line through both read as a
            // 30 kg jump when he had only changed machines.
            //
            // `slot` marks them as the same choice. The export reads it so the unused
            // one is not reported as skipped, and the day list reads it so both render
            // as ONE tile with a ⇄ between them (src/utils/slots.js) — two cards read
            // as two things to do, and made Legs look like seven movements, not six.
            id: 'leg-press',
            slot: 'leg-press',
            name: 'Leg Press (Plates)',
            muscles: { primary: ['quads'], secondary: ['glutes'] },
            compound: true,
            sets: 3,
            reps: '8-12/8-12/8-12',
            defaultWeight: 100,
            // Measured by Robbie 1 Sep — "5kg lowest weight". It was 2.5 on the
            // assumption that a plate-loaded sled takes barbell plates; it does not.
            increment: 5,
            equipment: ['Leg Press Machine'],
            alternative: {
              name: 'Goblet Squats',
              muscles: { primary: ['quads'], secondary: ['glutes'] },
              equipment: ['Dumbbells'],
            },
            description:
              'The plate-loaded leg press — the one you load yourself. One tile, two machines: use the ⇄ to switch to the selectorised one when this is taken. Their numbers are NOT interchangeable, so each keeps its own history. Last logged here: 12 reps at 100 kg.',
            howTo: [
              'Feet shoulder-width on the platform, mid-foot placement, knees tracking over toes.',
              'Lower under control until your knees reach roughly 90° — deeper if your hips allow it without your lower back rounding off the pad.',
              'Press through the whole foot, not the toes. Stop just short of locking the knees out.',
              'Never let your lower back peel off the backrest — that is the one thing that hurts people on this machine.',
            ],
          },
          {
            slot: 'leg-press',
            name: 'Leg Press (Machine)',
            muscles: { primary: ['quads'], secondary: ['glutes'] },
            compound: true,
            sets: 3,
            reps: '8-12/8-12/8-12',
            defaultWeight: 130,
            increment: 10,
            equipment: ['Leg Press Machine'],
            alternative: null,
            description:
              'The selectorised leg press — the one with the pin. Used when the plate-loaded one is taken; the ⇄ on the tile switches between them. Its stack numbers mean something different from plates on the other machine, which is why it keeps its own history rather than sharing a line. Last logged here: 130 kg for 13 and 12 reps.',
            howTo: [
              'Feet shoulder-width on the platform, mid-foot placement, knees tracking over toes.',
              'Lower under control until your knees reach roughly 90 degrees — deeper if your hips allow it without your lower back rounding off the pad.',
              'Press through the whole foot, not the toes. Stop just short of locking the knees out.',
              'Never let your lower back peel off the backrest — that is the one thing that hurts people on this machine.',
              'Log against THIS entry only when you used the pin-loaded machine.',
            ],
          },
          {
            // Same two-machines-one-movement shape as the leg press above, and for
            // the same reason: 1 Sep was logged on a dedicated deadlift machine at
            // 80 kg against 55 kg on the bar, and one line through both reads as a
            // 25 kg jump that never happened. `id` pins the original slug so every
            // barbell session stays attached; `migrateRdlMachineSplit` moves the
            // 1 Sep sets to the machine entry.
            id: 'romanian-deadlifts',
            slot: 'rdl',
            name: 'Romanian Deadlifts (Barbell)',
            muscles: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
            compound: true,
            sets: 3,
            reps: '10-12/10-12/10-12',
            defaultWeight: 55,
            equipment: ['Barbell'],
            alternative: {
              name: 'Dumbbell Romanian Deadlifts',
              muscles: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
              equipment: ['Dumbbells'],
              defaultWeight: 40,
            },
            description:
              'The only hip hinge in the programme. Leg press, hack squats and extensions are all knee-dominant, so without this your glutes, hamstrings and lower back go almost untrained across the whole week. Starts deliberately light — 40 kg is about grooving the pattern, not loading it.',
            howTo: [
              'Stand with the bar at your thighs, feet hip-width, slight bend in the knees held throughout.',
              'Push your hips back and let the bar travel down your thighs, keeping it in contact with your legs.',
              'Stop when you feel a strong hamstring stretch — usually mid-shin. Back stays flat the whole way.',
              'Drive your hips forward to stand, squeezing the glutes at the top. Do not lean back at lockout.',
              'This is a hinge, not a squat. Hips go back, not down. If your back rounds at any point, the weight is too heavy.',
              'Add weight slowly — the lower back adapts more slowly than the muscles that move it.',
            ],
          },
          {
            slot: 'rdl',
            name: 'Romanian Deadlifts (Machine)',
            muscles: { primary: ['hamstrings'], secondary: ['glutes', 'lower-back'] },
            compound: true,
            sets: 3,
            reps: '10-12/10-12/10-12',
            defaultWeight: 70,
            equipment: ['Deadlift Machine'],
            alternative: null,
            description:
              'The dedicated deadlift machine, used 1 Sep. Its numbers are NOT the same lift as the barbell — the machine carries the bar path for you — so it keeps its own history and the ⇄ switches between them. 80 kg gave 10/8/7 and grip was the limit; his own call was 70 next time.',
            howTo: [
              'Set the handles so the start position has your back flat and your hips pushed back.',
              'Hinge at the hips, knees softly bent and held there, and let the load travel down your thighs.',
              'Stop at a strong hamstring stretch — the machine will let you go further than your back wants to.',
              'Drive the hips forward to finish. Straps are worth it here: grip gave out before the hamstrings did.',
              'Log against THIS entry only when you used the machine.',
            ],
          },
          {
            name: 'Hack Squats',
            muscles: { primary: ['quads'], secondary: ['glutes'] },
            compound: true,
            sets: 3,
            reps: '8-12/8-12/8-12',
            defaultWeight: 40,
            // The carriage weighs 48 kg empty — measured 12 Sep: "Apparently the
            // machine is 48kg without weights on it, I only counted the weights i
            // added." Every hack squat in the log counts ADDED PLATES ONLY, so the
            // real load is this much higher. Kept as a separate field rather than
            // folded into the logged number, because rewriting the history would
            // break every comparison in it. 100 kg logged is 148 kg pressed.
            sledWeight: 48,
            equipment: ['Hack Squat Machine'],
            alternative: {
              name: 'Barbell Back Squat',
              muscles: { primary: ['quads'], secondary: ['glutes', 'hamstrings'] },
              equipment: ['Barbell', 'Squat Rack'],
            },
            description:
              'Quad-dominant squatting with the machine supporting your spine. The fixed path lets you push the legs hard without the balance and lower-back demands of a free-weight squat — useful while your tissue catches up. LOG THE ADDED PLATES ONLY, as you always have — the carriage is 48 kg empty, so 100 kg on the log is 148 kg moved.',
            howTo: [
              'Shoulders under the pads, back flat against the backrest, feet shoulder-width and slightly forward.',
              'Lower under control to at least parallel, keeping your whole back in contact with the pad.',
              'Drive up through your heels without locking out hard at the top.',
              'Feet higher on the platform shifts work to the glutes and hamstrings; lower emphasises the quads.',
            ],
          },
          {
            name: 'Leg Extensions',
            muscles: { primary: ['quads'] },
            sets: 3,
            reps: '10-12/10-12/10-12',
            defaultWeight: 30,
            equipment: ['Leg Extension Machine'],
            alternative: { name: 'Sissy Squats', muscles: { primary: ['quads'] }, equipment: [] },
            description:
              'Isolates the quads at full contraction, which no squat pattern reaches. Chase the squeeze rather than the stack — this one punishes ego loading with knee ache.',
            howTo: [
              'Seated, pad across the shins just above the ankle, back against the rest.',
              'Extend fully and squeeze hard for a full second at the top.',
              'Lower in 3 seconds. Do not let the stack crash down.',
              'If your hips lift off the seat, the weight is too heavy.',
            ],
          },
          {
            name: 'Leg Curls',
            muscles: { primary: ['hamstrings'] },
            sets: 3,
            reps: '10-12/10-12/10-12',
            defaultWeight: 30,
            equipment: ['Leg Curl Machine'],
            alternative: { name: 'Nordic Curls', muscles: { primary: ['hamstrings'] }, equipment: [] },
            description:
              'The only direct hamstring work on the day. Presses and squats are almost entirely quad-dominant, so without this the day is unbalanced — hamstrings matter for knee health, not just symmetry.',
            howTo: [
              'Pad just above the heels, hips flat against the bench or seat.',
              'Curl your heels toward your glutes, squeezing at the point of full contraction.',
              'Lower slowly to a full stretch — 3 seconds down.',
              'Keep your hips down throughout. Lifting them is how people cheat this.',
            ],
          },
          {
            name: 'Calf Press',
            muscles: { primary: ['calves'] },
            sets: 3,
            reps: '12-15/12-15/12-15',
            defaultWeight: 130,
            equipment: ['Calf Press Machine'],
            alternative: {
              name: 'Calf Press on Leg Press',
              muscles: { primary: ['calves'] },
              equipment: ['Leg Press Machine'],
              defaultWeight: null,
            },
            description:
              'Dedicated calf press machine if your gym has one. If not it substitutes automatically to the leg press: slide down so only the balls of your feet are on the platform. Calves respond to full range and a hard stretch far more than to load.',
            howTo: [
              'Balls of the feet on the bottom edge of the platform, legs almost straight but not locked.',
              'Let your heels travel down as far as they will go — that deep stretch is the point.',
              'Press up onto your toes as high as possible and pause a full second at the top.',
              'Lower over 3 seconds. Safety catches engaged — do not do this with the sled unsupported.',
            ],
          },
        ],
      },
    ],
  },

  // One-off sessions at other gyms. Its own programme so its own storage slice:
  // different machines mean stack numbers do not read across, and logged into
  // pull-v2 these would land in the real history, move the graphs and could
  // trigger a suggested increase off a machine he will never use again. Every
  // id is prefixed `guest-` so nothing can collide with or merge into ppl-v2 —
  // not even the crunches, which deliberately carry no historyGroup.
  // First used 20 Sep 2026, Pull at a friend's gym.
  guest: {
    id: 'guest',
    name: 'Guest Session',
    shortDescription: 'One-off sessions at other gyms — kept out of your main history',
    days: [
      {
        id: 'guest-pull',
        label: 'Day 1',
        focus: 'Pull',
        equipment: ['Cable Machine', 'Dumbbells'],
        exercises: [
          {
            id: 'guest-seated-row',
            name: 'Seated Row (Machine)',
            muscles: { primary: ['back'], secondary: ['biceps', 'rear-delts'] },
            compound: true,
            sets: 3,
            reps: '6-10/6-10/6-10',
            defaultWeight: 52,
            equipment: ['Cable Machine'],
            alternative: null,
            description: 'Logged at another gym. Stack numbers are machine-specific.',
            howTo: [],
          },
          {
            id: 'guest-lat-pulldown',
            name: 'Lat Pulldown (Cable)',
            muscles: { primary: ['back'], secondary: ['biceps'] },
            compound: true,
            sets: 2,
            reps: '6-10/6-10',
            defaultWeight: 45,
            equipment: ['Cable Machine'],
            alternative: null,
            description: 'Logged at another gym. Stack numbers are machine-specific.',
            howTo: [],
          },
          {
            id: 'guest-straight-arm-pulldown',
            name: 'Straight Arm Lat Pulldown (Cable)',
            muscles: { primary: ['back'] },
            sets: 3,
            reps: '8-12/8-12/8-12',
            defaultWeight: 36,
            equipment: ['Cable Machine'],
            alternative: null,
            description: 'Logged at another gym.',
            howTo: [],
          },
          {
            id: 'guest-cable-reverse-fly',
            name: 'Rear Delt Reverse Fly (Cable)',
            muscles: { primary: ['rear-delts'] },
            sets: 3,
            reps: '8-12/8-12/8-12',
            defaultWeight: 18,
            equipment: ['Cable Machine'],
            alternative: null,
            description: 'Logged at another gym.',
            howTo: [],
          },
          {
            id: 'guest-dumbbell-curl',
            name: 'Bicep Curl (Dumbbell)',
            muscles: { primary: ['biceps'] },
            sets: 3,
            reps: '8-12/8-12/8-12',
            defaultWeight: 28,
            equipment: ['Dumbbells'],
            alternative: null,
            description: 'PAIR TOTAL, as everywhere else in the app.',
            howTo: [],
          },
          {
            id: 'guest-crossbody-hammer',
            name: 'Cross Body Hammer Curl',
            muscles: { primary: ['biceps'], secondary: ['forearms'] },
            sets: 2,
            reps: '8-12/8-12',
            defaultWeight: 28,
            equipment: ['Dumbbells'],
            alternative: null,
            description: 'PAIR TOTAL.',
            howTo: [],
          },
          {
            id: 'guest-incline-curl',
            name: 'Seated Incline Curl (Dumbbell)',
            muscles: { primary: ['biceps'] },
            sets: 2,
            reps: '6-10/6-10',
            defaultWeight: 24,
            equipment: ['Dumbbells'],
            alternative: null,
            description: 'PAIR TOTAL.',
            howTo: [],
          },
          {
            id: 'guest-shrug',
            name: 'Shrug (Dumbbell)',
            muscles: { primary: ['traps'] },
            sets: 2,
            reps: '10-15/10-15',
            defaultWeight: 40,
            equipment: ['Dumbbells'],
            alternative: null,
            description: 'PAIR TOTAL.',
            howTo: [],
          },
          {
            id: 'guest-hanging-leg-raise',
            name: 'Hanging Leg Raise',
            muscles: { primary: ['abs'] },
            sets: 1,
            reps: '10-15',
            defaultWeight: null,
            equipment: [],
            alternative: null,
            description: 'Bodyweight — reps only.',
            howTo: [],
          },
          {
            id: 'guest-weighted-crunches',
            name: 'Weighted Crunches',
            muscles: { primary: ['abs'] },
            sets: 3,
            reps: '12-15/12-15/12-15',
            defaultWeight: null,
            equipment: ['Dumbbells'],
            alternative: null,
            description: 'Deliberately NOT in the weighted-crunches history group — this stays out of your main timeline.',
            howTo: [],
          },
        ],
      },
    ],
  },
};

// Convenience export — keeps all existing component imports working
const PROGRAM = PROGRAMMES['5day'].days;

const EQUIPMENT_LIST = [
  'Squat Rack',
  'Barbell',
  'Dumbbells',
  'Flat Bench',
  'Incline Bench',
  'Leg Curl Machine',
  'Leg Extension Machine',
  'Leg Press Machine',
  'Chest Supported Row Machine',
  'Resistance Bands',
  'Pull Up Bar',
  'Cable Machine',
  'Lat Pulldown Machine',
  'Hack Squat Machine',
  'Calf Press Machine',
  'Chest Fly Machine',
  'Chest Press Machine',
  'Assisted Chin/Dip Machine',
  'Smith Machine',
  'Deadlift Machine',
  'Shoulder Press Machine',
];

export { PROGRAMMES, PROGRAM, EQUIPMENT_LIST };
