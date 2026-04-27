// Warmup data with form cues for each movement.
// cues: array of exactly 3 short, sharp coaching points.

const WARMUPS = {
  'chest-biceps': [
    {
      name: 'Thoracic Rotations',
      description: 'Sit or kneel, hands behind head. Rotate upper back left and right, keeping hips still.',
      type: 'reps',
      reps: '10 each side',
      equipment: [],
      cues: [
        'Initiate the rotation from your upper back, not your shoulders',
        'Keep your hips completely still throughout',
        'Pause at end range — don\'t rush through it',
      ],
    },
    {
      name: 'Arm Swings',
      description: 'Stand tall. Swing both arms across your chest and back out wide in a controlled arc.',
      type: 'timed',
      duration: 30,
      equipment: [],
      cues: [
        'Keep your chest tall and core lightly braced',
        'Let the arms swing freely — no forcing the range',
        'Gradually increase the arc over the first few reps',
      ],
    },
    {
      name: 'Doorframe Chest Stretch',
      description: 'Place forearms on a doorframe at 90°. Step forward until you feel a stretch across the chest. Hold.',
      type: 'timed',
      duration: 30,
      equipment: [],
      cues: [
        'Forearms at 90° — higher = more upper chest, lower = more pec minor',
        'Step through until you feel the stretch, not pain',
        'Breathe into the stretch — don\'t hold your breath',
      ],
    },
    {
      name: 'Light Incline Press',
      description: 'Same movement as your first working set — focus on path and feel, not load.',
      type: 'reps',
      reps: '15',
      equipment: ['Barbell', 'Incline Bench'],
      weightNote: 'Use ~20% of working weight',
      cues: [
        'Feel the bar path — slight arc, not straight up',
        'Squeeze the chest at the top, don\'t just lock out elbows',
        'Lower slowly — 2 seconds down',
      ],
    },
    {
      name: 'Light Dumbbell Curl',
      description: 'Full range curl, slow on the way down. Wrist stays neutral throughout.',
      type: 'reps',
      reps: '12',
      equipment: ['Dumbbells'],
      weightNote: 'Use ~20% of working weight',
      cues: [
        'Pin your elbows to your sides — don\'t let them drift forward',
        'Supinate at the top — palm faces ceiling at peak',
        'Lower in 2-3 seconds — the eccentric is the work',
      ],
    },
  ],

  back: [
    {
      name: 'Cat-Cow',
      description: 'On hands and knees. Inhale — drop belly, lift head. Exhale — round spine, tuck chin. Slow and deliberate.',
      type: 'reps',
      reps: '10',
      equipment: [],
      cues: [
        'Move segment by segment — cervical, thoracic, lumbar',
        'Breathe drives the movement: inhale = cow, exhale = cat',
        'Full range at each end — don\'t short-change the movement',
      ],
    },
    {
      name: 'Hip Hinge Drill',
      description: 'Stand tall. Hinge at the hips until you feel your hamstrings load, keeping your back flat. Squeeze glutes to stand.',
      type: 'reps',
      reps: '12',
      equipment: [],
      cues: [
        'Push hips back — not down. This is not a squat',
        'Maintain a neutral spine throughout — no rounding',
        'Feel the hamstrings load before you return to standing',
      ],
    },
    {
      name: 'Scapular Pulls',
      description: 'Hang from a bar with arms straight. Without bending your elbows, depress and retract your shoulder blades. Hold 1 sec at the top.',
      type: 'reps',
      reps: '8',
      equipment: ['Pull Up Bar'],
      cues: [
        'Arms stay completely straight throughout',
        'Think: pull your shoulder blades into your back pockets',
        'Hold 1 second at the top before lowering with control',
      ],
    },
    {
      name: 'Light Deadlift',
      description: 'Movement rehearsal — brace your core, push the floor away, feel the lats engage before the bar leaves the ground.',
      type: 'reps',
      reps: '8',
      equipment: ['Barbell'],
      weightNote: 'Use ~20% of working weight',
      cues: [
        'Lat engagement first — protect the bar path before you pull',
        'Push the floor away, don\'t pull the bar up',
        'Lock hips and shoulders out together at the top',
      ],
    },
    {
      name: 'Light Bent Over Row',
      description: 'Hinge to your working position, pull to your lower chest. Pause at the top, lower with control.',
      type: 'reps',
      reps: '10',
      equipment: ['Barbell'],
      weightNote: 'Use ~20% of working weight',
      cues: [
        'Hold the hip hinge position — don\'t let your torso rise as you pull',
        'Pull to your lower chest — elbows stay close to your body',
        'Pause at the top and squeeze your shoulder blades together',
      ],
    },
  ],

  'ham-glutes': [
    {
      name: 'Standing Hip Flexor Stretch',
      description: 'Lunge forward, drop your back knee. Drive your hip forward and hold. Keep your torso tall.',
      type: 'timed',
      duration: 30,
      equipment: [],
      cues: [
        'Posterior pelvic tilt — tuck your tailbone to deepen the stretch',
        'Keep your torso tall — don\'t lean forward',
        'Drive the hip forward, not down',
      ],
    },
    {
      name: 'Leg Swings',
      description: 'Hold a wall for support. Swing each leg forward and back in a controlled arc, gradually increasing range.',
      type: 'reps',
      reps: '12 each leg',
      equipment: [],
      cues: [
        'Keep the swing controlled — momentum, not force',
        'Standing leg stays soft — slight bend in the knee',
        'Let the range increase naturally over the reps',
      ],
    },
    {
      name: 'Glute Bridges',
      description: 'Lie on your back, feet flat on the floor. Drive through your heels, squeeze glutes at the top. Hold for 1 second.',
      type: 'reps',
      reps: '15',
      equipment: [],
      cues: [
        'Drive through heels — toes can even lift slightly',
        'Squeeze glutes hard at the top — not just pushing with your lower back',
        'Hold 1 second at the top before lowering with control',
      ],
    },
    {
      name: 'Light RDL',
      description: 'Feel the hamstrings load as you hinge. Push hips back, not down. This is about range and tension — not load.',
      type: 'reps',
      reps: '10',
      equipment: ['Barbell'],
      weightNote: 'Use ~20% of working weight',
      cues: [
        'Bar stays in contact with your legs throughout',
        'Push hips back until you feel a strong hamstring stretch',
        'Drive hips forward to stand — glutes finish the rep',
      ],
    },
  ],

  'shoulders-tri': [
    {
      name: 'Shoulder CARs',
      description: 'Slow, controlled circular rotation of the shoulder through its full range. Keep the rest of your body completely still.',
      type: 'reps',
      reps: '5 each direction, each arm',
      equipment: [],
      cues: [
        'Move only the shoulder — everything else is completely still',
        'Go as slow as possible — this is about control, not speed',
        'Find and work through any stiff spots rather than bypassing them',
      ],
    },
    {
      name: 'Wall Slides',
      description: 'Back flat against a wall, arms in a goalpost position. Slide arms overhead while keeping wrists, elbows and back in contact.',
      type: 'reps',
      reps: '10',
      equipment: [],
      cues: [
        'Three contact points must stay on the wall: wrists, elbows, and upper back',
        'Move slowly — if you lose contact, you\'ve gone too far',
        'Feel your upper back working to pull the arms up',
      ],
    },
    {
      name: 'Band Pull-Aparts',
      description: 'Hold a band at shoulder height with arms extended. Pull apart until it touches your chest, squeezing your shoulder blades together.',
      type: 'reps',
      reps: '15',
      equipment: ['Resistance Bands'],
      cues: [
        'Arms stay at shoulder height — don\'t let them drop',
        'Squeeze shoulder blades together at the end of each rep',
        'Control the return — don\'t let the band snap back',
      ],
    },
    {
      name: 'Light Lateral Raise',
      description: 'Lead with your elbows, not your hands. Stop at shoulder height. Slow and controlled — no swinging.',
      type: 'reps',
      reps: '15',
      equipment: ['Dumbbells'],
      weightNote: 'Use ~20% of working weight',
      cues: [
        'Lead with elbows — think of pouring water out of a jug',
        'Stop at shoulder height — no higher',
        '3 seconds down — the eccentric activates the muscle',
      ],
    },
    {
      name: 'Light Shoulder Press',
      description: 'Press straight overhead, lock out at the top, lower slowly. Primes the rotator cuff before heavier work.',
      type: 'reps',
      reps: '12',
      equipment: ['Dumbbells'],
      weightNote: 'Use ~20% of working weight',
      cues: [
        'Press in a slight arc — not straight up',
        'Full lockout at the top — don\'t short the range',
        'Lower in 2-3 seconds — control the descent',
      ],
    },
  ],

  quads: [
    {
      name: 'Hip Circles',
      description: 'Stand on one leg, draw large circles with your opposite knee. Keeps the hip joint mobile before loading.',
      type: 'reps',
      reps: '10 each direction, each leg',
      equipment: [],
      cues: [
        'Make the circles as large as possible',
        'Standing leg stays slightly bent for balance',
        'Keep your torso still — only the hip moves',
      ],
    },
    {
      name: 'Bodyweight Squats',
      description: 'Full depth. Pause for 1 second at the bottom. Knees track over toes, chest stays tall.',
      type: 'reps',
      reps: '15',
      equipment: [],
      cues: [
        'Knees track over toes — push them out as you descend',
        'Chest tall throughout — don\'t fold forward',
        'Pause 1 second at the bottom before driving up',
      ],
    },
    {
      name: 'Walking Lunges',
      description: 'Long stride, back knee grazes the floor. Drive off your front foot to stand. Alternating legs.',
      type: 'reps',
      reps: '10 each leg',
      equipment: [],
      cues: [
        'Long stride — front shin stays vertical',
        'Back knee grazes but doesn\'t crash into the floor',
        'Drive off the front heel to step through',
      ],
    },
    {
      name: 'Light Squat',
      description: 'Same bar position and depth as your working sets. Lock in your stance and brace pattern before adding load.',
      type: 'reps',
      reps: '10',
      equipment: ['Barbell', 'Squat Rack'],
      weightNote: 'Use ~20% of working weight',
      cues: [
        'Set your stance exactly as you will for working sets',
        'Brace your core before you unrack — not after',
        'Full depth — match your working set depth exactly',
      ],
    },
  ],
  // Add these three keys to the existing WARMUPS object
// alongside the existing 'chest-biceps', 'back', etc. keys

push: [
  {
    name: 'Thoracic Rotations',
    description: 'Sit or kneel, hands behind head. Rotate your upper back left and right, keeping hips still.',
    type: 'reps',
    reps: '10 each side',
    equipment: [],
    cues: [
      'Initiate from your upper back — not your shoulders',
      'Keep your hips completely still throughout',
      'Pause at end range — don\'t rush through it',
    ],
  },
  {
    name: 'Arm Swings',
    description: 'Stand tall. Swing both arms across your chest and back out wide in a controlled arc.',
    type: 'timed',
    duration: 30,
    equipment: [],
    cues: [
      'Keep your chest tall and core lightly braced',
      'Let the arms swing freely — no forcing the range',
      'Gradually increase the arc over the first few reps',
    ],
  },
  {
    name: 'Doorframe Chest Stretch',
    description: 'Place forearms on a doorframe at 90°. Step forward until you feel a stretch across the chest. Hold.',
    type: 'timed',
    duration: 30,
    equipment: [],
    cues: [
      'Forearms at 90° — higher targets upper chest, lower hits pec minor',
      'Step through until you feel the stretch, not pain',
      'Breathe into the stretch — don\'t hold your breath',
    ],
  },
  {
    name: 'Light Bench Press',
    description: 'Same movement as your first working set. Focus on the path and feel — not load.',
    type: 'reps',
    reps: '15',
    equipment: ['Barbell', 'Flat Bench'],
    weightNote: 'Use ~20% of working weight',
    cues: [
      'Retract your shoulder blades before you unrack',
      'Feel the bar path — slight arc, not straight up',
      'Lower slowly — 2 seconds down',
    ],
  },
  {
    name: 'Light Shoulder Press',
    description: 'Press straight overhead, lock out at the top, lower slowly. Primes the rotator cuff before heavier work.',
    type: 'reps',
    reps: '12',
    equipment: ['Dumbbells'],
    weightNote: 'Use ~20% of working weight',
    cues: [
      'Press in a slight arc — not ramrod straight',
      'Full lockout at the top — don\'t short it',
      'Lower in 2–3 seconds — control the descent',
    ],
  },
],

pull: [
  {
    name: 'Cat-Cow',
    description: 'On hands and knees. Inhale — drop belly, lift head. Exhale — round spine, tuck chin.',
    type: 'reps',
    reps: '10',
    equipment: [],
    cues: [
      'Move segment by segment — cervical, thoracic, lumbar',
      'Breath drives the movement: inhale = cow, exhale = cat',
      'Full range at each end — don\'t short-change it',
    ],
  },
  {
    name: 'Hip Hinge Drill',
    description: 'Stand tall. Hinge at the hips until you feel your hamstrings load, back flat. Squeeze glutes to stand.',
    type: 'reps',
    reps: '12',
    equipment: [],
    cues: [
      'Push hips back — not down. This is not a squat',
      'Maintain a neutral spine throughout — no rounding',
      'Feel the hamstrings load before you return to standing',
    ],
  },
  {
    name: 'Scapular Pulls',
    description: 'Hang from a bar with arms straight. Without bending your elbows, depress and retract your shoulder blades. Hold 1 sec at the top.',
    type: 'reps',
    reps: '8',
    equipment: ['Pull Up Bar'],
    cues: [
      'Arms stay completely straight throughout',
      'Think: pull shoulder blades into your back pockets',
      'Hold 1 second at the top before lowering with control',
    ],
  },
  {
    name: 'Light Deadlift',
    description: 'Movement rehearsal — brace, push the floor away, feel the lats engage before the bar leaves the ground.',
    type: 'reps',
    reps: '8',
    equipment: ['Barbell'],
    weightNote: 'Use ~20% of working weight',
    cues: [
      'Engage lats first — protect the bar path before you pull',
      'Push the floor away, don\'t pull the bar up',
      'Lock hips and shoulders out together at the top',
    ],
  },
  {
    name: 'Light Bent-Over Row',
    description: 'Hinge to your working position. Pull to your lower chest, pause at the top, lower with control.',
    type: 'reps',
    reps: '10',
    equipment: ['Barbell'],
    weightNote: 'Use ~20% of working weight',
    cues: [
      'Hold the hinge — don\'t let your torso rise as you pull',
      'Pull to your lower chest, elbows close to your body',
      'Squeeze shoulder blades together at the top',
    ],
  },
],

legs: [
  {
    name: 'Hip Circles',
    description: 'Stand on one leg, draw large circles with your opposite knee. Mobilises the hip joint before loading.',
    type: 'reps',
    reps: '10 each direction, each leg',
    equipment: [],
    cues: [
      'Make the circles as large as possible',
      'Standing leg stays slightly bent for balance',
      'Keep your torso still — only the hip moves',
    ],
  },
  {
    name: 'Leg Swings',
    description: 'Hold a wall for support. Swing each leg forward and back in a controlled arc, gradually increasing range.',
    type: 'reps',
    reps: '12 each leg',
    equipment: [],
    cues: [
      'Keep the swing controlled — momentum, not force',
      'Standing leg stays soft — slight bend in the knee',
      'Let the range increase naturally over the reps',
    ],
  },
  {
    name: 'Glute Bridges',
    description: 'Lie on your back, feet flat. Drive through your heels, squeeze glutes at the top. Hold 1 second.',
    type: 'reps',
    reps: '15',
    equipment: [],
    cues: [
      'Drive through heels — toes can even lift slightly',
      'Squeeze glutes hard at the top — not just your lower back',
      'Hold 1 second at the top before lowering with control',
    ],
  },
  {
    name: 'Bodyweight Squats',
    description: 'Full depth. Pause 1 second at the bottom. Knees track over toes, chest stays tall.',
    type: 'reps',
    reps: '15',
    equipment: [],
    cues: [
      'Knees track over toes — push them out as you descend',
      'Chest tall throughout — don\'t fold forward',
      'Pause 1 second at the bottom before driving up',
    ],
  },
  {
    name: 'Light Squat',
    description: 'Same bar position and depth as your working sets. Lock in your stance and brace pattern before adding load.',
    type: 'reps',
    reps: '10',
    equipment: ['Barbell', 'Squat Rack'],
    weightNote: 'Use ~20% of working weight',
    cues: [
      'Set your stance exactly as you will for working sets',
      'Brace your core before you unrack — not after',
      'Full depth — match your working set depth exactly',
    ],
  },
],
};

export { WARMUPS };