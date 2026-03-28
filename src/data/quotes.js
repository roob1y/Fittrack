export const QUOTES = {
  hardcore: [
    "No excuses. Get under the bar.",
    "Pain is just weakness leaving your body.",
    "You didn't come this far to only come this far.",
    "The only bad workout is the one that didn't happen.",
    "Soft people have soft lives. Train hard.",
    "Your future self is watching. Don't let them down.",
    "Rest when you're dead. Move now.",
    "Champions aren't made in gyms. They're made from what they have inside.",
    "Do it now. Your excuses don't lift weights.",
    "Bleed in training so you don't bleed in battle.",
  ],
  positive: [
    "Every rep is progress. Let's go!",
    "You showed up — that's already a win.",
    "Strong body, strong mind. You've got this.",
    "Progress, not perfection. Keep moving.",
    "You are stronger than you think.",
    "One more rep. One more step. One more day.",
    "Believe in the process and the results will follow.",
    "Today's effort is tomorrow's strength.",
    "You're doing amazing. Keep it up!",
    "Small steps every day lead to big changes.",
  ],
  stoic: [
    "Do what needs to be done. Nothing more.",
    "The obstacle is the way.",
    "Discipline is choosing what you want most over what you want now.",
    "You have power over your mind, not outside events.",
    "Waste no more time arguing. Begin.",
    "It is not the man who has little, but the man who craves more, that is poor.",
    "First say what you would be, then do what you have to do.",
    "Confine yourself to the present.",
    "The mind that is anxious about future events is miserable.",
    "Do not indulge in expectations. Act.",
  ],
};

export function getDailyQuote(tone) {
  if (tone === 'off' || !QUOTES[tone]) return null;
  const quotes = QUOTES[tone];
  const dayIndex = Math.floor(Date.now() / 86400000) % quotes.length;
  return quotes[dayIndex];
}