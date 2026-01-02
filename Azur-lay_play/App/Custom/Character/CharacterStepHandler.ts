import EventHandler from "Libs/System/EventHandler";

export enum ECharacterStepHandlerEvent {
  STEP = "ECharacterStepHandlerEvent:STEP",
}

interface IOptions {
  stepFrequency: number;
  maximumSpeed: number;
}

export class CharacterStepHandler extends EventHandler {
  private readonly stepFrequency: number;
  private readonly maximumSpeed: number;

  private timeAccumulator: number = 0;
  private stepInterval: number;

  public constructor(options: IOptions) {
    super();

    this.stepFrequency = options.stepFrequency;
    this.maximumSpeed = options.maximumSpeed;

    this.stepInterval = 1 / this.stepFrequency;
  }

  public updateState(currentSpeed: number, deltaTime: number) {
    if (currentSpeed <= 0) return;

    const speedRatio = Math.min(currentSpeed / this.maximumSpeed, 1);
    const actualInterval = this.stepInterval / speedRatio;

    this.timeAccumulator += deltaTime;

    while (this.timeAccumulator >= actualInterval) {
      this.timeAccumulator -= actualInterval;
      this.emit(ECharacterStepHandlerEvent.STEP);
    }
  }
}
