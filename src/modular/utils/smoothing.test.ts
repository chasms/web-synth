/**
 * Tests for parameter smoothing utility
 *
 * Reference: PRODUCT_BACKLOG.md - Parameter Smoothing Utility
 * Acceptance Criteria: Tests measure step discontinuities below tolerance
 */

import { beforeEach, describe, expect, it } from "vitest";

import { smoothParam, smoothParams } from "./smoothing";

/**
 * Mock AudioParam implementation for testing
 */
class MockAudioParam implements AudioParam {
  value: number;
  defaultValue: number;
  maxValue: number;
  minValue: number;
  automationRate: AutomationRate = "a-rate";

  private scheduledEvents: Array<{
    type: string;
    value?: number;
    time: number;
    timeConstant?: number;
  }> = [];

  constructor(initialValue: number = 0) {
    this.value = initialValue;
    this.defaultValue = initialValue;
    this.maxValue = Number.MAX_VALUE;
    this.minValue = -Number.MAX_VALUE;
  }

  setValueAtTime(value: number, startTime: number): AudioParam {
    this.scheduledEvents.push({ type: "setValue", value, time: startTime });
    this.value = value;
    return this;
  }

  linearRampToValueAtTime(value: number, endTime: number): AudioParam {
    this.scheduledEvents.push({ type: "linearRamp", value, time: endTime });
    return this;
  }

  exponentialRampToValueAtTime(value: number, endTime: number): AudioParam {
    this.scheduledEvents.push({
      type: "exponentialRamp",
      value,
      time: endTime,
    });
    return this;
  }

  setTargetAtTime(
    target: number,
    startTime: number,
    timeConstant: number,
  ): AudioParam {
    this.scheduledEvents.push({
      type: "setTarget",
      value: target,
      time: startTime,
      timeConstant,
    });
    return this;
  }

  setValueCurveAtTime(
    _values: number[] | Float32Array,
    startTime: number,
    _duration: number,
  ): AudioParam {
    this.scheduledEvents.push({
      type: "setValueCurve",
      time: startTime,
    });
    return this;
  }

  cancelScheduledValues(cancelTime: number): AudioParam {
    this.scheduledEvents = this.scheduledEvents.filter(
      (event) => event.time < cancelTime,
    );
    return this;
  }

  cancelAndHoldAtTime(cancelTime: number): AudioParam {
    return this.cancelScheduledValues(cancelTime);
  }

  /**
   * Test helper: get scheduled events
   */
  getScheduledEvents() {
    return [...this.scheduledEvents];
  }

  /**
   * Test helper: clear all scheduled events
   */
  clearScheduledEvents() {
    this.scheduledEvents = [];
  }

  /**
   * Test helper: check if a discontinuity exists (abrupt jump without smoothing)
   * Returns true if the parameter value changes without any ramping scheduled
   */
  hasDiscontinuity(): boolean {
    // A discontinuity is when value changes but no ramp is scheduled
    const hasRamp = this.scheduledEvents.some(
      (event) =>
        event.type === "linearRamp" ||
        event.type === "exponentialRamp" ||
        event.type === "setTarget",
    );
    return !hasRamp;
  }

  /**
   * Test helper: get the maximum step size between consecutive scheduled values
   */
  getMaxStepSize(): number {
    const values = this.scheduledEvents
      .filter((event) => event.value !== undefined)
      .map((event) => event.value!);

    if (values.length < 2) return 0;

    let maxStep = 0;
    for (let i = 1; i < values.length; i++) {
      const step = Math.abs(values[i] - values[i - 1]);
      maxStep = Math.max(maxStep, step);
    }
    return maxStep;
  }
}

/**
 * Mock AudioContext for testing
 */
class MockAudioContext {
  private _currentTime: number;
  sampleRate: number = 48000;
  state: AudioContextState = "running";

  constructor(currentTime: number = 0) {
    this._currentTime = currentTime;
  }

  get currentTime(): number {
    return this._currentTime;
  }

  set currentTime(value: number) {
    this._currentTime = value;
  }

  createBuffer(): AudioBuffer {
    throw new Error("Not implemented");
  }

  decodeAudioData(): Promise<AudioBuffer> {
    throw new Error("Not implemented");
  }
}

