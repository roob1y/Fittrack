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
    equipment: ['Barbell', 'Dumbbells', 'Incline Bench', 'Flat Bench'],
    exercises: [
      {
        name: 'Incline Bench Press',
        sets: 5,
        reps: '15/15/12/12/10',
        defaultWeight: 30,
        equipment: ['Barbell', 'Incline Bench'],
        alternative: {
          name: 'Incline Dumbbell Press',
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
        sets: 4,
        reps: '12/10/8/8',
        defaultWeight: 30,
        equipment: ['Barbell', 'Flat Bench'],
        alternative: {
          name: 'Dumbbell Chest Press',
          equipment: ['Dumbbells', 'Flat Bench'],
        },
        description: 'The cornerstone chest builder. Develops overall chest mass alongside front delts and triceps.',
        howTo: [
          'Lie flat, grip just wider than shoulder-width, shoulder blades pinched together.',
          'Lower the bar to your mid-chest in a controlled descent.',
          'Press back up explosively, driving your feet into the floor.',
          "Keep elbows at 45–75° from your torso — don't let them flare fully wide.",
        ],
      },
      {
        name: 'Incline Dumbbell Flys',
        sets: 3,
        reps: '15/12/12',
        defaultWeight: 12.5,
        equipment: ['Dumbbells', 'Incline Bench'],
        alternative: { name: 'Wide Push-ups', equipment: [] },
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
        name: 'Barbell Curls',
        sets: 3,
        reps: '15/15/15',
        defaultWeight: null,
        equipment: ['Barbell'],
        alternative: { name: 'Dumbbell Curls', equipment: ['Dumbbells'] },
        superset: {
          name: 'Reverse Barbell Curls',
          reps: 'Failure',
          defaultWeight: null,
          equipment: ['Barbell'],
          alternative: {
            name: 'Reverse Dumbbell Curls',
            equipment: ['Dumbbells'],
          },
        },
        description:
          'Barbell curls build the bicep peak. Reverse curls hit the brachialis and brachioradialis, filling out the forearm and pushing the bicep upward.',
        howTo: [
          'Barbell curls: stand with an underhand grip, hands shoulder-width. Curl up keeping elbows pinned at your sides, lower slowly.',
          'Go straight into reverse curls with an overhand grip — the movement is identical but your grip will feel weaker so reduce weight if needed.',
          "Keep your wrists neutral throughout the reverse curls — don't let them drop.",
          "Avoid swinging on either movement. If you're swinging, it's too heavy.",
        ],
      },
      {
        name: 'Push-ups (finisher)',
        sets: 1,
        reps: 'Failure',
        defaultWeight: null,
        equipment: [],
        description:
          'A bodyweight chest finisher to fully exhaust the pecs after barbell work. Go to failure — every rep counts.',
        howTo: [
          'Hands slightly wider than shoulder-width, body in a straight line from head to heels.',
          'Lower your chest to the floor with elbows at roughly 45°.',
          'Push back up fully and repeat until you can no longer maintain form.',
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
        sets: 4,
        reps: '10/8/8/Failure',
        defaultWeight: 62,
        equipment: ['Barbell'],
        alternative: { name: 'Dumbbell Deadlifts', equipment: ['Dumbbells'] },
        description:
          'The king of posterior chain exercises. Builds the entire back, glutes, hamstrings and grip simultaneously.',
        howTo: [
          'Bar over mid-foot, hip-width stance. Grip just outside your legs.',
          'Flatten your back, brace your core hard, and push the floor away rather than thinking about pulling.',
          'Lock out at the top by squeezing your glutes. Keep the bar close to your body throughout.',
          'Lower under control. The final set is to failure — grind out every rep you safely can.',
        ],
      },
      {
        name: 'Bent Over Rows',
        sets: 4,
        reps: '12/10/10/8',
        defaultWeight: 35,
        note: '2 underhand, 2 overhand',
        equipment: ['Barbell'],
        alternative: {
          name: 'Dumbbell Rows',
          equipment: ['Dumbbells', 'Flat Bench'],
        },
        description:
          'Builds mid and upper back thickness. Alternating grip targets different parts of the back — underhand recruits more bicep and lower lat, overhand hits upper traps and rhomboids.',
        howTo: [
          "Hinge forward to roughly 45°, bar hanging at arm's length.",
          'Pull the bar into your lower stomach, driving elbows back and up. Squeeze at the top.',
          "Lower with control. Keep your back flat — don't round under load.",
          'Alternate between underhand and overhand grip each set as noted.',
        ],
      },
      {
        name: 'Power Shrug',
        sets: 3,
        reps: '12/12/12',
        defaultWeight: 62,
        equipment: ['Barbell'],
        alternative: { name: 'Dumbbell Shrugs', equipment: ['Dumbbells'] },
        description: 'Builds the traps and develops explosive pulling power. Heavy and fast.',
        howTo: [
          'Stand holding the bar with an overhand grip, arms straight.',
          'Explosively shrug your shoulders straight up toward your ears — no rolling forward or back.',
          'Hold briefly at the top then lower. Keep the movement sharp, not slow.',
        ],
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
        description:
          'Removes the lower back from the equation entirely, letting you isolate the mid-back and rhomboids with pure pulling force.',
        howTo: [
          'Lie chest-down on the incline pad and let the handles hang at full extension.',
          'Row them up by driving your elbows back. Squeeze your shoulder blades together hard at the top.',
          "Lower slowly. Don't use momentum — the machine removes the option to cheat.",
        ],
      },
    ],
  },
  {
    id: 'ham-glutes',
    label: 'Day 3',
    focus: 'Hamstrings & Glutes',
    equipment: ['Barbell', 'Flat Bench'],
    exercises: [
      {
        name: 'Lying Leg Curls',
        sets: 4,
        reps: '15/15/15/15',
        defaultWeight: 35,
        equipment: ['Leg Curl Machine'],
        alternative: { name: 'Nordic Curls', equipment: ['Flat Bench'] },
        description: 'Isolates the hamstrings through a full range of motion before the heavier compound work.',
        howTo: [
          'Lie face down on the machine with the pad just above your heels.',
          "Curl your legs up toward your glutes as far as they'll go. Hold briefly at the top.",
          "Lower slowly — the eccentric is important here. Don't let your hips rise off the pad.",
        ],
      },
      {
        name: 'Straight-Legged Deadlifts',
        sets: 4,
        reps: '15-20 each',
        defaultWeight: 47.5,
        equipment: ['Barbell'],
        alternative: {
          name: 'Dumbbell Straight-Legged Deadlifts',
          equipment: ['Dumbbells'],
        },
        description: 'A Romanian-style deadlift that prioritises hamstring stretch and loading over raw weight.',
        howTo: [
          'Stand holding the bar with a soft bend in the knees throughout.',
          'Hinge at the hips and lower the bar down your legs, feeling a deep stretch in the hamstrings.',
          'Drive your hips forward to return to standing. Keep your back flat and bar close to your body.',
          "Don't round your lower back — if you feel it rounding, you've gone too low.",
        ],
      },
      {
        name: 'Front Barbell Squat',
        sets: 4,
        reps: '15/15/15/15',
        defaultWeight: 30,
        equipment: ['Barbell', 'Squat Rack'],
        alternative: { name: 'Goblet Squat', equipment: ['Dumbbells'] },
        description:
          'A quad-dominant squat variation. The front-loaded position demands more from the quads and naturally keeps the torso upright.',
        howTo: [
          'Rest the bar across your front delts with elbows high. Feet shoulder-width, toes turned slightly out.',
          'Squat down keeping your torso as upright as possible.',
          'Drive back up through your heels. If your elbows drop, the bar rolls — keep them up throughout.',
        ],
      },
      {
        name: 'Barbell Hip Thrusts',
        sets: 3,
        reps: '8-10 each',
        defaultWeight: 30,
        equipment: ['Barbell', 'Flat Bench'],
        alternative: {
          name: 'Bodyweight Hip Thrusts',
          equipment: ['Flat Bench'],
        },
        description:
          "The best direct glute builder. Loads the glutes through full extension in a way squats and deadlifts can't.",
        howTo: [
          'Sit with your upper back against the bench, bar across your hips — use a pad.',
          'Plant your feet flat and drive through your heels, thrusting hips up until your body forms a straight line from knees to shoulders.',
          "Squeeze hard at the top. Don't hyperextend your lower back — squeeze the glutes instead.",
          'Lower with control and repeat.',
        ],
      },
    ],
  },
  {
    id: 'shoulders-tri',
    label: 'Day 4',
    focus: 'Shoulders & Triceps',
    equipment: ['Barbell', 'Dumbbells', 'Flat Bench'],
    exercises: [
      {
        name: 'Dumbbell Shoulder Press',
        sets: 3,
        reps: '12/12/12',
        defaultWeight: 15,
        equipment: ['Dumbbells'],
        alternative: {
          name: 'Barbell Shoulder Press',
          equipment: ['Barbell'],
        },
        superset: {
          name: 'Barbell Front Raise',
          reps: '12/12/12',
          defaultWeight: 10,
          equipment: ['Barbell'],
          alternative: {
            name: 'Dumbbell Front Raise',
            equipment: ['Dumbbells'],
          },
        },
        description:
          'The press builds overall shoulder mass. The front raise isolates the anterior delt as a burnout immediately after.',
        howTo: [
          'Shoulder press: dumbbells at shoulder height, palms forward. Press straight up until arms are nearly locked out, lower with control.',
          'Go straight into front raises: hold the bar at hip height overhand and raise forward to shoulder height with straight arms.',
          "Lower the bar slowly on the raises — keep your torso still, this isn't a swing.",
          "Don't use your legs to drive either movement.",
        ],
      },
      {
        name: 'Dumbbell Lateral Raises 1½',
        sets: 3,
        reps: '12-15',
        defaultWeight: 5,
        equipment: ['Dumbbells'],
        alternative: { name: 'Plate Lateral Raises', equipment: [] },
        description:
          'The 1½ rep technique adds extra time under tension at the hardest point. Excellent for building the medial delt and shoulder width.',
        howTo: [
          'Hold dumbbells at your sides with a slight bend in the elbows.',
          "Raise them out to shoulder height, lower halfway down, raise back to the top — that's one rep.",
          'Lead with your elbows, not your hands. Go light — this is harder than it looks.',
        ],
      },
      {
        name: 'Upright Rows',
        sets: 3,
        reps: '15/12/12',
        defaultWeight: null,
        equipment: ['Barbell'],
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
        description:
          'Upright rows hit the traps and side delts. Dumbbell rows shift focus to the lats and mid-back for a push-pull superset.',
        howTo: [
          'Upright rows: overhand grip, hands shoulder-width. Pull the bar up to chin height leading with elbows, lower with control.',
          "Don't go too narrow on the grip — it puts unnecessary stress on the shoulder joint.",
          'Go straight into dumbbell rows: one knee and hand on the bench for support, pull the dumbbell toward your hip driving the elbow back past your torso.',
          'Squeeze at the top of each row, lower fully before the next rep.',
        ],
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
          equipment: ['Barbell', 'Flat Bench'],
          alternative: {
            name: 'Dumbbell Skull Crushers',
            equipment: ['Dumbbells', 'Flat Bench'],
          },
        },
        description:
          'Bench dips load the triceps through bodyweight. Skull crushers isolate the long head of the tricep, which makes up the bulk of upper arm size.',
        howTo: [
          'Bench dips: hands on the edge of the bench behind you, feet out in front. Lower by bending elbows to 90° then push back up. Keep your back close to the bench.',
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
        sets: 2,
        reps: '8/8',
        defaultWeight: 50,
        equipment: ['Barbell', 'Squat Rack'],
        alternative: {
          name: 'Dumbbell Goblet Squats',
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
        sets: 3,
        reps: '10-12 each',
        defaultWeight: 35,
        equipment: ['Barbell', 'Squat Rack'],
        alternative: {
          name: 'Dumbbell Goblet Squats',
          equipment: ['Dumbbells'],
        },
        description:
          'Higher-rep squats to build quad volume and endurance after the heavy sets. Same form, lighter load, more burn.',
        howTo: [
          'Same technique as the heavy squat.',
          'The lighter weight lets you go a little deeper — focus on feeling the quads working throughout.',
          "Control the descent. Don't rush.",
        ],
      },
      {
        name: 'Bulgarian Split Squats',
        sets: 3,
        reps: '10-12 each',
        defaultWeight: null,
        equipment: ['Flat Bench'],
        alternative: { name: 'Reverse Lunges', equipment: [] },
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
];

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
];

export { PROGRAM, EQUIPMENT_LIST };
