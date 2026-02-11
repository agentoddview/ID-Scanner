import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GeneratorPanel } from "../../src/features/generator/GeneratorPanel";

describe("GeneratorPanel", () => {
  it("generates SVG from raw payload", async () => {
    const { container } = render(<GeneratorPanel />);

    fireEvent.change(screen.getByLabelText(/raw payload/i), {
      target: { value: "HELLO-PDF417" },
    });

    fireEvent.click(screen.getByRole("button", { name: /generate svg/i }));

    await waitFor(() => {
      expect(container.querySelector(".svg-preview svg")).toBeInTheDocument();
    });
  });

  it("shows validation errors in AAMVA mode", async () => {
    render(<GeneratorPanel />);

    fireEvent.click(screen.getByRole("button", { name: /aamva v08 form/i }));
    fireEvent.click(screen.getByRole("button", { name: /generate svg/i }));

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });

  it("builds an SVG from structured AAMVA form", async () => {
    const { container } = render(<GeneratorPanel />);

    fireEvent.click(screen.getByRole("button", { name: /aamva v08 form/i }));

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Public" } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: "1990-01-01" } });
    fireEvent.change(screen.getByLabelText(/expiry date/i), { target: { value: "2030-01-01" } });
    fireEvent.change(screen.getByLabelText(/document number/i), { target: { value: "X12345" } });
    fireEvent.change(screen.getByLabelText(/issuer iin/i), { target: { value: "636026" } });

    fireEvent.click(screen.getByRole("button", { name: /generate svg/i }));

    await waitFor(() => {
      expect(container.querySelector(".svg-preview svg")).toBeInTheDocument();
    });
  });
});
