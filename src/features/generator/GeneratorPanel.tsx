import { useMemo, useState } from "react";
import {
  buildAamva08Payload,
  buildAamva08PayloadFromFields,
} from "../../lib/aamva/buildAamva08";
import {
  AAMVA_FIELD_DEFINITIONS,
  AAMVA_REQUIRED_CORE_CODES,
  AAMVA_WA_DEFAULTS,
  type AamvaFieldDefinition,
} from "../../lib/aamva/fieldCatalog";
import { generatePdf417Svg } from "../../lib/generator/pdf417Svg";
import type { Aamva08FormInput, AamvaCustomField } from "../../types/barcode";

type GeneratorMode = "raw" | "aamva";

const EMPTY_FORM: Aamva08FormInput = {
  firstName: "",
  lastName: "",
  dob: "",
  expiry: "",
  documentNumber: "",
  issuerIIN: "636045",
  sex: "",
  address1: "",
  city: "",
  jurisdictionCode: "WA",
  postalCode: "",
};

const CORE_WA_FIELDS: AamvaFieldDefinition[] = [
  { code: "DAQ", label: "License or ID Number", washingtonLabel: "Washington license or ID number" },
  { code: "DCS", label: "Last Name", washingtonLabel: "Family name" },
  { code: "DAC", label: "Given Name", washingtonLabel: "Given name" },
  { code: "DAD", label: "Middle Name", washingtonLabel: "Middle name" },
  { code: "DBB", label: "Date of Birth" },
  { code: "DBA", label: "License Expiration Date" },
  { code: "DBD", label: "Document Issue Date" },
  { code: "DBC", label: "Sex" },
  { code: "DAG", label: "Mailing Street Address1" },
  { code: "DAI", label: "Mailing City" },
  { code: "DAJ", label: "Mailing Jurisdiction Code", washingtonLabel: "State code (WA)" },
  { code: "DAK", label: "Mailing Postal Code" },
  { code: "DAR", label: "License Classification Code", washingtonLabel: "WA class code" },
  { code: "DAS", label: "License Restriction Code", washingtonLabel: "WA restrictions" },
  { code: "DAT", label: "License Endorsements Code", washingtonLabel: "WA endorsements" },
  { code: "DCF", label: "Document Discriminator" },
  { code: "DCG", label: "Country territory of issuance" },
  { code: "ZVA", label: "Court Restriction Code", washingtonLabel: "WA court restrictions" },
];

const CORE_CODES = new Set(CORE_WA_FIELDS.map((item) => item.code));

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Barcode generation failed.";
};

const toFieldLabel = (field: AamvaFieldDefinition): string =>
  `${field.code} - ${field.washingtonLabel ?? field.label}`;

const getBaseFieldsFromLegacyForm = (form: Aamva08FormInput): Record<string, string> => ({
  ...AAMVA_WA_DEFAULTS,
  DAC: form.firstName,
  DCS: form.lastName,
  DAQ: form.documentNumber,
  DBB: form.dob,
  DBA: form.expiry,
  DBC: form.sex ?? "",
  DAG: form.address1 ?? "",
  DAI: form.city ?? "",
  DAJ: form.jurisdictionCode ?? "WA",
  DAK: form.postalCode ?? "",
  DCF: form.documentNumber,
  DCG: "USA",
});

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new Error("Advanced PDF417 settings must be numeric.");
  }

  return parsed;
};

