import { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import PromptForm from "./components/PromptForm";
import TableCard from "./components/TableCard";
import SqlViewer from "./components/SqlViewer";
import ErdViewer from "./components/ErdViewer";
import InfoBanner from "./components/InfoBanner";
import StatsBar from "./components/StatsBar";
import { generateSchema } from "./api/client";
import Footer from "./components/Footer";

const TABS = [
  { id: "Tables", label: "TABLES", icon: "⬡" },
  { id: "SQL", label: "SQL", icon: "{ }" },
  { id: "ERD Diagram", label: "ERD_DIAGRAM", icon: "◈" },
];

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("Tables");

  const handleSubmit = async (data) => {
    setLoading(true); setResult(null);
    try {
      const res = await generateSchema(data);
      setResult(res.data);
      setTab("Tables");
      toast.success(
        `${res.data.tables.length} tables · ${res.data.iterations_taken} iteration${res.data.iterations_taken !== 1 ? 's' : ''}`,
        { style: { background: '#0d1f35', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }, duration: 4000 }
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = detail?.message || (typeof detail === 'string' ? detail : null) || err.message || "Schema generation failed";
      const isRejection = detail?.code === "INVALID_PROMPT";
      toast.error(msg, {
        icon: isRejection ? '🚫' : '⚠',
        duration: isRejection ? 7000 : 6000,
        style: { background: '#1a0a10', color: '#ff4466', border: '1px solid rgba(255,68,102,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 },
        duration: 6000
      });
    } finally { setLoading(false); }
  };

  return (
    <div className="grid-bg" style={{ minHeight: '100vh' }}>
      <Toaster position="top-right" />

      {/* Ambient glow orbs */}
      <div style={{ position: 'fixed', top: '20%', left: '5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,204,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Header />

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px 120px', position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <PromptForm onSubmit={handleSubmit} loading={loading} />

        {result && (
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Output divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, var(--border-bright))' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: '0.2em' }}>OUTPUT_READY</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, var(--border-bright))' }} />
            </div>

            <StatsBar
              tables={result.tables.length}
              warnings={result.validation_warnings.length}
              iterations={result.iterations_taken}
              domain={result.domain_context}
            />

            <InfoBanner
              assumptions={result.ai_assumptions}
              ambiguities={result.ai_ambiguities}
              warnings={result.validation_warnings}
            />

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)' }}>
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
                  padding: '10px 24px', cursor: 'pointer', border: 'none',
                  background: tab === t.id ? 'rgba(0,212,255,0.1)' : 'transparent',
                  color: tab === t.id ? 'var(--cyan)' : 'var(--text-muted)',
                  borderBottom: tab === t.id ? '2px solid var(--cyan)' : '2px solid transparent',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8, marginBottom: -1,
                }}>
                  <span>{t.icon}</span>
                  {t.label}
                  {t.id === "Tables" && (
                    <span style={{ background: 'rgba(0,212,255,0.15)', color: 'var(--cyan)', padding: '1px 7px', fontSize: 9, borderRadius: 2 }}>
                      {result.tables.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === "Tables" && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(480px, 100%), 1fr))',
                gap: 12,
                padding: '0 0',
                width: '100%',
                boxSizing: 'border-box',
              }}>
                {result.tables.map((t, i) => <TableCard key={t.name} table={t} index={i} />)}
              </div>
            )}
            {tab === "SQL" && <SqlViewer sqlFiles={result.sql_files} />}
            {tab === "ERD Diagram" && result.erd_mermaid && <ErdViewer mermaidCode={result.erd_mermaid} />}
            {tab === "ERD Diagram" && !result.erd_mermaid && (
              <div className="nexcard" style={{ padding: 48, textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>NO ERD DATA</span>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}