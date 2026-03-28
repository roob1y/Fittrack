// ══════════════════════════════════════════
//  data.js
//  All static programme data.
//  Edit this file to change exercises — nothing else needs touching.
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
        equipment: ['Barbell (5ft)', 'Incline Bench'],
        alternative: {
          name: 'Incline Dumbbell Press',
          equipment: ['Dumbbells', 'Incline Bench'],
        },
      },
      {
        name: 'Bench Press',
        sets: 4,
        reps: '12/10/8/8',
        defaultWeight: 30,
        equipment: ['Barbell (5ft)', 'Flat Bench'],
        alternative: {
          name: 'Dumbbell Chest Press',
          equipment: ['Dumbbells', 'Flat Bench'],
        },
      },
      {
        name: 'Incline Dumbbell Flys',
        sets: 3,
        reps: '15/12/12',
        defaultWeight: 12.5,
        equipment: ['Dumbbells', 'Incline Bench'],
        alternative: { name: 'Wide Push-ups', equipment: [] },
      },
      {
        name: 'Barbell Curls',
        sets: 3,
        reps: '15/15/15',
        defaultWeight: null,
        equipment: ['Barbell (5ft)'],
        alternative: { name: 'Dumbbell Curls', equipment: ['Dumbbells'] },
        superset: {
          name: 'Reverse Barbell Curls',
          reps: 'Failure',
          defaultWeight: null,
          equipment: ['Barbell (5ft)'],
          alternative: {
            name: 'Reverse Dumbbell Curls',
            equipment: ['Dumbbells'],
          },
        },
      },
      {
        name: 'Push-ups (finisher)',
        sets: 1,
        reps: 'Failure',
        defaultWeight: null,
        equipment: [],
      },
    ],
  },
  {
    id: 'back',
    label: 'Day 2',
    focus: 'Back',
    equipment: ['Barbell (7ft)', 'Dumbbells', 'Flat Bench'],
    exercises: [
      {
        name: 'Deadlifts',
        sets: 4,
        reps: '10/8/8/Fail',
        defaultWeight: 62,
        equipment: ['Barbell (7ft)'],
        alternative: { name: 'Dumbbell Deadlifts', equipment: ['Dumbbells'] },
      },
      {
        name: 'Bent Over Rows',
        sets: 4,
        reps: '12/10/10/8',
        defaultWeight: 35,
        note: '2 underhand, 2 overhand',
        equipment: ['Barbell (7ft)'],
        alternative: {
          name: 'Dumbbell Rows',
          equipment: ['Dumbbells', 'Flat Bench'],
        },
      },
      {
        name: 'Power Shrug',
        sets: 3,
        reps: '12/12/12',
        defaultWeight: 62,
        equipment: ['Barbell (7ft)'],
        alternative: { name: 'Dumbbell Shrugs', equipment: ['Dumbbells'] },
      },
      {
        name: 'Chest Supported Row',
        sets: 4,
        reps: '12/10/10/8',
        defaultWeight: 17.5,
        equipment: ['Chest Supported Row Machine'],
        alternative: {
          name: 'Dumbbell Rows',
          equipment: ['Dumbbells', 'Flat Bench'],
        },
      },
    ],
  },
  {
    id: 'ham-glutes',
    label: 'Day 3',
    focus: 'Hamstrings & Glutes',
    equipment: ['Barbell (7ft)', 'Flat Bench'],
    exercises: [
      {
        name: 'Lying Leg Curls',
        sets: 4,
        reps: '15/15/15/15',
        defaultWeight: 35,
        equipment: ['Leg Curl Machine'],
        alternative: { name: 'Nordic Curls', equipment: ['Flat Bench'] },
      },
      {
        name: 'Straight-Legged Deadlifts',
        sets: 4,
        reps: '15-20 each',
        defaultWeight: 47.5,
        equipment: ['Barbell (7ft)'],
        alternative: {
          name: 'Dumbbell Straight-Legged Deadlifts',
          equipment: ['Dumbbells'],
        },
      },
      {
        name: 'Front Barbell Squat',
        sets: 4,
        reps: '15/15/15/15',
        defaultWeight: 30,
        equipment: ['Barbell (7ft)', 'Squat Rack'],
        alternative: { name: 'Goblet Squat', equipment: ['Dumbbells'] },
      },
      {
        name: 'Barbell Hip Thrusts',
        sets: 3,
        reps: '8-10 each',
        defaultWeight: 30,
        equipment: ['Barbell (7ft)', 'Flat Bench'],
        alternative: {
          name: 'Bodyweight Hip Thrusts',
          equipment: ['Flat Bench'],
        },
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
        equipment: ['Dumbbells'],
        alternative: {
          name: 'Barbell Shoulder Press',
          equipment: ['Barbell (5ft)'],
        },
        superset: {
          name: 'Barbell Front Raise',
          reps: '12/12/12',
          defaultWeight: 10,
          equipment: ['Barbell (5ft)'],
          alternative: {
            name: 'Dumbbell Front Raise',
            equipment: ['Dumbbells'],
          },
        },
      },
      {
        name: 'Dumbbell Lateral Raises 1½',
        sets: 3,
        reps: '12-15',
        defaultWeight: 5,
        equipment: ['Dumbbells'],
        alternative: { name: 'Plate Lateral Raises', equipment: [] },
      },
      {
        name: 'Upright Rows',
        sets: 3,
        reps: '15/12/12',
        defaultWeight: null,
        equipment: ['Barbell (5ft)'],
        alternative: {
          name: 'Dumbbell Upright Rows',
          equipment: ['Dumbbells'],
        },
        superset: {
          name: 'Dumbbell Rows',
          reps: '15/12/12',
          defaultWeight: null,
          equipment: ['Dumbbells', 'Flat Bench'],
          alternative: { name: 'Bodyweight Rows', equipment: [] },
        },
      },
      {
        name: 'Bench Dips',
        sets: 3,
        reps: '12-15',
        defaultWeight: null,
        equipment: ['Flat Bench'],
        alternative: { name: 'Diamond Push-ups', equipment: [] },
        superset: {
          name: 'Skull Crushers',
          reps: '12-15',
          defaultWeight: 7.5,
          equipment: ['Barbell (5ft)', 'Flat Bench'],
          alternative: {
            name: 'Dumbbell Skull Crushers',
            equipment: ['Dumbbells', 'Flat Bench'],
          },
        },
      },
    ],
  },
  {
    id: 'quads',
    label: 'Day 5',
    focus: 'Quads',
    equipment: ['Barbell (7ft)', 'Squat Rack', 'Flat Bench'],
    exercises: [
      {
        name: 'Squats (heavy)',
        sets: 2,
        reps: '8/8',
        defaultWeight: 50,
        equipment: ['Barbell (7ft)', 'Squat Rack'],
        alternative: {
          name: 'Dumbbell Goblet Squats',
          equipment: ['Dumbbells'],
        },
      },
      {
        name: 'Squats (lighter)',
        sets: 3,
        reps: '10-12 each',
        defaultWeight: 35,
        equipment: ['Barbell (7ft)', 'Squat Rack'],
        alternative: {
          name: 'Dumbbell Goblet Squats',
          equipment: ['Dumbbells'],
        },
      },
      {
        name: 'Bulgarian Split Squats',
        sets: 3,
        reps: '10-12 each',
        defaultWeight: null,
        equipment: ['Flat Bench'],
        alternative: { name: 'Reverse Lunges', equipment: [] },
      },
      {
        name: 'Leg Extensions',
        sets: 4,
        reps: '15 each',
        defaultWeight: null,
        equipment: ['Leg Extension Machine'],
        alternative: { name: 'Sissy Squats', equipment: [] },
        superset: {
          name: 'Standing Lunges',
          reps: '6-8 each',
          defaultWeight: null,
          equipment: [],
          alternative: null,
        },
      },
    ],
  },
];

const EQUIPMENT_LIST = [
  'Squat Rack',
  'Barbell (7ft)',
  'Barbell (5ft)',
  'Dumbbells',
  'Flat Bench',
  'Incline Bench',
  'Leg Curl Machine',
  'Leg Extension Machine',
  'Leg Press Machine',
  'Chest Supported Row Machine',
  'Resistance Bands',
  'Pull Up Bar',
];

export { PROGRAM, EQUIPMENT_LIST };
