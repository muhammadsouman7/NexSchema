import { useState, useEffect } from "react";

const SOCIAL_LINKS = [
  {
    href: "https://www.instagram.com/m_souman.07/",
    label: "Instagram",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: "https://www.facebook.com/souman.07/",
    label: "Facebook",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    href: "https://x.com/MuhammadSouman1",
    label: "X / Twitter",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    href: "https://www.linkedin.com/in/muhammad-souman-057705230/",
    label: "LinkedIn",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
];

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <footer style={{
      zIndex: 100,
      background: 'rgba(5,13,21,0.97)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0,212,255,0.1)',
      boxShadow: '0 -4px 30px rgba(0,0,0,0.6)',
      padding: isMobile ? '10px 16px' : '10px 32px',
    }}>

      {/* Top cyan line accent */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)',
      }} />

      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 10 : 0,
      }}>

        {/* Copyright — dynamic year */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: isMobile ? 11 : 12,
          color: 'var(--text-muted)',
          letterSpacing: '0.05em',
          textAlign: isMobile ? 'center' : 'left',
        }}>
          <span style={{ color: 'var(--text-muted)' }}>© {CURRENT_YEAR} </span>
          <span style={{ color: 'var(--text-secondary)' }}>Made by </span>
        <a
            href="https://somy.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--cyan)',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--teal)'}
            onMouseLeave={e => e.target.style.color = 'var(--cyan)'}
          >
            Somy
          </a>
        </div>

        {/* Mobile divider */}
        {isMobile && (
          <div style={{
            width: 60,
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(0,212,255,0.3), transparent)',
          }} />
        )}

        {/* Social links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {SOCIAL_LINKS.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                border: hoveredIndex === i
                  ? '1px solid rgba(0,212,255,0.5)'
                  : '1px solid rgba(0,212,255,0.12)',
                background: hoveredIndex === i
                  ? 'rgba(0,212,255,0.1)'
                  : 'transparent',
                color: hoveredIndex === i
                  ? 'var(--cyan)'
                  : 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'all 0.25s ease',
                transform: hoveredIndex === i ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoveredIndex === i
                  ? '0 4px 15px rgba(0,212,255,0.2)'
                  : 'none',
              }}>
              {link.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}