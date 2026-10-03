import { useState } from "react";
import { downloadFile, downloadMany } from "../utils/download";

export default function SqlViewer({ sqlFiles }) {
  const [active, setActive] = useState(Object.keys(sqlFiles)[0]);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(sqlFiles[active]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const lines = sqlFiles[active].split('\n');

  return (
    <div className="nexcard" style={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
          {Object.keys(sqlFiles).map((f) => (
            <button key={f} onClick={() => setActive(f)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 12px',
              background: active === f ? 'rgba(0,212,255,0.15)' : 'transparent',
              border: active === f ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(0,212,255,0.1)',
              color: active === f ? 'var(--cyan)' : 'var(--text-muted)',
              cursor: 'pointer', letterSpacing: '0.05em', transition: 'all 0.2s',
            }}>{f}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={copy} className="btn-neon" style={{ padding: '5px 14px', fontSize: 10 }}>
            {copied ? '✓ COPIED' : '⎘ COPY'}
          </button>
          <button onClick={() => downloadFile(active, sqlFiles[active])} className="btn-neon" style={{ padding: '5px 14px', fontSize: 10 }}>
            ↓ SAVE
          </button>
          <button onClick={() => downloadMany(sqlFiles)} className="btn-neon" style={{ padding: '5px 14px', fontSize: 10, borderColor: 'var(--teal)', color: 'var(--teal)' }}>
            ↓ ALL FILES
          </button>
        </div>
      </div>

      {/* Code with line numbers */}
      <div style={{ display: 'flex', maxHeight: 540, overflowY: 'auto' }}>
        <div style={{ padding: '16px 0', background: 'rgba(0,0,0,0.3)', borderRight: '1px solid var(--border)', minWidth: 48, userSelect: 'none', flexShrink: 0 }}>
          {lines.map((_, i) => (
            <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', padding: '0 10px', lineHeight: '1.75em', opacity: 0.4 }}>
              {i + 1}
            </div>
          ))}
        </div>
        <pre style={{ flex: 1, padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: '1.75em', overflowX: 'auto', background: 'transparent', margin: 0 }}>
          {lines.map((line, i) => {
            let color = '#a8d8f0';
            if (line.trim().startsWith('--')) color = '#3d6080';
            else if (/^(CREATE|ALTER|DROP|BEGIN|COMMIT)/i.test(line.trim())) color = '#00d4ff';
            else if (/\b(TABLE|INDEX|CONSTRAINT|PRIMARY|FOREIGN|KEY|REFERENCES|NOT NULL|UNIQUE|DEFAULT)\b/i.test(line)) color = '#00ffcc';
            else if (/\b(UUID|VARCHAR|TEXT|INTEGER|BIGINT|BOOLEAN|TIMESTAMPTZ|TIMESTAMP|DATE|JSONB|DECIMAL|FLOAT)\b/i.test(line)) color = '#a78bfa';
            return <span key={i} style={{ color, display: 'block' }}>{line || ' '}</span>;
          })}
        </pre>
      </div>
    </div>
  );
}