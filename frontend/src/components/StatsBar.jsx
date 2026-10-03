export default function StatsBar({ tables, warnings, iterations, domain }) {
  const stats = [
    { label: "TABLES_GENERATED", value: tables, color: 'var(--cyan)' },
    { label: "WARNINGS", value: warnings, color: warnings > 0 ? 'var(--amber)' : 'var(--green)' },
    { label: "AI_ITERATIONS", value: iterations, color: 'var(--teal)' },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      {stats.map((s) => (
        <div key={s.label} className="nexcard" style={{ padding: '16px 24px', borderRadius: 2 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
            {s.value}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 6, letterSpacing: '0.15em' }}>
            {s.label}
          </div>
        </div>
      ))}
      {domain && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: 8, maxWidth: 400, lineHeight: 1.5 }}>
          <span style={{ color: 'var(--cyan)' }}>// </span>{domain}
        </div>
      )}
    </div>
  );
}