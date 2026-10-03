export default function HeroSection() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 32px 48px', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 1, height: 48, background: 'linear-gradient(to bottom, transparent, var(--cyan))'
      }} />

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)',
        letterSpacing: '0.3em', marginBottom: 20, textTransform: 'uppercase'
      }}>
        [ AI-POWERED DATABASE ARCHITECTURE ]
      </div>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(36px, 6vw, 72px)',
        fontWeight: 800, lineHeight: 1.05, marginBottom: 20
      }}>
        <span style={{ color: 'var(--text-primary)' }}>DESCRIBE YOUR APP.</span>
        <br />
        <span style={{
          background: 'linear-gradient(135deg, var(--cyan), var(--teal))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.4))',
        }}>
          GET THE SCHEMA.
        </span>
      </h1>

      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-secondary)',
        maxWidth: 560, margin: '0 auto', lineHeight: 1.7
      }}>
        Natural language in. Production-ready SQL, ERD diagrams, and migration files out.
        Deterministic validation. Zero hallucination.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 32 }}>
        <div style={{ height: 1, width: 80, background: 'linear-gradient(to right, transparent, var(--border-bright))' }} />
        <div style={{ width: 6, height: 6, transform: 'rotate(45deg)', border: '1px solid var(--cyan)', background: 'var(--cyan-glow)' }} />
        <div style={{ height: 1, width: 80, background: 'linear-gradient(to left, transparent, var(--border-bright))' }} />
      </div>
    </div>
  );
}