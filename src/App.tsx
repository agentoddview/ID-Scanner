import { useState } from "react";
import { GeneratorPanel } from "./features/generator/GeneratorPanel";
import { DecodeResultPanel } from "./features/results/DecodeResultPanel";
import { ImageDecodePanel } from "./features/scanner/ImageDecodePanel";
import { ScannerPanel } from "./features/scanner/ScannerPanel";
import { parseAamva } from "./lib/aamva/parseAamva";
import type { DecodeResult } from "./types/barcode";

type Tab = "scanner" | "generator";

function App() {
  const [tab, setTab] = useState<Tab>("scanner");
  const [latestResult, setLatestResult] = useState<DecodeResult | null>(null);
  const [history, setHistory] = useState<DecodeResult[]>([]);

  const onDecoded = (result: DecodeResult) => {
    const parsed = parseAamva(result.rawText);
    const enriched: DecodeResult = {
      ...result,
      parsedAamva: parsed,
    };

    setLatestResult(enriched);
    setHistory((previous) => [enriched, ...previous].slice(0, 20));
  };

  const clearLatest = () => setLatestResult(null);

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Local-Only PDF417 Toolkit</p>
        <h1>ID Scanner + SVG Generator</h1>
        <p>
          Scan PDF417 with webcam or image upload, parse AAMVA fields, and generate downloadable SVG barcodes.
        </p>
      </header>

      <nav className="tab-row" aria-label="Primary views">
        <button
          type="button"
          className={`tab ${tab === "scanner" ? "tab-active" : ""}`}
          onClick={() => setTab("scanner")}
        >
          Scanner
        </button>
        <button
          type="button"
          className={`tab ${tab === "generator" ? "tab-active" : ""}`}
          onClick={() => setTab("generator")}
        >
          Generator
        </button>
      </nav>

      {tab === "scanner" ? (
        <div className="layout-grid">
          <div className="stack-column">
            <ScannerPanel onDecoded={onDecoded} />
            <ImageDecodePanel onDecoded={onDecoded} />
          </div>

          <div className="stack-column">
            <DecodeResultPanel result={latestResult} onClear={clearLatest} />

            <section className="panel">
              <header className="panel-header">
                <h2>Session History</h2>
              </header>

              {history.length === 0 ? (
                <p className="muted">No scans in this session.</p>
              ) : (
                <ul className="history-list">
                  {history.map((entry) => (
                    <li key={entry.timestampIso}>
                      <button type="button" className="history-item" onClick={() => setLatestResult(entry)}>
                        <span>{entry.source}</span>
                        <strong>{new Date(entry.timestampIso).toLocaleTimeString()}</strong>
                        <code>{entry.rawText.slice(0, 54) || "(empty)"}</code>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      ) : (
        <div className="layout-single">
          <GeneratorPanel />
        </div>
      )}
    </main>
  );
}

export default App;
