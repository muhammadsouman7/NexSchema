import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { downloadFile } from "../utils/download";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    background: '#050d15',
    primaryColor: '#0d1f35',
    primaryTextColor: '#e8f4ff',
    primaryBorderColor: '#00d4ff',
    lineColor: '#00d4ff',
    secondaryColor: '#112440',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '12px',
  },
  er: { diagramPadding: 30, layoutDirection: 'TB', minEntityWidth: 100, minEntityHeight: 75, entityPadding: 15 },
});

export default function ErdViewer({ mermaidCode }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!ref.current || !mermaidCode) return;
    setError(null); setRendered(false);
    const id = "erd-" + Date.now();
    mermaid.render(id, mermaidCode)
      .then(({ svg }) => {
        if (ref.current) { ref.current.innerHTML = svg; setRendered(true); }
      })
      .catch((e) => setError("ERD render failed: " + e.message));
  }, [mermaidCode]);

  const downloadSvg = () => {
    const svgEl = ref.current?.querySelector('svg');
    if (!svgEl) return;
    downloadFile('nexschema-erd.svg', new XMLSerializer().serializeToString(svgEl), 'image/svg+xml');
  };

  const downloadPng = () => {
    const svgEl = ref.current?.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const scale = 3;
    const bbox = svgEl.getBoundingClientRect();
    canvas.width = (bbox.width || 1200) * scale;
    canvas.height = (bbox.height || 800) * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050d15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
        img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => blob && downloadFile('nexschema-erd.png', blob), 'image/png');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const downloadMermaid = () => downloadFile('nexschema-erd.mmd', mermaidCode);

  if (error) return (
    <div className="nexcard" style={{ padding: 24, borderLeft: '3px solid var(--red)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)' }}>[ERR] {error}</span>
    </div>
  );

  return (
    <div className="nexcard" style={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)', flex: 1, letterSpacing: '0.1em' }}>
          ERD_DIAGRAM
          {rendered && <span style={{ color: 'var(--green)', marginLeft: 12 }}>● RENDERED</span>}
        </div>
        <button onClick={downloadMermaid} className="btn-neon" style={{ padding: '5px 12px', fontSize: 10 }}>↓ .MMD</button>
        <button onClick={downloadSvg} className="btn-neon" style={{ padding: '5px 12px', fontSize: 10 }}>↓ SVG</button>
        <button onClick={downloadPng} className="btn-neon" style={{ padding: '5px 12px', fontSize: 10, borderColor: 'var(--teal)', color: 'var(--teal)' }}>↓ PNG</button>
      </div>

      {/* Diagram */}
      <div style={{ padding: 24, background: 'rgba(0,0,0,0.2)', minHeight: 300, overflowX: 'auto' }}>
        <div ref={ref} style={{ display: 'flex', justifyContent: 'center' }} />
        {!rendered && !error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ marginRight: 8 }}>RENDERING ERD</span>
            <span className="cursor-blink">_</span>
          </div>
        )}
      </div>

      {/* Mermaid source toggle */}
      <details style={{ borderTop: '1px solid var(--border)' }}>
        <summary style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', cursor: 'pointer', letterSpacing: '0.1em' }}>
          VIEW_SOURCE
        </summary>
        <pre style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', overflowX: 'auto', maxHeight: 200, background: 'rgba(0,0,0,0.3)', margin: 0 }}>
          {mermaidCode}
        </pre>
      </details>
    </div>
  );
}