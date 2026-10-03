import { useEffect, useState } from "react";

export default function Header() {
  const [time, setTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSmall, setIsSmall] = useState(window.innerWidth < 480);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmall(window.innerWidth < 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header style={{
      borderBottom: '1px solid rgba(0,212,255,0.1)',
      background: 'rgba(5,13,21,0.95)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        padding: isMobile ? '0 16px' : '0 32px',
        height: isMobile ? 56 : 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>

        {/* Logo — always visible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexShrink: 0 }}>
          <img
            src="/nexschema-logo.png"
            alt="NexSchema Logo"
            style={{
              width: isMobile ? 32 : 42,
              height: isMobile ? 32 : 42,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: isSmall ? 15 : isMobile ? 17 : 20,
              fontWeight: 700, color: 'var(--cyan)',
              letterSpacing: '0.08em', lineHeight: 1,
            }}>
              NEX<span style={{ color: 'var(--text-primary)' }}>SCHEMA</span>
            </div>
            {/* Subtitle hidden on very small screens */}
            {!isSmall && (
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 8,
                color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: 2,
              }}>
                DATABASE ARCHITECT AI
              </div>
            )}
          </div>
        </div>

        {/* Center status — hidden on mobile, shown on tablet+ */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--green)', boxShadow: '0 0 6px var(--green)',
              }} />
              <span style={{ color: 'var(--green)' }}>SYSTEM ONLINE</span>
            </div>
            <div style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* On mobile: just the green dot + time */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 6 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--green)', boxShadow: '0 0 6px var(--green)',
              }} />
              {!isSmall && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  {time.toLocaleTimeString('en-US', { hour12: false })}
                </span>
              )}
            </div>
          )}

          {/* Version badge — always show */}
          <span style={{
            padding: isSmall ? '3px 7px' : '4px 10px',
            border: '1px solid rgba(0,212,255,0.15)',
            color: 'var(--cyan-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: isSmall ? 9 : 10,
          }}>
            v1.0.0
          </span>

          {/* Model badge — hide on small screens */}
          {!isSmall && (
            <span style={{
              padding: '4px 10px',
              border: '1px solid rgba(0,255,204,0.15)',
              color: 'var(--teal-dim)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
            }}>
              {isMobile ? 'GROQ' : 'GROQ · LLAMA-3.3'}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}