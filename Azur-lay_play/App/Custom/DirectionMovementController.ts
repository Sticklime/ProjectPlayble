import { IMovementController } from "IMovementController";
import { Vector3 } from "three";
import { TimeHandler } from "TimeHandler";

interface IOptions {
  acceleration?: number;
  deceleration?: number;
  maximumSpeed?: number;
  priority?: number;
  isActive?: boolean;
  direction?: Vector3;
}

export class DirectionMovementController implements IMovementController {
  public position: Vector3;
  public direction: Vector3;

  public readonly acceleration: number;
  public readonly deceleration: number;
  public readonly maximumSpeed: number;

  private readonly priority: number;
  private _velocity: Vector3 = new Vector3();
  private _isActive: boolean;

  private _tempVelocity: Vector3 = new Vector3();

  public constructor(position: Vector3, options: IOptions = {}) {
    this.position = position.clone();
    this.direction = options.direction ?? new Vector3();

    this.acceleration = options.acceleration ?? 8;
    this.deceleration = options.deceleration ?? 8;
    this.maximumSpeed = options.maximumSpeed ?? 8;

    this.priority = options.priority ?? 0;
    this._isActive = options.isActive ?? false;

    if (this._isActive) {
      this.subscribe();
    }
  }

  public destroy() {
    this.unsubscribe();
  }

  private subscribe() {
    TimeHandler.instance.on(
      TimeHandler.EEvent.TICK,
      this.onTick,
      this,
      this.priority,
    );
  }

  private unsubscribe() {
    TimeHandler.instance.off(TimeHandler.EEvent.TICK, this.onTick, this);
  }

  private onTick(deltaTime: number): void {
    if (this._isActive && this.direction.lengthSq() > 1e-5) {
      const targetVelocity = this.direction
        .clone()
        .normalize()
        .multiplyScalar(this.maximumSpeed);

      const velocityDiff = targetVelocity.clone().sub(this._velocity);
      const velocityDiffLength = velocityDiff.length();

      if (velocityDiffLength > 1e-5) {
        const change = Math.min(
          this.acceleration * deltaTime,
          velocityDiffLength,
        );
        this._velocity.addScaledVector(velocityDiff.normalize(), change);
      }
    } else {
      const speed = this._velocity.length();
      if (speed > 1e-5) {
        const decel = Math.min(this.deceleration * deltaTime, speed);
        this._velocity.addScaledVector(
          this._velocity.clone().normalize(),
          -decel,
        );
      } else {
        this._velocity.set(0, 0, 0);
        this.unsubscribe();
      }
    }

    const moveStep = this._velocity.clone().multiplyScalar(deltaTime);
    this.position.add(moveStep);
  }

  public scaleVelocity(scale: number): void {
    this._velocity.multiplyScalar(scale);
  }

  public get currentSpeed(): number {
    return this._velocity.length();
  }

  public get velocity(): Vector3 {
    return this._tempVelocity.copy(this._velocity);
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public set isActive(value: boolean) {
    if (this._isActive === value) return;
    this._isActive = value;

    if (this._isActive) {
      this.subscribe();
    }
  }
}