export function GeneratorPanel() {
  const [mode, setMode] = useState<GeneratorMode>("raw");
  const [rawPayload, setRawPayload] = useState("");
  const [form, setForm] = useState<Aamva08FormInput>(EMPTY_FORM);
  const [waFields, setWaFields] = useState<Record<string, string>>(getBaseFieldsFromLegacyForm(EMPTY_FORM));
  const [customFields, setCustomFields] = useState<AamvaCustomField[]>([]);
  const [fieldFilter, setFieldFilter] = useState("");

  const [scale, setScale] = useState(3);
  const [height, setHeight] = useState(9);
  const [padding, setPadding] = useState(8);
  const [compact, setCompact] = useState(false);
  const [columns, setColumns] = useState("");
  const [rows, setRows] = useState("");
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState("");

  const [svg, setSvg] = useState("");
  const [resolvedPayload, setResolvedPayload] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredAdvancedFields = useMemo(() => {
    const filter = fieldFilter.trim().toUpperCase();
    const source = AAMVA_FIELD_DEFINITIONS.filter((field) => !CORE_CODES.has(field.code));
    if (!filter) {
      return source;
    }

    return source.filter((field) => {
      const haystack = `${field.code} ${field.label} ${field.washingtonLabel ?? ""}`.toUpperCase();
      return haystack.includes(filter);
    });
  }, [fieldFilter]);

  const payloadPreview = useMemo(() => {
    if (mode === "raw") {
      return rawPayload.trim();
    }

    try {
      return buildAamva08PayloadFromFields({
        issuerIIN: form.issuerIIN,
        fields: waFields,
        customFields,
      });
    } catch {
      return "";
    }
  }, [mode, rawPayload, form.issuerIIN, waFields, customFields]);

  const legacyPreview = useMemo(() => {
    try {
      return buildAamva08Payload(form);
    } catch {
      return "Complete core fields to render legacy preview.";
    }
  }, [form]);

  const updateLegacyForm = (key: keyof Aamva08FormInput, value: string) => {
    setForm((previous) => {
      const next = {
        ...previous,
        [key]: value,
      };

      setWaFields((current) => ({
        ...current,
        ...getBaseFieldsFromLegacyForm(next),
      }));

      return next;
    });
  };

  const updateWaField = (code: string, value: string) => {
    setWaFields((previous) => ({
      ...previous,
      [code]: value,
    }));
  };

  const updateCustomField = (index: number, key: keyof AamvaCustomField, value: string) => {
    setCustomFields((previous) =>
      previous.map((field, currentIndex) =>
        currentIndex === index
          ? {
              ...field,
              [key]: value,
            }
          : field,
      ),
    );
  };

  const addCustomField = () => {
    setCustomFields((previous) => [...previous, { code: "", value: "" }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const onGenerate = () => {
    setError(null);

    try {
      const payload =
        mode === "raw"
          ? rawPayload.trim()
          : buildAamva08PayloadFromFields({
              issuerIIN: form.issuerIIN,
              fields: waFields,
              customFields,
            });

      const nextSvg = generatePdf417Svg({
        payload,
        scale,
        height,
        padding,
        includetext: false,
        compact,
        columns: parseOptionalNumber(columns),
        rows: parseOptionalNumber(rows),
        errorCorrectionLevel: parseOptionalNumber(errorCorrectionLevel),
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
          Washington ID / DL (AAMVA v08)
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
        <>
          <div className="form-grid">
            <label>
              Issuer IIN (Washington commonly 636045)
              <input
                value={form.issuerIIN}
                onChange={(event) => updateLegacyForm("issuerIIN", event.target.value)}
                placeholder="636045"
              />
            </label>
          </div>

          <h3 className="subheading">Washington Core Fields</h3>
          <div className="form-grid">
            {CORE_WA_FIELDS.map((field) => (
              <label key={field.code}>
                {toFieldLabel(field)}
                <input
                  type={["DBA", "DBB", "DBD"].includes(field.code) ? "date" : "text"}
                  value={waFields[field.code] ?? ""}
                  onChange={(event) => {
                    updateWaField(field.code, event.target.value);

                    if (field.code === "DAC") {
                      updateLegacyForm("firstName", event.target.value);
                    }
                    if (field.code === "DCS") {
                      updateLegacyForm("lastName", event.target.value);
                    }
                    if (field.code === "DAQ") {
                      updateLegacyForm("documentNumber", event.target.value);
                    }
                    if (field.code === "DBB") {
                      updateLegacyForm("dob", event.target.value);
                    }
                    if (field.code === "DBA") {
                      updateLegacyForm("expiry", event.target.value);
                    }
                    if (field.code === "DBC") {
                      updateLegacyForm("sex", event.target.value);
                    }
                    if (field.code === "DAG") {
                      updateLegacyForm("address1", event.target.value);
                    }
                    if (field.code === "DAI") {
                      updateLegacyForm("city", event.target.value);
                    }
                    if (field.code === "DAJ") {
                      updateLegacyForm("jurisdictionCode", event.target.value);
                    }
                    if (field.code === "DAK") {
                      updateLegacyForm("postalCode", event.target.value);
                    }
                  }}
                  placeholder={field.code}
                />
              </label>
            ))}
          </div>

          <details className="advanced-fields">
            <summary>Additional AAMVA / Washington Element Codes</summary>
            <p className="muted">Include as many element codes as needed. Required core: {AAMVA_REQUIRED_CORE_CODES.join(", ")}</p>
            <input
              value={fieldFilter}
              onChange={(event) => setFieldFilter(event.target.value)}
              placeholder="Filter by code or meaning"
              aria-label="Filter additional AAMVA fields"
            />
            <div className="form-grid">
              {filteredAdvancedFields.map((field) => (
                <label key={field.code}>
                  {toFieldLabel(field)}
                  <input
                    value={waFields[field.code] ?? ""}
                    onChange={(event) => updateWaField(field.code, event.target.value)}
                    placeholder={field.code}
                  />
                </label>
              ))}
            </div>
          </details>

          <details className="advanced-fields">
            <summary>Custom Element Codes (for additional or state-specific fields)</summary>
            {customFields.length === 0 ? <p className="muted">No custom fields yet.</p> : null}
            {customFields.map((entry, index) => (
              <div className="custom-field-row" key={`${entry.code}-${index}`}>
                <input
                  value={entry.code}
                  onChange={(event) => updateCustomField(index, "code", event.target.value)}
                  placeholder="Code (e.g. ZAB)"
                  maxLength={3}
                />
                <input
                  value={entry.value}
                  onChange={(event) => updateCustomField(index, "value", event.target.value)}
                  placeholder="Value"
                />
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => removeCustomField(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="button button-secondary" onClick={addCustomField}>
              Add Custom Field
            </button>
          </details>

          <details>
            <summary>Compatibility builder (legacy form mode preview)</summary>
            <pre className="payload-preview">{legacyPreview}</pre>
          </details>
        </>
      )}

      <h3 className="subheading">PDF417 Symbol Options</h3>
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
        <label>
          Columns (optional)
          <input value={columns} onChange={(event) => setColumns(event.target.value)} placeholder="1-30" />
        </label>
        <label>
          Rows (optional)
          <input value={rows} onChange={(event) => setRows(event.target.value)} placeholder="3-90" />
        </label>
        <label>
          Error correction level
          <input
            value={errorCorrectionLevel}
            onChange={(event) => setErrorCorrectionLevel(event.target.value)}
            placeholder="0-8"
          />
        </label>
      </div>

      <label className="checkbox-row">
        <input type="checkbox" checked={compact} onChange={(event) => setCompact(event.target.checked)} />
        Use Compact PDF417 (pdf417compact)
      </label>

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
        <p className="warning-text">Payload is long. Increase scale/height or tune rows/columns if scans fail.</p>
      ) : null}

      {mode === "aamva" ? (
        <details>
          <summary>Generated Washington/AAMVA payload preview</summary>
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
