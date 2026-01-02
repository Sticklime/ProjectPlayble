import { Eventail } from "eventail";
import gsap from "gsap";

/**
 * Time management system for the application.
 *
 * Tracks raw and scaled time, calculates delta time, manages multiple time scale factors,
 * and handles pause/resume on visibility changes.
 *
 * @example
 * ```typescript
 * TimeController.instance.on(TimeController.Event.TICK, (deltaTime) => {
 *   updateGame(deltaTime);
 * });
 *
 * TimeController.instance.setTimeScale("slowmo", 0.5);
 * ```
 */
export namespace TimeController {
  /** Events emitted by the TimeController */
  export enum Event {
    /** Emitted each frame with scaled deltaTime */
    TICK = 0,
    /** Emitted when time scale changes */
    TIME_SCALE_CHANGED = 1,
  }

  /**
   * Singleton instance of the TimeController.
   * Manages time calculations and extends Eventail for event-driven updates.
   */
  export const instance = new (class extends Eventail {
    /** Total elapsed raw time in seconds (unaffected by time scale) */
    private rawTimeInternal = 0;
    /** Total elapsed scaled time in seconds (affected by time scale) */
    private timeInternal = 0;

    /** Raw delta time in seconds for current frame (unaffected by time scale) */
    private rawDeltaTimeInternal = 0;
    /** Scaled delta time in seconds for current frame (affected by time scale) */
    private deltaTimeInternal = 0;

    /** Combined time scale factor (product of all individual factors) */
    private timeScaleInternal = 1;
    /** Map of named time scale factors. Final time scale is the product of all values. */
    private readonly timeScaleFactors: Map<string, number> = new Map<
      string,
      number
    >();

    /** Last timestamp from performance.now() for delta time calculation */
    private lastTime: number = performance.now();

    /** Initializes the TimeController and waits for first game update before starting loop. */
    constructor() {
      super();
      gsap.ticker.add(this.onGameShowed);
    }

    /**
     * Gets the raw delta time for current frame in seconds (unaffected by time scale).
     *
     * @returns Raw delta time in seconds
     */
    public get rawDeltaTime(): number {
      return this.rawDeltaTimeInternal;
    }

    /**
     * Gets the scaled delta time for current frame in seconds (affected by time scale).
     *
     * @returns Scaled delta time in seconds
     */
    public get deltaTime(): number {
      return this.deltaTimeInternal;
    }

    /**
     * Gets total raw elapsed time in seconds (unaffected by time scale).
     *
     * @returns Total raw time in seconds
     */
    public get rawTime(): number {
      return this.rawTimeInternal;
    }

    /**
     * Gets total scaled elapsed time in seconds (affected by time scale).
     *
     * @returns Total scaled time in seconds
     */
    public get time(): number {
      return this.timeInternal;
    }

    /**
     * Gets current combined time scale factor (product of all individual factors).
     *
     * @returns Current time scale (1.0 = normal, 0.5 = half speed, 2.0 = double speed)
     */
    public get timeScale(): number {
      return this.timeScaleInternal;
    }

    /**
     * Sets a named time scale factor. Multiple factors are multiplied together.
     * Setting value to 1 removes the factor.
     *
     * @param key - Identifier for this time scale factor
     * @param value - Time scale multiplier (1.0 = normal, 0.5 = half speed, 2.0 = double speed)
     *
     * @example
     * ```typescript
     * timeController.setTimeScale("slowmo", 0.3);
     * timeController.setTimeScale("pause", 0);
     * timeController.setTimeScale("slowmo", 1); // removes slowmo
     * ```
     */
    public setTimeScale(key: string, value: number): void {
      value === 1
        ? this.timeScaleFactors.delete(key)
        : this.timeScaleFactors.set(key, value);
      this.calculateTimeScale();
    }

    /**
     * Gets the current value of a named time scale factor.
     *
     * @param key - Identifier of the time scale factor
     * @returns Time scale factor value, or 1 if key doesn't exist
     */
    public getTimeScale(key: string): number {
      return this.timeScaleFactors.get(key) ?? 1;
    }

    /**
     * Removes a named time scale factor. Different from setting value to 1.
     *
     * @param key - Identifier of the time scale factor to remove
     */
    public removeTimeScale(key: string): void {
      if (this.timeScaleFactors.has(key)) {
        this.timeScaleFactors.delete(key);
        this.calculateTimeScale();
      }
    }

    /** Handles initial game show event and sets up main update loop. */
    private readonly onGameShowed = (): void => {
      gsap.ticker.remove(this.onGameShowed);
      this.lastTime = performance.now();
      gsap.ticker.add(this.onGameUpdate);
      document.addEventListener("visibilitychange", this.onVisibilityChange);
    };

    /**
     * Handles visibility changes to pause/resume the time controller.
     * Pauses when tab is hidden, resumes with reset timestamp when visible.
     */
    private readonly onVisibilityChange = (): void => {
      if (document.visibilityState === "hidden") {
        gsap.ticker.remove(this.onGameUpdate);
      } else {
        this.lastTime = performance.now();
        gsap.ticker.add(this.onGameUpdate);
      }
    };

    /**
     * Main update method called each frame.
     * Calculates delta time, applies time scale, accumulates total time, and emits TICK event.
     */
    private readonly onGameUpdate = (): void => {
      const timestamp = performance.now();

      // Calculate raw delta time in seconds
      this.rawDeltaTimeInternal = (timestamp - this.lastTime) / 1000;

      // Apply time scale to get scaled delta time
      this.deltaTimeInternal =
        this.rawDeltaTimeInternal * this.timeScaleInternal;

      // Accumulate total times
      this.rawTimeInternal += this.rawDeltaTimeInternal;
      this.timeInternal += this.deltaTimeInternal;

      // Update timestamp for next frame
      this.lastTime = timestamp;

      // Emit tick event with scaled delta time
      this.emit(Event.TICK, this.deltaTimeInternal);
    };

    /**
     * Recalculates combined time scale by multiplying all factors.
     * Emits TIME_SCALE_CHANGED event if time scale changed.
     */
    private calculateTimeScale(): void {
      let lastTimeScale = this.timeScaleInternal;
      this.timeScaleInternal = 1;

      // Multiply all time scale factors together
      for (const value of this.timeScaleFactors.values()) {
        this.timeScaleInternal *= value;
      }

      // Emit event if time scale changed
      if (lastTimeScale !== this.timeScaleInternal) {
        this.emit(Event.TIME_SCALE_CHANGED, this.timeScaleInternal);
      }
    }
  })();
}