describe("smoothing", () => {
  let ctx: BaseAudioContext;
  let param: MockAudioParam;

  beforeEach(() => {
    ctx = new MockAudioContext(0) as unknown as BaseAudioContext;
    param = new MockAudioParam(0);
  });

  describe("smoothParam", () => {
    describe("AC1: Linear smoothing mode", () => {
      it("should schedule linear ramp to target value", () => {
        smoothParam(ctx, param, 1.0, { mode: "linear", time: 0.1 });

        const events = param.getScheduledEvents();
        expect(events).toHaveLength(2);

        // Should set current value first
        expect(events[0].type).toBe("setValue");
        expect(events[0].value).toBe(0);

        // Then linear ramp to target
        expect(events[1].type).toBe("linearRamp");
        expect(events[1].value).toBe(1.0);
        expect(events[1].time).toBe(0.1);
      });

      it("should not have discontinuities", () => {
        smoothParam(ctx, param, 1.0, { mode: "linear" });
        expect(param.hasDiscontinuity()).toBe(false);
      });

      it("should respect custom time parameter", () => {
        smoothParam(ctx, param, 1.0, { mode: "linear", time: 0.5 });

        const events = param.getScheduledEvents();
        const rampEvent = events.find((e) => e.type === "linearRamp");

        expect(rampEvent).toBeDefined();
        expect(rampEvent?.time).toBe(0.5);
      });

      it("should handle negative target values", () => {
        smoothParam(ctx, param, -0.5, { mode: "linear" });

        const events = param.getScheduledEvents();
        const rampEvent = events.find((e) => e.type === "linearRamp");

        expect(rampEvent?.value).toBe(-0.5);
      });
    });

    describe("AC2: Exponential smoothing mode", () => {
      it("should schedule exponential-like smoothing using setTarget", () => {
        param.value = 0.1; // Start from positive value for exp mode
        smoothParam(ctx, param, 1.0, { mode: "exp", time: 0.12 });

        const events = param.getScheduledEvents();

        // Should use setTargetAtTime for exponential behavior
        const setTargetEvent = events.find((e) => e.type === "setTarget");
        expect(setTargetEvent).toBeDefined();
        expect(setTargetEvent?.value).toBe(1.0);

        // Time constant should be derived from time parameter (time / 3)
        expect(setTargetEvent?.timeConstant).toBeCloseTo(0.04, 5);
      });

      it("should not have discontinuities", () => {
        param.value = 0.1;
        smoothParam(ctx, param, 1.0, { mode: "exp" });
        expect(param.hasDiscontinuity()).toBe(false);
      });

      it("should handle zero start value with epsilon", () => {
        param.value = 0;
        smoothParam(ctx, param, 1.0, { mode: "exp", epsilon: 1e-5 });

        const events = param.getScheduledEvents();
        const setValueEvent = events.find(
          (e) => e.type === "setValue" && e.value !== 0,
        );

        // Should set to exactly epsilon to avoid zero in exponential domain
        expect(setValueEvent?.value).toBe(1e-5);
      });

      it("should handle zero target value with epsilon", () => {
        param.value = 1.0;
        smoothParam(ctx, param, 0, { mode: "exp", epsilon: 1e-5 });

        const events = param.getScheduledEvents();
        const setTargetEvent = events.find((e) => e.type === "setTarget");

        // Target should be clamped to exactly epsilon
        expect(setTargetEvent?.value).toBe(1e-5);
      });

      it("should land at target value after exponential curve", () => {
        param.value = 0.1;
        smoothParam(ctx, param, 1.0, { mode: "exp", time: 0.12 });

        const events = param.getScheduledEvents();
        const finalSetValue = events.filter((e) => e.type === "setValue").pop();

        // Should land at exact target after ~4 time constants
        expect(finalSetValue?.value).toBe(1.0);
      });
    });

    describe("AC3: SetTarget smoothing mode (default)", () => {
      it("should schedule setTargetAtTime by default", () => {
        smoothParam(ctx, param, 1.0);

        const events = param.getScheduledEvents();
        const setTargetEvent = events.find((e) => e.type === "setTarget");

        expect(setTargetEvent).toBeDefined();
        expect(setTargetEvent?.value).toBe(1.0);
      });

      it("should use default timeConstant when not specified", () => {
        smoothParam(ctx, param, 1.0);

        const events = param.getScheduledEvents();
        const setTargetEvent = events.find((e) => e.type === "setTarget");

        expect(setTargetEvent?.timeConstant).toBe(0.03);
      });

      it("should respect custom timeConstant parameter", () => {
        smoothParam(ctx, param, 1.0, { mode: "setTarget", timeConstant: 0.1 });

        const events = param.getScheduledEvents();
        const setTargetEvent = events.find((e) => e.type === "setTarget");

        expect(setTargetEvent?.timeConstant).toBe(0.1);
      });

      it("should not have discontinuities", () => {
        smoothParam(ctx, param, 1.0, { mode: "setTarget" });
        expect(param.hasDiscontinuity()).toBe(false);
      });

      it("should work across zero (no epsilon needed)", () => {
        param.value = -1.0;
        smoothParam(ctx, param, 1.0, { mode: "setTarget" });

        const events = param.getScheduledEvents();
        const setTargetEvent = events.find((e) => e.type === "setTarget");

        expect(setTargetEvent?.value).toBe(1.0);
      });

      it("should land at target value after curve", () => {
        smoothParam(ctx, param, 1.0, { mode: "setTarget", timeConstant: 0.05 });

        const events = param.getScheduledEvents();
        const finalSetValue = events.filter((e) => e.type === "setValue").pop();

        // Should land at exact target after ~4 time constants
        expect(finalSetValue?.value).toBe(1.0);
        expect(finalSetValue?.time).toBeCloseTo(0.2, 5); // 4 * 0.05
      });
    });

    describe("AC4: Cancel previous scheduled values", () => {
      it("should cancel previous events by default", () => {
        // Schedule first smoothing
        smoothParam(ctx, param, 0.5, { mode: "linear" });

        // Schedule second smoothing (should cancel first)
        smoothParam(ctx, param, 1.0, { mode: "linear" });
        const eventsAfterSecond = param.getScheduledEvents().length;

        // Events should be cleared and replaced with exactly 2 new events
        expect(eventsAfterSecond).toBe(2); // setValue + linearRamp
      });

      it("should preserve previous events when cancelPrevious is false", () => {
        smoothParam(ctx, param, 0.5, { mode: "linear" });
        const eventsAfterFirst = param.getScheduledEvents().length;

        smoothParam(ctx, param, 1.0, { mode: "linear", cancelPrevious: false });
        const eventsAfterSecond = param.getScheduledEvents().length;

        // New events should be added
        expect(eventsAfterSecond).toBeGreaterThan(eventsAfterFirst);
      });

      it("should re-anchor to current value when canceling", () => {
        param.value = 0.7; // Simulate current value mid-ramp
        smoothParam(ctx, param, 1.0, { mode: "linear", cancelPrevious: true });

        const events = param.getScheduledEvents();
        const firstEvent = events[0];

        // Should anchor from current value, not original
        expect(firstEvent.type).toBe("setValue");
        expect(firstEvent.value).toBe(0.7);
      });
    });

    describe("AC5: Minimum delta threshold", () => {
      it("should skip smoothing when delta is below minDelta", () => {
        param.value = 1.0;
        smoothParam(ctx, param, 1.00005, { minDelta: 0.0001 });

        const events = param.getScheduledEvents();
        // Should not schedule any events (delta too small)
        expect(events).toHaveLength(0);
      });

      it("should apply smoothing when delta exceeds minDelta", () => {
        param.value = 1.0;
        smoothParam(ctx, param, 1.001, { minDelta: 0.0001 });

        const events = param.getScheduledEvents();
        // Should schedule events (delta large enough)
        expect(events.length).toBeGreaterThan(0);
      });

      it("should respect custom minDelta parameter", () => {
        param.value = 1.0;
        smoothParam(ctx, param, 1.05, { minDelta: 0.1 });

        const events = param.getScheduledEvents();
        // Delta is 0.05, below custom minDelta of 0.1
        expect(events).toHaveLength(0);
      });
    });

    describe("AC6: Value clamping", () => {
      it("should clamp target to specified maximum", () => {
        smoothParam(ctx, param, 2.0, {
          mode: "linear",
          clamp: { max: 1.0 },
        });

        const events = param.getScheduledEvents();
        const rampEvent = events.find((e) => e.type === "linearRamp");

        expect(rampEvent?.value).toBe(1.0);
      });

      it("should clamp target to specified minimum", () => {
        smoothParam(ctx, param, -2.0, {
          mode: "linear",
          clamp: { min: -1.0 },
        });

        const events = param.getScheduledEvents();
        const rampEvent = events.find((e) => e.type === "linearRamp");

        expect(rampEvent?.value).toBe(-1.0);
      });

      it("should clamp target within range", () => {
        smoothParam(ctx, param, 5.0, {
          mode: "linear",
          clamp: { min: 0, max: 1.0 },
        });

        const events = param.getScheduledEvents();
        const rampEvent = events.find((e) => e.type === "linearRamp");

        expect(rampEvent?.value).toBe(1.0);
      });

      it("should not clamp when target is within range", () => {
        smoothParam(ctx, param, 0.5, {
          mode: "linear",
          clamp: { min: 0, max: 1.0 },
        });

        const events = param.getScheduledEvents();
        const rampEvent = events.find((e) => e.type === "linearRamp");

        expect(rampEvent?.value).toBe(0.5);
      });
    });

    describe("AC7: Step discontinuity measurements", () => {
      it("should have zero discontinuity for linear smoothing", () => {
        param.value = 0;
        smoothParam(ctx, param, 1.0, { mode: "linear", minDelta: 0 });

        // Maximum step should be from start to target (1.0)
        // But with smoothing, it's ramped, not a discontinuity
        expect(param.hasDiscontinuity()).toBe(false);
      });

      it("should have zero discontinuity for exp smoothing", () => {
        param.value = 0.1;
        smoothParam(ctx, param, 1.0, { mode: "exp", minDelta: 0 });

        expect(param.hasDiscontinuity()).toBe(false);
      });

      it("should have zero discontinuity for setTarget smoothing", () => {
        param.value = 0;
        smoothParam(ctx, param, 1.0, { mode: "setTarget", minDelta: 0 });

        expect(param.hasDiscontinuity()).toBe(false);
      });

      it("should measure step sizes within tolerance for sequential updates", () => {
        // Simulate rapid parameter changes with smoothing
        param.value = 0;

        smoothParam(ctx, param, 0.3, { mode: "linear", time: 0.02 });
        const step1 = param.getMaxStepSize();

        (ctx as unknown as MockAudioContext).currentTime += 0.025; // Advance time
        param.value = 0.3;

        smoothParam(ctx, param, 0.7, { mode: "linear", time: 0.02 });
        const step2 = param.getMaxStepSize();

        // Each step should be smooth, not abrupt
        expect(step1).toBeLessThanOrEqual(0.3); // Initial jump
        expect(step2).toBeLessThanOrEqual(0.7); // Within total range
      });

      it("should prevent discontinuities when changing direction", () => {
        param.value = 0.5;

        // Go up
        smoothParam(ctx, param, 1.0, { mode: "linear" });
        expect(param.hasDiscontinuity()).toBe(false);

        (ctx as unknown as MockAudioContext).currentTime += 0.025;
        param.value = 0.8; // Simulate partial completion

        // Reverse direction
        smoothParam(ctx, param, 0.2, { mode: "linear" });
        expect(param.hasDiscontinuity()).toBe(false);
      });
    });

    describe("AC8: Edge cases", () => {
      it("should handle zero time by using minimum duration", () => {
        smoothParam(ctx, param, 1.0, { mode: "linear", time: 0 });

        const events = param.getScheduledEvents();
        const rampEvent = events.find((e) => e.type === "linearRamp");

        // Should use minimum time (0.001s) instead of zero
        expect(rampEvent?.time).toBeGreaterThan(0);
      });

      it("should handle negative time by clamping to minimum duration", () => {
        smoothParam(ctx, param, 1.0, { mode: "linear", time: -0.1 });

        const events = param.getScheduledEvents();
        const rampEvent = events.find((e) => e.type === "linearRamp");

        // Should clamp to minimum time (0.001s) instead of using absolute value
        expect(rampEvent?.time).toBeGreaterThan(0);
        expect(rampEvent?.time).toBeLessThanOrEqual(0.001);
      });

      it("should handle very small epsilon values", () => {
        param.value = 1e-10;
        smoothParam(ctx, param, 1.0, { mode: "exp", epsilon: 1e-20 });

        const events = param.getScheduledEvents();
        expect(events.length).toBeGreaterThan(0);
      });

      it("should handle large value jumps", () => {
        param.value = 0;
        smoothParam(ctx, param, 1000.0, { mode: "linear" });

        const events = param.getScheduledEvents();
        const rampEvent = events.find((e) => e.type === "linearRamp");

        expect(rampEvent?.value).toBe(1000.0);
        expect(param.hasDiscontinuity()).toBe(false);
      });

      it("should handle same start and target values", () => {
        param.value = 0.5;
        smoothParam(ctx, param, 0.5); // Use default minDelta

        const events = param.getScheduledEvents();
        // Should skip smoothing when values are identical (delta=0 < minDelta=1e-4)
        expect(events).toHaveLength(0);
      });
    });

    describe("AC9: Audio context time handling", () => {
      it("should schedule events starting from current context time", () => {
        (ctx as unknown as MockAudioContext).currentTime = 5.0;
        smoothParam(ctx, param, 1.0, { mode: "linear", time: 0.1 });

        const events = param.getScheduledEvents();
        const setValueEvent = events.find((e) => e.type === "setValue");
        const rampEvent = events.find((e) => e.type === "linearRamp");

        expect(setValueEvent?.time).toBe(5.0);
        expect(rampEvent?.time).toBe(5.1);
      });

      it("should handle advancing audio context time", () => {
        (ctx as unknown as MockAudioContext).currentTime = 0;
        smoothParam(ctx, param, 0.5, { mode: "linear", time: 0.1 });

        (ctx as unknown as MockAudioContext).currentTime = 0.15;
        smoothParam(ctx, param, 1.0, { mode: "linear", time: 0.1 });

        const events = param.getScheduledEvents();
        const lastRamp = events.filter((e) => e.type === "linearRamp").pop();

        expect(lastRamp?.time).toBeCloseTo(0.25, 5);
      });
    });
  });

  describe("smoothParams", () => {
    it("should smooth multiple parameters in one call", () => {
      const param1 = new MockAudioParam(0);
      const param2 = new MockAudioParam(0);
      const param3 = new MockAudioParam(0);

      smoothParams(ctx, [
        { param: param1, target: 1.0, options: { mode: "linear" } },
        { param: param2, target: 0.5, options: { mode: "exp" } },
        { param: param3, target: 0.8, options: { mode: "setTarget" } },
      ]);

      // Each param should have smoothing scheduled
      expect(param1.getScheduledEvents().length).toBeGreaterThan(0);
      expect(param2.getScheduledEvents().length).toBeGreaterThan(0);
      expect(param3.getScheduledEvents().length).toBeGreaterThan(0);
    });

    it("should apply different options to each parameter", () => {
      const param1 = new MockAudioParam(0);
      const param2 = new MockAudioParam(0);

      smoothParams(ctx, [
        { param: param1, target: 1.0, options: { mode: "linear", time: 0.1 } },
        {
          param: param2,
          target: 0.5,
          options: { mode: "setTarget", timeConstant: 0.05 },
        },
      ]);

      const events1 = param1.getScheduledEvents();
      const events2 = param2.getScheduledEvents();

      // Param1 should have linear ramp
      expect(events1.some((e) => e.type === "linearRamp")).toBe(true);

      // Param2 should have setTarget
      expect(events2.some((e) => e.type === "setTarget")).toBe(true);
    });

    it("should handle empty array", () => {
      expect(() => smoothParams(ctx, [])).not.toThrow();
    });

    it("should use default options when not specified", () => {
      const param1 = new MockAudioParam(0);

      smoothParams(ctx, [{ param: param1, target: 1.0 }]);

      const events = param1.getScheduledEvents();
      // Should use default mode (setTarget)
      expect(events.some((e) => e.type === "setTarget")).toBe(true);
    });

    it("should prevent discontinuities for all parameters", () => {
      const param1 = new MockAudioParam(0);
      const param2 = new MockAudioParam(0.5);
      const param3 = new MockAudioParam(1.0);

      smoothParams(ctx, [
        { param: param1, target: 1.0 },
        { param: param2, target: 0.2 },
        { param: param3, target: 0.7 },
      ]);

      expect(param1.hasDiscontinuity()).toBe(false);
      expect(param2.hasDiscontinuity()).toBe(false);
      expect(param3.hasDiscontinuity()).toBe(false);
    });
  });

  describe("Performance and edge cases", () => {
    it("should handle rapid successive calls efficiently", () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        smoothParam(ctx, param, Math.random(), { mode: "linear" });
        (ctx as unknown as MockAudioContext).currentTime += 0.001;
      }

      // Should complete without errors
      expect(param.getScheduledEvents().length).toBeGreaterThan(0);
    });

    it("should handle boundary AudioParam values", () => {
      param.value = Number.MAX_VALUE;
      expect(() =>
        smoothParam(ctx, param, 0, { mode: "linear" }),
      ).not.toThrow();

      param.value = -Number.MAX_VALUE;
      expect(() =>
        smoothParam(ctx, param, 0, { mode: "linear" }),
      ).not.toThrow();
    });

    it("should handle NaN target value gracefully", () => {
      // While we shouldn't pass NaN, the function should not crash
      param.value = 1.0;

      // Passing NaN as target should not crash
      expect(() =>
        smoothParam(ctx, param, NaN, { mode: "linear" }),
      ).not.toThrow();

      const events = param.getScheduledEvents();
      // NaN should result in NaN being passed to the ramp
      const rampEvent = events.find((e) => e.type === "linearRamp");
      expect(rampEvent?.value).toBeNaN();
    });
  });
});
