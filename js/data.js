// ══════════════════════════════════════════
//  data.js
//  All static programme and meal data.
//  Edit this file to change exercises, meals,
//  or suggested meals — nothing else needs touching.
// ══════════════════════════════════════════

const PROGRAM = [
  {
    id: 'chest-biceps',
    label: 'Day 1',
    focus: 'Chest & Biceps',
    equipment: ['Barbell (5ft)', 'Dumbbells', 'Incline Bench', 'Flat Bench'],
    exercises: [
      {
        name: 'Incline Bench Press',
        sets: 5,
        reps: '15/15/12/12/10',
        defaultWeight: 30,
      },
      { name: 'Bench Press', sets: 4, reps: '12/10/8/8', defaultWeight: 30 },
      {
        name: 'Incline Dumbbell Flys',
        sets: 3,
        reps: '15/12/12',
        defaultWeight: 12.5,
      },
      {
        name: 'Barbell Curls',
        sets: 3,
        reps: '15/15/15',
        defaultWeight: null,
        superset: {
          name: 'Reverse Barbell Curls',
          reps: 'Failure',
          defaultWeight: null,
        },
      },
      {
        name: 'Push-ups (finisher)',
        sets: 1,
        reps: 'Failure',
        defaultWeight: null,
      },
    ],
  },
  {
    id: 'back',
    label: 'Day 2',
    focus: 'Back',
    equipment: ['Barbell (7ft)', 'Dumbbells', 'Chest Supported Row Machine'],
    exercises: [
      { name: 'Deadlifts', sets: 4, reps: '10/8/8/Fail', defaultWeight: 62 },
      {
        name: 'Bent Over Rows',
        sets: 4,
        reps: '12/10/10/8',
        defaultWeight: 35,
        note: '2 underhand, 2 overhand',
      },
      { name: 'Power Shrug', sets: 3, reps: '12/12/12', defaultWeight: 62 },
      {
        name: 'Chest Supported Row',
        sets: 4,
        reps: '12/10/10/8',
        defaultWeight: 17.5,
      },
    ],
  },
  {
    id: 'ham-glutes',
    label: 'Day 3',
    focus: 'Hamstrings & Glutes',
    equipment: ['Barbell (7ft)', 'Leg Curl Machine', 'Flat Bench'],
    exercises: [
      {
        name: 'Lying Leg Curls',
        sets: 4,
        reps: '15/15/15/15',
        defaultWeight: 35,
      },
      {
        name: 'Straight-Legged Deadlifts',
        sets: 4,
        reps: '15-20 each',
        defaultWeight: 47.5,
      },
      {
        name: 'Front Barbell Squat',
        sets: 4,
        reps: '15/15/15/15',
        defaultWeight: 30,
      },
      {
        name: 'Barbell Hip Thrusts',
        sets: 3,
        reps: '8-10 each',
        defaultWeight: 30,
      },
    ],
  },
  {
    id: 'shoulders-tri',
    label: 'Day 4',
    focus: 'Shoulders & Triceps',
    equipment: ['Barbell (5ft)', 'Dumbbells', 'Flat Bench'],
    exercises: [
      {
        name: 'Dumbbell Shoulder Press',
        sets: 3,
        reps: '12/12/12',
        defaultWeight: 15,
        note: 'Superset ↓',
      },
      {
        name: 'Barbell Front Raise',
        sets: 3,
        reps: '12/12/12',
        defaultWeight: 10,
      },
      {
        name: 'Dumbbell Lateral Raises 1½',
        sets: 3,
        reps: '12-15',
        defaultWeight: 5,
      },
      {
        name: 'Upright Rows',
        sets: 3,
        reps: '15/12/12',
        defaultWeight: null,
        note: 'Superset ↓',
      },
      { name: 'Dumbbell Rows', sets: 3, reps: '15/12/12', defaultWeight: null },
      {
        name: 'Bench Dips',
        sets: 4,
        reps: '12-15',
        defaultWeight: null,
        note: 'Superset ↓',
      },
      { name: 'Skull Crushers', sets: 4, reps: '12-15', defaultWeight: 7.5 },
      {
        name: 'Reverse Grip Skull Crushers',
        sets: 4,
        reps: '8-10',
        defaultWeight: 5,
      },
    ],
  },
  {
    id: 'quads',
    label: 'Day 5',
    focus: 'Quads',
    equipment: ['Barbell (7ft)', 'Leg Extension Machine', 'Leg Press Machine'],
    exercises: [
      {
        name: 'Leg Extensions (warm-up)',
        sets: 3,
        reps: '15/15/15',
        defaultWeight: null,
      },
      { name: 'Squats (heavy)', sets: 2, reps: '8/8', defaultWeight: null },
      {
        name: 'Squats (lighter)',
        sets: 6,
        reps: '10-12 each',
        defaultWeight: null,
      },
      { name: 'Leg Press', sets: 4, reps: '40/30/20/10', defaultWeight: null },
      {
        name: 'Leg Extensions',
        sets: 4,
        reps: '15 each',
        defaultWeight: null,
        note: 'Superset ↓',
      },
      {
        name: 'Standing Lunges',
        sets: 4,
        reps: '6-8 each',
        defaultWeight: null,
      },
    ],
  },
];

const STAPLE_MEALS = [
  {
    id: 'porridge',
    name: 'Porridge Bowl',
    desc: 'Oats, berries & flaxseeds',
    cal: 380,
  },
  {
    id: 'lentil-curry',
    name: 'Creamy Lentil & Almond Curry',
    desc: 'With basmati rice',
    cal: 620,
  },
  {
    id: 'burrito',
    name: 'Protein Breakfast Burrito',
    desc: 'Tofu scramble, beans, peppers',
    cal: 510,
  },
];

const SUGGESTED_MEALS = [
  {
    id: 'sug1',
    name: 'Tempeh Buddha Bowl',
    desc: 'Quinoa, roasted veg, tahini',
    cal: 490,
  },
  {
    id: 'sug2',
    name: 'Black Bean Tacos',
    desc: '3 tacos with salsa & guac',
    cal: 420,
  },
  {
    id: 'sug3',
    name: 'Chickpea Tikka Masala',
    desc: 'With brown rice',
    cal: 580,
  },
  {
    id: 'sug4',
    name: 'Vegan Protein Smoothie',
    desc: 'Pea protein, banana, oat milk',
    cal: 280,
  },
  {
    id: 'sug5',
    name: 'Edamame & Veggie Stir-fry',
    desc: 'With soba noodles',
    cal: 450,
  },
];
