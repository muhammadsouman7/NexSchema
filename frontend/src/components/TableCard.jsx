import { useState, useEffect } from "react";

const TYPE_CLASS = {
  UUID: 'type-uuid', INTEGER: 'type-integer', BIGINT: 'type-bigint',
  SMALLINT: 'type-integer', VARCHAR: 'type-varchar', TEXT: 'type-text',
  BOOLEAN: 'type-boolean', TIMESTAMPTZ: 'type-timestamptz', TIMESTAMP: 'type-timestamp',
  DATE: 'type-date', JSONB: 'type-jsonb', DECIMAL: 'type-decimal', FLOAT: 'type-float',
};

export default function TableCard({ table, index }) {
  const [expanded, setExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pkCols = new Set(table.primary_key || []);
  const fkCols = new Set(table.columns.filter(c => c.is_foreign_key).map(c => c.name));

  // Responsive grid: hide UQ column on mobile
  const gridCols = isMobile
    ? '20px 1fr 90px 60px'
    : '20px 1fr 110px 70px 30px';
  const headers = isMobile
    ? ['', 'COLUMN', 'TYPE', 'NULL']
    : ['', 'COLUMN', 'TYPE', 'NULL', 'UQ'];

  return (
    <div
      className="nexcard animate-fade-up"
      style={{
        borderRadius: 2,
        overflow: 'hidden',
        animationDelay: `${index * 0.04}s`,
        opacity: 0,
        animationFillMode: 'forwards',
        // Equal margin on both sides on all screens
        margin: '0 0',
        width: '100%',
      }}
    >
      {/* Table header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: isMobile ? '12px 14px' : '14px 18px',
          cursor: 'pointer',
          background: table.is_junction_table
            ? 'rgba(0,255,204,0.04)'
            : 'rgba(0,212,255,0.05)',
          borderBottom: expanded ? '1px solid var(--border)' : 'none',
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = table.is_junction_table ? 'rgba(0,255,204,0.08)' : 'rgba(0,212,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = table.is_junction_table ? 'rgba(0,255,204,0.04)' : 'rgba(0,212,255,0.05)'}
      >
        {/* Index number */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-muted)', width: 24, flexShrink: 0,
        }}>
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Table name */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: isMobile ? 11 : 13,
          fontWeight: 600,
          color: table.is_junction_table ? 'var(--teal)' : 'var(--cyan)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {table.name}
        </div>

        {/* Junction badge — hide text on mobile, show dot */}
        {table.is_junction_table && (
          isMobile ? (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--teal)', flexShrink: 0,
            }} />
          ) : (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--teal-dim)',
              border: '1px solid rgba(0,255,204,0.2)',
              padding: '2px 8px', letterSpacing: '0.1em', flexShrink: 0,
            }}>
              JUNCTION
            </span>
          )
        )}

        {/* Column count */}
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', flexShrink: 0,
        }}>
          {table.columns.length} cols
        </span>

        {/* Expand arrow */}
        <span style={{
          color: 'var(--text-muted)', fontSize: 12, flexShrink: 0,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
        }}>▾</span>
      </div>

      {/* Comment */}
      {expanded && table.comment && (
        <div style={{
          padding: isMobile ? '6px 14px' : '8px 18px',
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          <span style={{ color: 'var(--teal-dim)' }}>// </span>{table.comment}
        </div>
      )}

      {/* Column list */}
      {expanded && (
        <div style={{ overflowX: 'auto' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            gap: 8,
            padding: isMobile ? '6px 14px' : '6px 18px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(0,0,0,0.2)',
            minWidth: isMobile ? 0 : 'auto',
          }}>
            {headers.map((h, i) => (
              <span key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                color: 'var(--text-muted)', letterSpacing: '0.1em',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Column rows */}
          {table.columns.map((col) => (
            <div
              key={col.name}
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                gap: 8,
                padding: isMobile ? '7px 14px' : '7px 18px',
                borderBottom: '1px solid rgba(0,212,255,0.04)',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Key icon */}
              <div style={{ fontSize: 10, flexShrink: 0 }}>
                {pkCols.has(col.name) && (
                  <span title="Primary Key" style={{ color: 'var(--amber)' }}>◆</span>
                )}
                {!pkCols.has(col.name) && fkCols.has(col.name) && (
                  <span title="Foreign Key" style={{ color: 'var(--cyan)' }}>◇</span>
                )}
              </div>

              {/* Column name */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: isMobile ? 11 : 12,
                color: pkCols.has(col.name) ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: pkCols.has(col.name) ? 600 : 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {col.name}
              </span>

              {/* Type badge */}
              <span
                className={TYPE_CLASS[col.type] || 'type-varchar'}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: isMobile ? 9 : 10,
                  padding: '2px 6px',
                  borderRadius: 2,
                  display: 'inline-block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.type}
              </span>

              {/* Nullable */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: isMobile ? 9 : 10,
                color: col.nullable ? 'var(--text-muted)' : 'rgba(255,68,102,0.8)',
              }}>
                {col.nullable ? 'NULL' : 'NOT NULL'}
              </span>

              {/* Unique — desktop only */}
              {!isMobile && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--teal-dim)' }}>
                  {col.unique ? 'UQ' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}