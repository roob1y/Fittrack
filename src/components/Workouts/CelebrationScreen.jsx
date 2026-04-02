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

const COLORS = [
  [0.784, 0.945, 0.208], // #c8f135 lime
  [0.357, 0.545, 0.933], // #5b8dee blue
  [1.0, 0.302, 0.427], // #ff4d6d red
  [1.0, 0.843, 0.0], // #ffd700 gold
  [1.0, 1.0, 1.0], // #ffffff white
  [1.0, 0.549, 0.259], // #ff8c42 orange
  [0.702, 0.533, 1.0], // #b388ff purple
];

function ConfettiCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    // Resize to logical pixels — no DPR multiplication, that's the whole point
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // ── Shaders ──────────────────────────────────────────────
    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_offset;
      attribute float a_rotation;
      attribute vec2 a_scale;
      attribute vec4 a_color;
      attribute float a_alpha;

      uniform vec2 u_resolution;

      varying vec4 v_color;
      varying float v_alpha;

      void main() {
        float c = cos(a_rotation);
        float s = sin(a_rotation);
        vec2 scaled = a_position * a_scale;
        vec2 rotated = vec2(
          scaled.x * c - scaled.y * s,
          scaled.x * s + scaled.y * c
        );
        vec2 world = rotated + a_offset;
        vec2 clip = (world / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
        v_color = a_color;
        v_alpha = a_alpha;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec4 v_color;
      varying float v_alpha;
      void main() {
        gl_FragColor = vec4(v_color.rgb, v_alpha);
      }
    `;

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // ── Particle geometry — a unit quad ──────────────────────
    // Each confetti piece is a rectangle drawn as 2 triangles
    const quadVerts = new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]);
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(uResolution, canvas.width, canvas.height);

    // ── Per-instance buffers ──────────────────────────────────
    const COUNT = 120;
    const offsets = new Float32Array(COUNT * 2);
    const rotations = new Float32Array(COUNT);
    const scales = new Float32Array(COUNT * 2);
    const colors = new Float32Array(COUNT * 4);
    const alphas = new Float32Array(COUNT);

    // Physics state
    const vx = new Float32Array(COUNT);
    const vy = new Float32Array(COUNT);
    const vr = new Float32Array(COUNT); // angular velocity

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Confetti shapes: [width, height]
    const SHAPES = [
      [6, 18], // tall thin strip
      [14, 5], // wide flat
      [8, 8], // square
      [16, 6], // long flat
      [5, 20], // very thin tall
      [10, 10], // bigger square
    ];

    for (let i = 0; i < COUNT; i++) {
      // Start at centre
      offsets[i * 2] = cx;
      offsets[i * 2 + 1] = cy;

      // Burst velocity — spread across full 360° but bias upward
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 10;
      vx[i] = Math.cos(angle) * speed;
      // Bias upward: subtract from vy so more pieces go up
      vy[i] = Math.sin(angle) * speed - (5 + Math.random() * 6);

      // Angular velocity — spin as they fall
      vr[i] = (Math.random() - 0.5) * 0.25;

      // Random shape
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      scales[i * 2] = shape[0];
      scales[i * 2 + 1] = shape[1];

      // Random color
      const col = COLORS[Math.floor(Math.random() * COLORS.length)];
      colors[i * 4] = col[0];
      colors[i * 4 + 1] = col[1];
      colors[i * 4 + 2] = col[2];
      colors[i * 4 + 3] = 1.0;

      rotations[i] = Math.random() * Math.PI * 2;
      alphas[i] = 1.0;
    }

    // Create per-instance attribute buffers
    function makeInstanceBuf(data) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      return buf;
    }

    const offsetBuf = makeInstanceBuf(offsets);
    const rotationBuf = makeInstanceBuf(rotations);
    const scaleBuf = makeInstanceBuf(scales);
    const colorBuf = makeInstanceBuf(colors);
    const alphaBuf = makeInstanceBuf(alphas);

    const ext = gl.getExtension('ANGLE_instanced_arrays');

    function bindInstanced(buf, attrib, size, divisor) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(attrib);
      gl.vertexAttribPointer(attrib, size, gl.FLOAT, false, 0, 0);
      ext.vertexAttribDivisorANGLE(attrib, divisor);
    }

    const aOffset = gl.getAttribLocation(program, 'a_offset');
    const aRotation = gl.getAttribLocation(program, 'a_rotation');
    const aScale = gl.getAttribLocation(program, 'a_scale');
    const aColor = gl.getAttribLocation(program, 'a_color');
    const aAlpha = gl.getAttribLocation(program, 'a_alpha');

    bindInstanced(offsetBuf, aOffset, 2, 1);
    bindInstanced(rotationBuf, aRotation, 1, 1);
    bindInstanced(scaleBuf, aScale, 2, 1);
    bindInstanced(colorBuf, aColor, 4, 1);
    bindInstanced(alphaBuf, aAlpha, 1, 1);

    // ── Physics constants ─────────────────────────────────────
    const GRAVITY = 0.38;
    const AIR_RESIST_X = 0.992;
    const AIR_RESIST_Y = 1;
    const FADE_START = 0; // seconds before fade begins
    const TOTAL_TIME = 7;

    let startTime = null;
    let rafId;

    function updateBuffer(buf, data) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    }

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      if (elapsed > TOTAL_TIME) {
        cancelAnimationFrame(rafId);
        return;
      }

      // Update physics
      for (let i = 0; i < COUNT; i++) {
        vy[i] += GRAVITY;
        vx[i] *= AIR_RESIST_X;
        vy[i] *= AIR_RESIST_Y;

        offsets[i * 2] += vx[i];
        offsets[i * 2 + 1] += vy[i];

        rotations[i] += vr[i];

        // Fade out in last portion
        if (elapsed > FADE_START) {
          alphas[i] = Math.max(0, 1 - (elapsed - FADE_START) / (TOTAL_TIME - FADE_START));
        }
      }

      // Upload updated data
      updateBuffer(offsetBuf, offsets);
      updateBuffer(rotationBuf, rotations);
      updateBuffer(alphaBuf, alphas);

      // Draw
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Bind quad geometry
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
      ext.vertexAttribDivisorANGLE(aPosition, 0);

      ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, COUNT);

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
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
          position: 'fixed',
          inset: 0,
          background: 'rgba(13,13,15,0.97)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          animation: 'celebFadeIn 0.3s ease forwards',
        }}
      >
        <ConfettiCanvas />
        <div style={{ textAlign: 'center', zIndex: 1, position: 'relative' }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>💪</div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '48px',
              letterSpacing: '2px',
              color: 'var(--accent)',
              lineHeight: 1,
              marginBottom: '12px',
            }}
          >
            DAY COMPLETE
          </div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '22px',
              letterSpacing: '1px',
              color: 'var(--text)',
              marginBottom: '24px',
            }}
          >
            {dayFocus}
          </div>
          <div
            style={{
              fontSize: '16px',
              color: 'var(--muted)',
              fontStyle: 'italic',
              lineHeight: 1.5,
              marginBottom: '32px',
              maxWidth: '280px',
            }}
          >
            "{message}"
          </div>
          {mins > 0 && (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px 32px',
                display: 'inline-block',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '48px',
                  color: 'var(--accent)',
                  lineHeight: 1,
                }}
              >
                {mins}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                mins
              </div>
            </div>
          )}
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Tap anywhere to continue</div>
        </div>
      </div>
    </>
  );
}
