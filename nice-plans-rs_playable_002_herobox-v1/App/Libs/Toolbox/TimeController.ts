import { Eventail } from "eventail";
import gsap from "gsap";

/**
 * Global time management system for the application.
 *
 * Provides centralized time tracking with support for:
 * - Raw time (unscaled) and scaled time
 * - Delta time calculations for frame-rate independent updates
 * - Multiple time scale factors that can be combined
 * - Automatic pause/resume on visibility changes
 * - Event emission for time updates and scale changes
 *
 * @example
 * ```typescript
 * // Listen for tick events
 * TimeController.instance.on(TimeController.Event.TICK, (deltaTime) => {
 *   updateGame(deltaTime);
 * });
 *
 * // Set slow motion effect
 * TimeController.instance.setTimeScale("slowmo", 0.5);
 *
 * // Set bullet time effect (combines with existing scales)
 * TimeController.instance.setTimeScale("bullettime", 0.1);
 * ```
 */
export namespace TimeController {
  /** Public events emitted by the TimeController */
  export enum Event {
    /** Emitted every frame with scaled deltaTime */
    TICK = "TICK",
    /** Emitted when the combined time scale changes */
    TIME_SCALE_CHANGED = "TIME_SCALE_CHANGED",
  }

  /**
   * Singleton instance of the TimeController.
   *
   * This class manages all time-related calculations and provides a centralized
   * time system for the entire application. It extends Eventail to provide
   * event-driven time updates.
   */
  export const instance = new (class extends Eventail {
    /** Total elapsed raw time in seconds since initialization (unaffected by time scale) */
    private rawTimeInternal = 0;
    /** Total elapsed scaled time in seconds since initialization (affected by time scale) */
    private timeInternal = 0;

    /** Raw delta time in seconds for the current frame (unaffected by time scale) */
    private rawDeltaTimeInternal = 0;
    /** Scaled delta time in seconds for the current frame (affected by time scale) */
    private deltaTimeInternal = 0;

    /** Combined time scale factor (product of all individual time scale factors) */
    private timeScaleInternal = 1;
    /**
     * Map of named time scale factors that can be set independently.
     * The final time scale is the product of all values in this map.
     */
    private readonly timeScaleFactors: Map<string, number> = new Map<
      string,
      number
    >();

    /** Last recorded timestamp from performance.now() for delta time calculation */
    private lastTime: number = performance.now();

    /**
     * Initializes the TimeController and sets up initial event listeners.
     * Waits for the first game update event before starting the main update loop.
     */
    constructor() {
      super();
      gsap.ticker.add(this.onGameShowed);
    }

    /**
     * Gets the raw delta time for the current frame in seconds.
     * This value is unaffected by time scale and represents the actual elapsed time.
     *
     * @returns Raw delta time in seconds
     */
    public get rawDeltaTime(): number {
      return this.rawDeltaTimeInternal;
    }

    /**
     * Gets the scaled delta time for the current frame in seconds.
     * This value is affected by the current time scale and should be used
     * for frame-rate independent animations and updates.
     *
     * @returns Scaled delta time in seconds
     */
    public get deltaTime(): number {
      return this.deltaTimeInternal;
    }

    /**
     * Gets the total raw elapsed time since initialization in seconds.
     * This value is unaffected by time scale.
     *
     * @returns Total raw time in seconds
     */
    public get rawTime(): number {
      return this.rawTimeInternal;
    }

    /**
     * Gets the total scaled elapsed time since initialization in seconds.
     * This value is affected by time scale changes throughout the application's lifetime.
     *
     * @returns Total scaled time in seconds
     */
    public get time(): number {
      return this.timeInternal;
    }

    /**
     * Gets the current combined time scale factor.
     * This is the product of all individual time scale factors.
     *
     * @returns Current time scale (1.0 = normal speed, 0.5 = half speed, 2.0 = double speed)
     */
    public get timeScale(): number {
      return this.timeScaleInternal;
    }

    /**
     * Sets a named time scale factor.
     * Multiple time scale factors can be active simultaneously and will be multiplied together.
     * Setting a value of 1 effectively removes the time scale factor.
     *
     * @param key - Unique identifier for this time scale factor
     * @param value - Time scale multiplier (1.0 = normal, 0.5 = half speed, 2.0 = double speed)
     *
     * @example
     * ```typescript
     * // Slow motion effect
     * timeController.setTimeScale("slowmo", 0.3);
     *
     * // Pause effect (can be combined with other effects)
     * timeController.setTimeScale("pause", 0);
     *
     * // Remove slow motion (equivalent to setting value to 1)
     * timeController.setTimeScale("slowmo", 1);
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
     * @param key - The identifier of the time scale factor to retrieve
     * @returns The time scale factor value, or 1 if the key doesn't exist
     */
    public getTimeScale(key: string): number {
      return this.timeScaleFactors.get(key) ?? 1;
    }

    /**
     * Removes a named time scale factor completely.
     * This is different from setting the value to 1, as it actually removes the factor
     * from the internal map.
     *
     * @param key - The identifier of the time scale factor to remove
     */
    public removeTimeScale(key: string): void {
      if (this.timeScaleFactors.has(key)) {
        this.timeScaleFactors.delete(key);
        this.calculateTimeScale();
      }
    }

    /**
     * Handles the initial game show event and transitions from initialization to active state.
     * Sets up the main update loop and visibility change handling.
     */
    private readonly onGameShowed = (): void => {
      gsap.ticker.remove(this.onGameShowed);
      this.lastTime = performance.now();
      gsap.ticker.add(this.onGameUpdate);
      document.addEventListener("visibilitychange", this.onVisibilityChange);
    };

    /**
     * Handles browser visibility changes to automatically pause/resume the time controller.
     * When the tab becomes hidden, the controller pauses to prevent time accumulation.
     * When the tab becomes visible again, it resumes with a reset timestamp.
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
     * Main update method called every frame by the game loop.
     *
     * Performs the following calculations:
     * 1. Calculates raw delta time from performance.now() timestamps
     * 2. Applies time scale to get scaled delta time
     * 3. Accumulates both raw and scaled total time
     * 4. Emits TICK event with scaled delta time for subscribers
     *
     * Mathematical operations:
     * - rawDeltaTime = (currentTimestamp - lastTimestamp) / 1000 (convert ms to seconds)
     * - scaledDeltaTime = rawDeltaTime * timeScale
     * - rawTime += rawDeltaTime (accumulate unscaled time)
     * - scaledTime += scaledDeltaTime (accumulate scaled time)
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
     * Recalculates the combined time scale by multiplying all individual time scale factors.
     * Emits TIME_SCALE_CHANGED event if the final time scale has changed.
     *
     * Mathematical operation:
     * timeScale = factor1 * factor2 * factor3 * ... * factorN
     *
     * @example
     * If we have:
     * - "slowmo": 0.5
     * - "bullettime": 0.1
     * - "speedup": 2.0
     *
     * Final time scale = 0.5 * 0.1 * 2.0 = 0.1 (very slow motion)
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
