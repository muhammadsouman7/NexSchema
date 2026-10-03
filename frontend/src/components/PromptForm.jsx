import { useState } from "react";

const EXAMPLES = [
  { label: "// HOSPITAL_SYS", text: "A hospital management system with patients, doctors, departments, appointments, admissions, rooms, prescriptions, lab tests, billing, pharmacy inventory, and staff management with RBAC." },
  { label: "// E_COMMERCE", text: "An e-commerce platform with products, categories, inventory, sellers, buyers, orders, order items, payments, reviews, and shipping tracking." },
  { label: "// SAAS_APP", text: "A SaaS project management app where users belong to organizations, create projects, assign tasks to members, track time, comment, and attach files. Include billing and subscription plans." },
  { label: "// SOCIAL_NET", text: "A social network with users, posts, stories, comments, likes, follows, direct messages, notifications, hashtags, and content moderation." },
];

export default function PromptForm({ onSubmit, loading }) {
  const [prompt, setPrompt] = useState("");
  const [dialect, setDialect] = useState("postgresql");
  const canSubmit = !loading && prompt.trim().length >= 20;

  return (
    <div className="nexcard" style={{ borderRadius: 2, padding: 32 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)', letterSpacing: '0.15em' }}>
          PROMPT_INPUT
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(0,212,255,0.3), transparent)' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          {prompt.length}/5000
        </div>
      </div>

      {/* Example buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {EXAMPLES.map((ex) => (
          <button key={ex.label} onClick={() => setPrompt(ex.text)} style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal-dim)',
            background: 'rgba(0,255,204,0.05)', border: '1px solid rgba(0,255,204,0.15)',
            padding: '4px 12px', cursor: 'pointer', letterSpacing: '0.05em', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(0,255,204,0.12)'; e.target.style.color = 'var(--teal)'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(0,255,204,0.05)'; e.target.style.color = 'var(--teal-dim)'; }}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Textarea with corner accents */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="> Describe your application architecture in plain English..."
          style={{
            width: '100%', minHeight: 160, padding: '16px',
            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,212,255,0.15)',
            color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13,
            lineHeight: 1.7, resize: 'vertical', outline: 'none', borderRadius: 2,
            transition: 'border-color 0.3s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(0,212,255,0.15)'}
        />
        <div style={{ position: 'absolute', top: -1, right: -1, width: 12, height: 12, borderTop: '2px solid var(--cyan)', borderRight: '2px solid var(--cyan)' }} />
        <div style={{ position: 'absolute', bottom: -1, left: -1, width: 12, height: 12, borderBottom: '2px solid var(--cyan)', borderLeft: '2px solid var(--cyan)' }} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.1em' }}>TARGET_DB</div>
          <select value={dialect} onChange={(e) => setDialect(e.target.value)} style={{
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,212,255,0.2)',
            color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: 11,
            padding: '6px 12px', cursor: 'pointer', outline: 'none',
          }}>
            <option value="postgresql">POSTGRESQL</option>
            <option value="mysql">MYSQL</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          <span>AI: LLAMA-3.3-70B</span>
          <span>VALIDATION: DETERMINISTIC</span>
        </div>

        <button className="btn-neon"
          onClick={() => onSubmit({ prompt, dialect, include_erd: true, include_migrations: true })}
          disabled={!canSubmit}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          {loading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: 'spin-slow 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              PROCESSING...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              GENERATE SCHEMA
            </>
          )}
        </button>
      </div>

      {/* Loading bar */}
      {loading && (
        <div style={{ marginTop: 16, height: 2, background: 'rgba(0,212,255,0.1)', overflow: 'hidden', borderRadius: 1 }}>
          <div style={{
            height: '100%', width: '40%',
            background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
            animation: 'shimmer 1.5s ease-in-out infinite',
            backgroundSize: '200% 100%',
          }} />
        </div>
      )}
    </div>
  );
}