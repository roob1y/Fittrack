import React, { useEffect, useState, useRef, useMemo } from 'react';

const MESSAGES = {
  hardcore: [
    'BEAST MODE ACTIVATED.',
    "THAT'S HOW IT'S DONE.",
    'NO DAYS OFF. NO EXCUSES.',
    'ANOTHER DAY. ANOTHER WIN.',
    'YOU EARNED IT. NOW RECOVER.',
  ],
  positive: [
    'Amazing work today! 🎉',
    'You crushed it! Keep going!',
    "That's another win in the books!",
    'So proud of you — you showed up!',
    "You're getting stronger every day!",
  ],
  stoic: [
    'The work is done. Rest now.',
    'You did what was required.',
    'Discipline executed. Move on.',
    'Another day of becoming.',
    'The deed is done. Tomorrow awaits.',
  ],
};

const COLORS = ['#c8f135', '#5b8dee', '#ff4d6d', '#ffd700', '#ffffff', '#ff8c42'];

function FireworksCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();

    const particles = [];

    function createBurst(x, y) {
      const count = 80 + Math.floor(Math.random() * 40);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
        // Bias upward: reduce downward velocity
        const speed = 3 + Math.random() * 6;
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        // Bias upward by subtracting from vy
        vy -= 2 + Math.random() * 2;

        particles.push({
          x,
          y,
          vx,
          vy,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 1,
          decay: 0.012 + Math.random() * 0.008,
          size: 3 + Math.random() * 4,
          gravity: 0.12 + Math.random() * 0.06,
          isSquare: Math.random() > 0.6,
        });
      }
    }

    // Fire first burst immediately from centre
    createBurst(canvas.width / 2, canvas.height / 2);

    // Then re-burst every 1.8s
    const burstInterval = setInterval(() => {
      // Vary the x slightly, keep y near centre/upper area
      const x = canvas.width * (0.3 + Math.random() * 0.4);
      const y = canvas.height * (0.3 + Math.random() * 0.3);
      createBurst(x, y);
    }, 1800);

    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      // Fade trail — semi-transparent clear gives motion blur effect
      ctx.fillStyle = 'rgba(13, 13, 15, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity; // gravity
        p.vx *= 0.98;      // air resistance
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.isSquare) {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(burstInterval);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}

export default function CelebrationScreen({ mins, dayFocus, tone, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const messages = MESSAGES[tone] || MESSAGES.positive;
  const message = useMemo(() => messages[Math.floor(Math.random() * messages.length)], [tone]);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
    const auto = setTimeout(onDismiss, 4000);
    return () => clearTimeout(auto);
  }, []);

  return (
    <>
      <style>{`
        @keyframes celebFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(13,13,15,0.97)',
          zIndex: 200, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '40px',
          animation: 'celebFadeIn 0.3s ease forwards',
        }}
      >
        <FireworksCanvas />
        <div style={{ textAlign: 'center', zIndex: 1, position: 'relative' }}>
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