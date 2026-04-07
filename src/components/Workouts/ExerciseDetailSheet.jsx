import React, { useEffect } from 'react';

export default function ExerciseDetailSheet({ ex, onClose }) {
  const resolvedName = ex.superset ? `${ex.name} + ${ex.superset.name}` : ex.name;

  const allEquipment = [...(ex.equipment || []), ...(ex.superset?.equipment || [])].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  // ADD this inside the component, before the return
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 120,
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 121,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 40px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: '36px',
            height: '4px',
            background: 'var(--border)',
            borderRadius: '2px',
            margin: '0 auto 20px',
          }}
        />

        {/* Name */}
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '22px',
            letterSpacing: '1px',
            color: 'var(--text)',
            marginBottom: '8px',
            lineHeight: 1.2,
          }}
        >
          {resolvedName}
        </div>

        {/* Description */}
        {ex.description && (
          <div
            style={{
              fontSize: '14px',
              color: 'var(--muted)',
              lineHeight: 1.6,
              marginBottom: '16px',
            }}
          >
            {ex.description}
          </div>
        )}

        {/* Equipment tags */}
        {allEquipment.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
            {allEquipment.map((e) => (
              <span
                key={e}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  background: 'rgba(200,241,53,0.08)',
                  border: '1px solid rgba(200,241,53,0.2)',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  letterSpacing: '0.3px',
                }}
              >
                {e}
              </span>
            ))}
          </div>
        )}

        {/* How to */}
        {ex.howTo && ex.howTo.length > 0 && (
          <>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              How to perform
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ex.howTo.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: '#0d0d0f',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6 }}>{step}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
