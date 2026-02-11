import { type ChangeEvent, useState } from "react";
import { decodeFromImage } from "../../lib/scanner/imageDecoder";
import type { DecodeResult } from "../../types/barcode";

interface ImageDecodePanelProps {
  onDecoded: (result: DecodeResult) => void;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Image decode failed.";
};

export function ImageDecodePanel({ onDecoded }: ImageDecodePanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setIsDecoding(true);

    try {
      const result = await decodeFromImage(file);
      onDecoded(result);
    } catch (decodeError) {
      setError(getErrorMessage(decodeError));
    } finally {
      setIsDecoding(false);
      event.target.value = "";
    }
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Decode From Image</h2>
      </header>

      <label className="button button-secondary file-button" htmlFor="upload-pdf417-image">
        {isDecoding ? "Decoding..." : "Upload PNG / JPG / WEBP / HEIC"}
      </label>
      <input
        id="upload-pdf417-image"
        className="hidden-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif"
        onChange={onFileChange}
        disabled={isDecoding}
      />

      {error ? <p className="error-text">{error}</p> : <p className="muted">Select an image with a PDF417 barcode.</p>}
    </section>
  );
}
