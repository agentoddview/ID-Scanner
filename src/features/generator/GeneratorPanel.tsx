import { useMemo, useState } from "react";
import { buildAamva08Payload } from "../../lib/aamva/buildAamva08";
import { generatePdf417Svg } from "../../lib/generator/pdf417Svg";
import type { Aamva08FormInput } from "../../types/barcode";

type GeneratorMode = "raw" | "aamva";

const EMPTY_FORM: Aamva08FormInput = {
  firstName: "",
  lastName: "",
  dob: "",
  expiry: "",
  documentNumber: "",
  issuerIIN: "",
  sex: "",
  address1: "",
  city: "",
  jurisdictionCode: "",
  postalCode: "",
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Barcode generation failed.";
};

export function GeneratorPanel() {
  const [mode, setMode] = useState<GeneratorMode>("raw");
  const [rawPayload, setRawPayload] = useState("");
  const [form, setForm] = useState<Aamva08FormInput>(EMPTY_FORM);
  const [scale, setScale] = useState(3);
  const [height, setHeight] = useState(9);
  const [padding, setPadding] = useState(8);
  const [svg, setSvg] = useState("");
  const [resolvedPayload, setResolvedPayload] = useState("");
  const [error, setError] = useState<string | null>(null);

  const payloadPreview = useMemo(() => {
    if (mode === "raw") {
      return rawPayload.trim();
    }

    try {
      return buildAamva08Payload(form);
    } catch {
      return "";
    }
  }, [mode, rawPayload, form]);

  const updateForm = (key: keyof Aamva08FormInput, value: string) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const onGenerate = () => {
    setError(null);

    try {
      const payload = mode === "raw" ? rawPayload.trim() : buildAamva08Payload(form);
      const nextSvg = generatePdf417Svg({
        payload,
        scale,
        height,
        padding,
        includetext: false,
      });

      setResolvedPayload(payload);
      setSvg(nextSvg);
    } catch (generationError) {
      setError(getErrorMessage(generationError));
      setSvg("");
    }
  };

  const onDownload = () => {
    if (!svg) {
      return;
    }

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pdf417-barcode.svg";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>PDF417 SVG Generator</h2>
      </header>

      <div className="toggle-row" role="radiogroup" aria-label="Generator input mode">
        <button
          type="button"
          className={`button ${mode === "raw" ? "button-active" : "button-secondary"}`}
          onClick={() => setMode("raw")}
        >
          Raw Payload
        </button>
        <button
          type="button"
          className={`button ${mode === "aamva" ? "button-active" : "button-secondary"}`}
          onClick={() => setMode("aamva")}
        >
          AAMVA v08 Form
        </button>
      </div>

      {mode === "raw" ? (
        <div className="stack-row">
          <label className="field-label" htmlFor="raw-payload-input">
            Raw payload
          </label>
          <textarea
            id="raw-payload-input"
            value={rawPayload}
            onChange={(event) => setRawPayload(event.target.value)}
            rows={10}
            placeholder="Paste raw PDF417 payload text"
          />
        </div>
      ) : (
        <div className="form-grid">
          <label>
            First name
            <input value={form.firstName} onChange={(event) => updateForm("firstName", event.target.value)} />
          </label>
          <label>
            Last name
            <input value={form.lastName} onChange={(event) => updateForm("lastName", event.target.value)} />
          </label>
          <label>
            Date of birth
            <input type="date" value={form.dob} onChange={(event) => updateForm("dob", event.target.value)} />
          </label>
          <label>
            Expiry date
            <input type="date" value={form.expiry} onChange={(event) => updateForm("expiry", event.target.value)} />
          </label>
          <label>
            Document number
            <input
              value={form.documentNumber}
              onChange={(event) => updateForm("documentNumber", event.target.value)}
            />
          </label>
          <label>
            Issuer IIN (6 digits)
            <input value={form.issuerIIN} onChange={(event) => updateForm("issuerIIN", event.target.value)} />
          </label>
          <label>
            Sex (M/F/X or 1/2/9)
            <input value={form.sex} onChange={(event) => updateForm("sex", event.target.value)} />
          </label>
          <label>
            Address line 1
            <input value={form.address1} onChange={(event) => updateForm("address1", event.target.value)} />
          </label>
          <label>
            City
            <input value={form.city} onChange={(event) => updateForm("city", event.target.value)} />
          </label>
          <label>
            Jurisdiction code
            <input
              value={form.jurisdictionCode}
              onChange={(event) => updateForm("jurisdictionCode", event.target.value)}
              placeholder="CA"
            />
          </label>
          <label>
            Postal code
            <input value={form.postalCode} onChange={(event) => updateForm("postalCode", event.target.value)} />
          </label>
        </div>
      )}

      <div className="form-grid compact-grid">
        <label>
          Scale
          <input
            type="number"
            min={1}
            max={12}
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
          />
        </label>
        <label>
          Height
          <input
            type="number"
            min={3}
            max={40}
            value={height}
            onChange={(event) => setHeight(Number(event.target.value))}
          />
        </label>
        <label>
          Padding
          <input
            type="number"
            min={0}
            max={30}
            value={padding}
            onChange={(event) => setPadding(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="button-row">
        <button type="button" className="button" onClick={onGenerate}>
          Generate SVG
        </button>
        <button type="button" className="button button-secondary" onClick={onDownload} disabled={!svg}>
          Download SVG
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {payloadPreview.length > 1200 ? (
        <p className="warning-text">Payload is long. Increase scale or height if scans fail.</p>
      ) : null}

      {mode === "aamva" ? (
        <details>
          <summary>Generated AAMVA payload preview</summary>
          <pre className="payload-preview">{payloadPreview || "Complete required fields to preview payload."}</pre>
        </details>
      ) : null}

      <section className="svg-preview-shell" aria-live="polite">
        <h3>SVG Preview</h3>
        {svg ? (
          <div className="svg-preview" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <p className="muted">Generate to preview barcode.</p>
        )}
      </section>

      {resolvedPayload ? (
        <details>
          <summary>Payload used for current SVG</summary>
          <pre className="payload-preview">{resolvedPayload}</pre>
        </details>
      ) : null}
    </section>
  );
}
