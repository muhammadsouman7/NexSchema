export default function InfoBanner({ assumptions, ambiguities, warnings }) {
  const items = [
    ...warnings.map((w) => ({ type: "warning", label: "WARN", text: w.message, sub: w.suggestion, color: 'var(--amber)', bg: 'rgba(255,184,0,0.05)', border: 'rgba(255,184,0,0.2)' })),
    ...ambiguities.map((a) => ({ type: "ambiguity", label: "AMBIGUOUS", text: a, color: 'var(--cyan)', bg: 'rgba(0,212,255,0.05)', border: 'rgba(0,212,255,0.15)' })),
    ...assumptions.map((a) => ({ type: "assumption", label: "ASSUMED", text: a, color: 'var(--green)', bg: 'rgba(0,255,136,0.05)', border: 'rgba(0,255,136,0.15)' })),
  ];
  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          padding: '10px 16px', background: item.bg,
          border: `1px solid ${item.border}`,
          borderLeft: `3px solid ${item.color}`,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: item.color, letterSpacing: '0.1em', whiteSpace: 'nowrap', marginTop: 1 }}>
            [{item.label}]
          </span>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{item.text}</span>
            {item.sub && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{item.sub}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}