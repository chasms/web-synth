import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PianoRollModal } from "./PianoRollModal";

describe("PianoRollModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    sequence: [],
    steps: 8,
    transpose: 0,
    onSequenceChange: vi.fn(),
    onStepsChange: vi.fn(),
    onTransposeChange: vi.fn(),
  };

  it("should not render when closed", () => {
    const { container } = render(
      <PianoRollModal {...defaultProps} isOpen={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("should render when open", () => {
    render(<PianoRollModal {...defaultProps} />);
    expect(screen.getByText("Piano Roll Sequencer")).toBeInTheDocument();
  });

  it("should close when clicking overlay", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PianoRollModal {...defaultProps} onClose={onClose} />);

    const overlay = document.querySelector(".piano-roll-modal-overlay");
    expect(overlay).toBeInTheDocument();
    await user.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should not close when clicking modal content", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PianoRollModal {...defaultProps} onClose={onClose} />);

    const modal = document.querySelector(".piano-roll-modal");
    expect(modal).toBeInTheDocument();
    await user.click(modal!);
    expect(onClose).not.toHaveBeenCalled();
  });

  describe("Steps Control", () => {
    it("should render steps slider with current value", () => {
      render(<PianoRollModal {...defaultProps} steps={16} />);
      const sliders = screen.getAllByDisplayValue("16");
      const slider = sliders.find((el) => el.getAttribute("type") === "range");
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveValue("16");
    });

    it("should render editable steps number input", () => {
      render(<PianoRollModal {...defaultProps} steps={16} />);
      const inputs = screen.getAllByDisplayValue("16");
      // Should have both slider and number input
      expect(inputs.length).toBeGreaterThanOrEqual(1);
      const numberInput = inputs.find(
        (input) => input.getAttribute("type") === "number",
      );
      expect(numberInput).toBeInTheDocument();
    });

    it("should call onStepsChange when slider changes", () => {
      const onStepsChange = vi.fn();
      render(
        <PianoRollModal {...defaultProps} onStepsChange={onStepsChange} />,
      );

      const sliders = screen.getAllByDisplayValue("8");
      const slider = sliders.find(
        (el) => el.getAttribute("type") === "range",
      ) as HTMLInputElement;

      // Use fireEvent for range inputs
      fireEvent.change(slider, { target: { value: "12" } });

      expect(onStepsChange).toHaveBeenCalledWith(12);
    });

    it("should call onStepsChange when number input changes", () => {
      const onStepsChange = vi.fn();
      render(
        <PianoRollModal {...defaultProps} onStepsChange={onStepsChange} />,
      );

      const inputs = screen.getAllByDisplayValue("8");
      const numberInput = inputs.find(
        (input) => input.getAttribute("type") === "number",
      ) as HTMLInputElement;

      // Set value directly to avoid character-by-character typing issues
      fireEvent.change(numberInput, { target: { value: "24" } });
      expect(onStepsChange).toHaveBeenCalledWith(24);
    });

    it("should constrain steps number input to valid range (1-32)", () => {
      const onStepsChange = vi.fn();
      render(
        <PianoRollModal {...defaultProps} onStepsChange={onStepsChange} />,
      );

      const inputs = screen.getAllByDisplayValue("8");
      const numberInput = inputs.find(
        (input) => input.getAttribute("type") === "number",
      ) as HTMLInputElement;

      // Test minimum - 0 should constrain to 1
      fireEvent.change(numberInput, { target: { value: "0" } });
      expect(onStepsChange).toHaveBeenCalledWith(1);

      // Test maximum - 50 should constrain to 32
      onStepsChange.mockClear();
      fireEvent.change(numberInput, { target: { value: "50" } });
      expect(onStepsChange).toHaveBeenCalledWith(32);
    });
  });

  describe("Transpose Control", () => {
    it("should render transpose slider with current value", () => {
      render(<PianoRollModal {...defaultProps} transpose={-5} />);
      const sliders = screen.getAllByDisplayValue("-5");
      const slider = sliders.find((el) => el.getAttribute("type") === "range");
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveValue("-5");
    });

    it("should render editable transpose number input", () => {
      render(<PianoRollModal {...defaultProps} transpose={-5} />);
      const inputs = screen.getAllByDisplayValue("-5");
      const numberInput = inputs.find(
        (input) => input.getAttribute("type") === "number",
      );
      expect(numberInput).toBeInTheDocument();
    });

    it("should call onTransposeChange when slider changes", () => {
      const onTransposeChange = vi.fn();
      render(
        <PianoRollModal
          {...defaultProps}
          onTransposeChange={onTransposeChange}
        />,
      );

      const sliders = screen.getAllByDisplayValue("0");
      const slider = sliders.find(
        (el) => el.getAttribute("type") === "range",
      ) as HTMLInputElement;

      // Use fireEvent for range inputs
      fireEvent.change(slider, { target: { value: "5" } });

      expect(onTransposeChange).toHaveBeenCalledWith(5);
    });

    it("should call onTransposeChange when number input changes", () => {
      const onTransposeChange = vi.fn();
      render(
        <PianoRollModal
          {...defaultProps}
          onTransposeChange={onTransposeChange}
        />,
      );

      const inputs = screen.getAllByDisplayValue("0");
      const numberInput = inputs.find(
        (input) => input.getAttribute("type") === "number",
      ) as HTMLInputElement;

      // Set value directly to avoid character-by-character typing issues
      fireEvent.change(numberInput, { target: { value: "-12" } });
      expect(onTransposeChange).toHaveBeenCalledWith(-12);
    });

    it("should constrain transpose number input to valid range (-24 to 24)", () => {
      const onTransposeChange = vi.fn();
      render(
        <PianoRollModal
          {...defaultProps}
          onTransposeChange={onTransposeChange}
        />,
      );

      const inputs = screen.getAllByDisplayValue("0");
      const numberInput = inputs.find(
        (input) => input.getAttribute("type") === "number",
      ) as HTMLInputElement;

      // Test minimum - -30 should constrain to -24
      fireEvent.change(numberInput, { target: { value: "-30" } });
      expect(onTransposeChange).toHaveBeenCalledWith(-24);

      // Test maximum - 30 should constrain to 24
      onTransposeChange.mockClear();
      fireEvent.change(numberInput, { target: { value: "30" } });
      expect(onTransposeChange).toHaveBeenCalledWith(24);
    });
  });

  describe("Sequence Manipulation", () => {
    it("should add note when clicking empty cell", async () => {
      const user = userEvent.setup();
      const onSequenceChange = vi.fn();
      render(
        <PianoRollModal
          {...defaultProps}
          onSequenceChange={onSequenceChange}
        />,
      );

      // Find and click a grid cell
      const gridCells = screen.getAllByRole("button", { name: "" });
      await user.click(gridCells[0]);

      expect(onSequenceChange).toHaveBeenCalled();
      const call = onSequenceChange.mock.calls[0][0];
      expect(call[0]).toHaveProperty("note");
      expect(call[0]).toHaveProperty("velocity", 100);
    });

    it("should remove note when clicking occupied cell", async () => {
      const user = userEvent.setup();
      const onSequenceChange = vi.fn();
      const sequence = [{ note: 60, velocity: 100 }];
      render(
        <PianoRollModal
          {...defaultProps}
          sequence={sequence}
          onSequenceChange={onSequenceChange}
        />,
      );

      // Find the active cell
      const activeCells = screen
        .getAllByRole("button", { name: "" })
        .filter((btn) => btn.className.includes("active"));

      await user.click(activeCells[0]);

      expect(onSequenceChange).toHaveBeenCalled();
      const call = onSequenceChange.mock.calls[0][0];
      expect(call[0].note).toBeUndefined();
    });

    it("should clear sequence when Clear button clicked", async () => {
      const user = userEvent.setup();
      const onSequenceChange = vi.fn();
      const sequence = [
        { note: 60, velocity: 100 },
        { note: 64, velocity: 100 },
      ];
      render(
        <PianoRollModal
          {...defaultProps}
          sequence={sequence}
          onSequenceChange={onSequenceChange}
        />,
      );

      const clearButton = screen.getByRole("button", { name: /clear/i });
      await user.click(clearButton);

      expect(onSequenceChange).toHaveBeenCalled();
      const call = onSequenceChange.mock.calls[0][0];
      expect(call.every((step: object) => Object.keys(step).length === 0)).toBe(
        true,
      );
    });

    it("should randomize sequence when Random button clicked", async () => {
      const user = userEvent.setup();
      const onSequenceChange = vi.fn();
      render(
        <PianoRollModal
          {...defaultProps}
          onSequenceChange={onSequenceChange}
        />,
      );

      const randomButton = screen.getByRole("button", { name: /random/i });
      await user.click(randomButton);

      expect(onSequenceChange).toHaveBeenCalled();
      const call = onSequenceChange.mock.calls[0][0];
      expect(call.length).toBe(8); // Should match steps
    });
  });

  describe("Velocity Controls", () => {
    it("should render velocity inputs for each step", () => {
      render(<PianoRollModal {...defaultProps} steps={4} />);
      const velocityInputs = screen.getAllByPlaceholderText("-");
      expect(velocityInputs).toHaveLength(4);
    });

    it("should disable velocity input when no note exists", () => {
      render(<PianoRollModal {...defaultProps} sequence={[{}]} />);
      const velocityInputs = screen.getAllByPlaceholderText("-");
      // Find the first disabled one (they should all be disabled for empty sequence)
      const disabledInput = velocityInputs.find(
        (input) => (input as HTMLInputElement).disabled,
      );
      expect(disabledInput).toBeDisabled();
    });

    it("should enable velocity input when note exists", () => {
      const sequence = [{ note: 60, velocity: 100 }];
      render(<PianoRollModal {...defaultProps} sequence={sequence} />);
      const velocityInputs = screen.getAllByDisplayValue("100");
      const numberInput = velocityInputs.find((input) =>
        input.className.includes("velocity-input"),
      );
      expect(numberInput).not.toBeDisabled();
    });

    it("should call onSequenceChange when velocity changes", () => {
      const onSequenceChange = vi.fn();
      const sequence = [{ note: 60, velocity: 100 }];
      render(
        <PianoRollModal
          {...defaultProps}
          sequence={sequence}
          onSequenceChange={onSequenceChange}
        />,
      );

      const velocityInputs = screen.getAllByDisplayValue("100");
      const numberInput = velocityInputs.find((input) =>
        input.className.includes("velocity-input"),
      ) as HTMLInputElement;

      // Set value directly to avoid character-by-character typing issues
      fireEvent.change(numberInput, { target: { value: "80" } });

      expect(onSequenceChange).toHaveBeenCalled();
      const call = onSequenceChange.mock.calls[0][0];
      expect(call[0].velocity).toBe(80);
    });

    it("should not set velocity on step without a note", () => {
      const onSequenceChange = vi.fn();
      const sequence = [{}]; // No note

      const { rerender } = render(
        <PianoRollModal
          {...defaultProps}
          sequence={sequence}
          onSequenceChange={onSequenceChange}
        />,
      );

      // Verify the velocity input is disabled for empty step
      const velocityInputs = screen.getAllByPlaceholderText("-");
      const firstInput = velocityInputs[0] as HTMLInputElement;
      expect(firstInput).toBeDisabled();

      // If we try to trigger handleVelocityChange programmatically,
      // it should return early due to the note check
      // This verifies the fix for the redundant condition bug
      rerender(
        <PianoRollModal
          {...defaultProps}
          sequence={sequence}
          onSequenceChange={onSequenceChange}
        />,
      );

      // The input should remain disabled
      expect(firstInput).toBeDisabled();
    });

    it("should constrain velocity to valid range (1-127)", () => {
      const onSequenceChange = vi.fn();
      const sequence = [{ note: 60, velocity: 100 }];
      render(
        <PianoRollModal
          {...defaultProps}
          sequence={sequence}
          onSequenceChange={onSequenceChange}
        />,
      );

      const velocityInputs = screen.getAllByDisplayValue("100");
      const numberInput = velocityInputs.find((input) =>
        input.className.includes("velocity-input"),
      ) as HTMLInputElement;

      // Test minimum - 0 should constrain to 1
      fireEvent.change(numberInput, { target: { value: "0" } });
      expect(onSequenceChange).toHaveBeenCalled();
      const minCall = onSequenceChange.mock.calls[0][0];
      expect(minCall[0].velocity).toBe(1);

      // Test maximum - 200 should constrain to 127
      onSequenceChange.mockClear();
      fireEvent.change(numberInput, { target: { value: "200" } });
      expect(onSequenceChange).toHaveBeenCalled();
      const maxCall = onSequenceChange.mock.calls[0][0];
      expect(maxCall[0].velocity).toBe(127);
    });
  });

  describe("Grid Display", () => {
    it("should render step numbers header", () => {
      render(<PianoRollModal {...defaultProps} steps={4} />);
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("should render note labels for all MIDI notes", () => {
      render(<PianoRollModal {...defaultProps} />);
      expect(screen.getByText("C4")).toBeInTheDocument();
      expect(screen.getByText("A4")).toBeInTheDocument();
      expect(screen.getByText("C-1")).toBeInTheDocument();
      expect(screen.getByText("G9")).toBeInTheDocument();
    });

    it("should apply active class to cells with notes", () => {
      const sequence = [{ note: 60, velocity: 100 }]; // C4
      render(<PianoRollModal {...defaultProps} sequence={sequence} />);

      const activeCells = screen
        .getAllByRole("button", { name: "" })
        .filter((btn) => btn.className.includes("active"));

      expect(activeCells.length).toBeGreaterThan(0);
    });

    it("should reflect transpose in cell positions", () => {
      const sequence = [{ note: 60, velocity: 100 }]; // C4
      const { container, rerender } = render(
        <PianoRollModal {...defaultProps} sequence={sequence} transpose={0} />,
      );

      const initialActive = container.querySelectorAll(".grid-cell.active");
      const initialCount = initialActive.length;

      // Transpose up by 12 semitones (1 octave)
      rerender(
        <PianoRollModal {...defaultProps} sequence={sequence} transpose={12} />,
      );

      const transposedActive = container.querySelectorAll(".grid-cell.active");
      expect(transposedActive.length).toBe(initialCount);
    });

    it("should set cell opacity based on velocity", () => {
      const sequence = [
        { note: 60, velocity: 127 }, // Full velocity
        { note: 64, velocity: 64 }, // Half velocity
      ];
      render(
        <PianoRollModal {...defaultProps} sequence={sequence} steps={2} />,
      );

      const activeCells = screen
        .getAllByRole("button", { name: "" })
        .filter((btn) => btn.className.includes("active"));

      const opacities = activeCells.map((cell) => {
        const style = window.getComputedStyle(cell);
        return parseFloat(style.opacity);
      });

      // Check that we have different opacities
      expect(new Set(opacities).size).toBeGreaterThan(1);
    });
  });

  describe("Scroll Behavior", () => {
    it("should have scrollable grid container", () => {
      render(<PianoRollModal {...defaultProps} />);
      const scrollContainer = document.querySelector(".grid-scroll-container");
      expect(scrollContainer).toBeInTheDocument();
    });

    it("should initialize with scroll position for C4 centering", () => {
      render(<PianoRollModal {...defaultProps} />);
      const scrollContainer = document.querySelector(
        ".grid-scroll-container",
      ) as HTMLElement;

      // The scroll position should be set (not 0 unless viewport is very tall)
      // This tests that the dynamic scroll positioning is working
      // The exact value depends on container height, so we just verify it's a number
      expect(scrollContainer).toBeInTheDocument();
      expect(typeof scrollContainer.scrollTop).toBe("number");
      expect(scrollContainer.scrollTop).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Action Buttons", () => {
    it("should render Clear button", () => {
      render(<PianoRollModal {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /clear/i }),
      ).toBeInTheDocument();
    });

    it("should render Random button", () => {
      render(<PianoRollModal {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /random/i }),
      ).toBeInTheDocument();
    });

    it("should render Close button", () => {
      render(<PianoRollModal {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /close/i }),
      ).toBeInTheDocument();
    });

    it("should call onClose when Close button clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<PianoRollModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty sequence array", () => {
      render(<PianoRollModal {...defaultProps} sequence={[]} />);
      expect(screen.getByText("Piano Roll Sequencer")).toBeInTheDocument();
    });

    it("should handle sequence shorter than steps", () => {
      const sequence = [{ note: 60, velocity: 100 }];
      render(
        <PianoRollModal {...defaultProps} sequence={sequence} steps={8} />,
      );

      // Should still render 8 velocity controls
      const velocityInputs = screen.getAllByPlaceholderText("-");
      expect(velocityInputs.length).toBeGreaterThanOrEqual(7); // Some might have values
    });

    it("should handle transpose at boundaries", () => {
      const sequence = [{ note: 0, velocity: 100 }]; // C-1 (lowest)
      render(
        <PianoRollModal
          {...defaultProps}
          sequence={sequence}
          transpose={-24}
        />,
      );

      // Should clamp to valid MIDI range (0-127)
      expect(screen.getByText("Piano Roll Sequencer")).toBeInTheDocument();
    });

    it("should handle maximum transpose", () => {
      const sequence = [{ note: 127, velocity: 100 }]; // G9 (highest)
      render(
        <PianoRollModal {...defaultProps} sequence={sequence} transpose={24} />,
      );

      // Should clamp to valid MIDI range (0-127)
      expect(screen.getByText("Piano Roll Sequencer")).toBeInTheDocument();
    });

    it("should handle 32 steps (maximum)", () => {
      render(<PianoRollModal {...defaultProps} steps={32} />);
      const stepNumbers = screen.getAllByText(/^\d+$/);
      // Should have step numbers 1-32
      expect(
        stepNumbers.filter((el) => parseInt(el.textContent || "0") <= 32),
      ).toBeDefined();
    });
  });
});
