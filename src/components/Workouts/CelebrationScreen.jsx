import React, { useEffect, useState } from 'react';

const MESSAGES = {
  hardcore: [
    "BEAST MODE ACTIVATED.",
    "THAT'S HOW IT'S DONE.",
    "NO DAYS OFF. NO EXCUSES.",
    "ANOTHER DAY. ANOTHER WIN.",
    "YOU EARNED IT. NOW RECOVER.",
  ],
  positive: [
    "Amazing work today! 🎉",
    "You crushed it! Keep going!",
    "That's another win in the books!",
    "So proud of you — you showed up!",
    "You're getting stronger every day!",
  ],
  stoic: [
    "The work is done. Rest now.",
    "You did what was required.",
    "Discipline executed. Move on.",
    "Another day of becoming.",
    "The deed is done. Tomorrow awaits.",
  ],
};

function Confetti() {
  const pieces = Array.from({ length: 30 });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {pieces.map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${6 + Math.random() * 8}px`,
          height: `${6 + Math.random() * 8}px`,
          borderRadius: Math.random() > 0.5 ? '50%' : '0',
          background: ['#c8f135', '#5b8dee', '#ff4d6d', '#ffd700'][Math.floor(Math.random() * 4)],
          left: `${Math.random() * 100}%`,
          top: `-${Math.random() * 20}px`,
          animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.8}s forwards`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

export default function CelebrationScreen({ mins, dayFocus, tone, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const messages = MESSAGES[tone] || MESSAGES.positive;
  const message = messages[Math.floor(Math.random() * messages.length)];

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
    const auto = setTimeout(onDismiss, 4000);
    return () => clearTimeout(auto);
  }, []);

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes celebFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(13,13,15,0.97)',
          zIndex: 200, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '40px',
          animation: 'celebFadeIn 0.3s ease forwards',
        }}
      >
        <Confetti />
        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>💪</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '48px', letterSpacing: '2px', color: 'var(--accent)', lineHeight: 1, marginBottom: '12px' }}>
            DAY COMPLETE
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '1px', color: 'var(--text)', marginBottom: '24px' }}>
            {dayFocus}
          </div>
          <div style={{ fontSize: '16px', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '32px', maxWidth: '280px' }}>
            "{message}"
          </div>
          {mins > 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 32px', display: 'inline-block', marginBottom: '32px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '48px', color: 'var(--accent)', lineHeight: 1 }}>{mins}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>mins</div>
            </div>
          )}
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Tap anywhere to continue</div>
        </div>
      </div>
    </>
  );
}