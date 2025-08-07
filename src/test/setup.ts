import "@testing-library/jest-dom";

import { vi } from "vitest";

// Mock Web Audio API for testing
Object.defineProperty(window, "AudioContext", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440 },
      type: "sine",
    }),
    createGain: vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      gain: { value: 1 },
    }),
    destination: {},
    currentTime: 0,
    sampleRate: 44100,
    state: "running",
    suspend: vi.fn(),
    resume: vi.fn(),
    close: vi.fn(),
  })),
});

// Also mock webkitAudioContext for Safari compatibility
Object.defineProperty(window, "webkitAudioContext", {
  writable: true,
  value: window.AudioContext,
});
