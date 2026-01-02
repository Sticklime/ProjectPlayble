import Broadcast from "Broadcast";
import EventHandler from "EventHandler";

export namespace TimeHandler {
  enum EExternalEvent {
    UPDATE = "Game Update",
    PAUSE = "MRAID paused",
    RESUME = "MRAID resumed",
  }

  export enum EEvent {
    TICK = "TimeHandlerEvent:TICK",
    TIME_SCALE_CHANGED = "TimeHandlerEvent:TIME_SCALE_CHANGED",
  }

  class TimeHandler extends EventHandler {
    private _rawTime: number = 0;
    private _time: number = 0;

    private _rawDeltaTime: number = 0;
    private _deltaTime: number = 0;

    private _timeScale: number = 1;
    private timeScaleFactors: Map<string, number> = new Map<string, number>();

    private lastTime: number = performance.now();

    public constructor() {
      super();
      Broadcast.on(EExternalEvent.UPDATE, this.onGameShowed, this);
    }

    private onGameShowed(): void {
      Broadcast.off(EExternalEvent.UPDATE, this);
      this.lastTime = performance.now();

      Broadcast.on(EExternalEvent.UPDATE, this.onGameUpdate, this);
      Broadcast.on(EExternalEvent.PAUSE, this.onGamePaused, this);
      Broadcast.on(EExternalEvent.RESUME, this.onGameResumed, this);
    }

    private onGamePaused(): void {
      Broadcast.off(EExternalEvent.UPDATE, this);
    }

    private onGameResumed(): void {
      this.lastTime = performance.now();
      Broadcast.on(EExternalEvent.UPDATE, this.onGameUpdate, this);
    }

    private onGameUpdate(): void {
      const timestamp = performance.now();

      this._rawDeltaTime = (timestamp - this.lastTime) / 1000;
      this._deltaTime = this._rawDeltaTime * this._timeScale;

      this._rawTime += this._rawDeltaTime;
      this._time += this._deltaTime;

      this.lastTime = timestamp;
      this.emit(EEvent.TICK, this._deltaTime);
    }

    private _calculateTimeScale(): void {
      this._timeScale = Array.from(this.timeScaleFactors.values()).reduce(
        (timeScale, factor) => timeScale * factor,
        1,
      );

      this.emit(EEvent.TIME_SCALE_CHANGED, this._timeScale);
    }

    public setTimeScale(key: string, value: number): void {
      if (value === 1) this.timeScaleFactors.delete(key);
      else this.timeScaleFactors.set(key, value);
      this._calculateTimeScale();
    }

    public getTimeScale(key: string): number {
      return this.timeScaleFactors.get(key) || 1;
    }

    public removeTimeScale(key: string): void {
      if (this.timeScaleFactors.has(key)) {
        this.timeScaleFactors.delete(key);
        this._calculateTimeScale();
      }
    }

    public get rawDeltaTime(): number {
      return this._rawDeltaTime;
    }

    public get deltaTime(): number {
      return this._deltaTime;
    }

    public get rawTime(): number {
      return this._rawTime;
    }

    public get time(): number {
      return this._time;
    }

    public get timeScale(): number {
      return this._timeScale;
    }
  }

  export const instance: TimeHandler = new TimeHandler();
}
