import type { DecodeResult } from "../../types/barcode";

interface DecodeResultPanelProps {
  result: DecodeResult | null;
  onClear: () => void;
}

const labelFromKey = (key: string): string =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();

export function DecodeResultPanel({ result, onClear }: DecodeResultPanelProps) {
  if (!result) {
    return (
      <section className="panel result-panel">
        <header className="panel-header">
          <h2>Decode Result</h2>
        </header>
        <p className="muted">No barcode has been decoded yet.</p>
      </section>
    );
  }

  const parsed = result.parsedAamva;

  return (
    <section className="panel result-panel">
      <header className="panel-header panel-header-row">
        <h2>Decode Result</h2>
        <button type="button" className="button button-secondary" onClick={onClear}>
          Clear
        </button>
      </header>

      <div className="result-meta">
        <span>
          <strong>Source:</strong> {result.source}
        </span>
        <span>
          <strong>Format:</strong> {result.format}
        </span>
        <span>
          <strong>Scanned:</strong> {new Date(result.timestampIso).toLocaleString()}
        </span>
      </div>

      <label className="field-label" htmlFor="decoded-raw-payload">
        Raw payload
      </label>
      <textarea id="decoded-raw-payload" className="payload-box" value={result.rawText} readOnly rows={10} />

      <div className="parsed-section">
        <h3>AAMVA Parse</h3>
        {!parsed ? <p className="muted">No parse data available.</p> : null}

        {parsed && parsed.version ? (
          <p>
            <strong>Detected version:</strong> {parsed.version}
          </p>
        ) : null}

        {parsed && parsed.warnings.length > 0 ? (
          <ul className="warning-list">
            {parsed.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}

        {parsed && Object.keys(parsed.fields).length > 0 ? (
          <dl className="parsed-grid">
            {Object.entries(parsed.fields).map(([key, value]) => (
              <div key={key}>
                <dt>{labelFromKey(key)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="muted">No mapped AAMVA fields found.</p>
        )}
      </div>
    </section>
  );
}
