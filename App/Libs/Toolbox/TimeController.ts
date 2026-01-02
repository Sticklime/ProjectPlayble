import { Eventail } from "eventail";
import gsap from "gsap";

/**
 * Time management singleton.
 *
 * Tracks raw and scaled time, manages multiple time scale factors, auto-pauses on tab visibility change.
 */
export namespace TimeController {
  export enum Event {
    TICK = 0,
    TIME_SCALE_CHANGED = 1,
  }

  export const instance = new (class extends Eventail {
    private rawTimeInternal = 0;
    private timeInternal = 0;
    private rawDeltaTimeInternal = 0;
    private deltaTimeInternal = 0;
    private timeScaleInternal = 1;
    private readonly timeScaleFactors: Map<string, number> = new Map<
      string,
      number
    >();
    private lastTime: number = performance.now();

    constructor() {
      super();
      gsap.ticker.add(this.onGameShowed);
    }

    /**
     * Raw delta time (seconds, unscaled).
     */
    public get rawDeltaTime(): number {
      return this.rawDeltaTimeInternal;
    }

    /**
     * Scaled delta time (seconds).
     */
    public get deltaTime(): number {
      return this.deltaTimeInternal;
    }

    /**
     * Total raw elapsed time (seconds, unscaled).
     */
    public get rawTime(): number {
      return this.rawTimeInternal;
    }

    /**
     * Total scaled elapsed time (seconds).
     */
    public get time(): number {
      return this.timeInternal;
    }

    /**
     * Combined time scale (product of all factors).
     */
    public get timeScale(): number {
      return this.timeScaleInternal;
    }

    /**
     * Sets named time scale factor. Multiple factors multiply together. Value of 1 removes the factor.
     *
     * @param key - Factor identifier
     * @param value - Scale multiplier (1 = normal, 0.5 = half speed, 2 = double speed)
     */
    public setTimeScale(key: string, value: number): void {
      value === 1
        ? this.timeScaleFactors.delete(key)
        : this.timeScaleFactors.set(key, value);
      this.calculateTimeScale();
    }

    /**
     * Returns named time scale factor value or 1 if not set.
     *
     * @param key - Factor identifier
     */
    public getTimeScale(key: string): number {
      return this.timeScaleFactors.get(key) ?? 1;
    }

    /**
     * Removes named time scale factor.
     *
     * @param key - Factor identifier
     */
    public removeTimeScale(key: string): void {
      if (this.timeScaleFactors.has(key)) {
        this.timeScaleFactors.delete(key);
        this.calculateTimeScale();
      }
    }

    private readonly onGameShowed = (): void => {
      gsap.ticker.remove(this.onGameShowed);
      this.lastTime = performance.now();
      gsap.ticker.add(this.onGameUpdate);
      document.addEventListener("visibilitychange", this.onVisibilityChange);
    };

    private readonly onVisibilityChange = (): void => {
      if (document.visibilityState === "hidden") {
        gsap.ticker.remove(this.onGameUpdate);
      } else {
        this.lastTime = performance.now();
        gsap.ticker.add(this.onGameUpdate);
      }
    };

    private readonly onGameUpdate = (): void => {
      const timestamp = performance.now();

      this.rawDeltaTimeInternal = (timestamp - this.lastTime) / 1000;
      this.deltaTimeInternal =
        this.rawDeltaTimeInternal * this.timeScaleInternal;
      this.rawTimeInternal += this.rawDeltaTimeInternal;
      this.timeInternal += this.deltaTimeInternal;
      this.lastTime = timestamp;

      this.emit(Event.TICK, this.deltaTimeInternal);
    };

    private calculateTimeScale(): void {
      let lastTimeScale = this.timeScaleInternal;
      this.timeScaleInternal = 1;

      for (const value of this.timeScaleFactors.values()) {
        this.timeScaleInternal *= value;
      }

      if (lastTimeScale !== this.timeScaleInternal) {
        this.emit(Event.TIME_SCALE_CHANGED, this.timeScaleInternal);
      }
    }
  })();
}
