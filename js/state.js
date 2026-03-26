// ══════════════════════════════════════════
//  state.js
//  Manages app state and localStorage saving.
//  All other modules read/write via these functions.
// ══════════════════════════════════════════

let state = JSON.parse(localStorage.getItem('fittrack_v1') || 'null') || {
  weekNum: 1,
  completedDays: {},   // { 'chest-biceps': true }
  setData: {},         // { 'chest-biceps_0_0': { reps:'15', weight:'30', done:true } }
  mealLog: {},         // { 'YYYY-MM-DD': [ {id, name, cal} ] }
};

function saveState() {
  localStorage.setItem('fittrack_v1', JSON.stringify(state));
}
