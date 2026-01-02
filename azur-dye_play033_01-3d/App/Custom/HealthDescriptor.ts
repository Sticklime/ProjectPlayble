import { Eventail } from "eventail";
import { safePromise } from "Libs/Toolbox/safeFunctions";

export enum HealthDescriptorEvent {
  DEATH,
  DAMAGE,
}

export class HealthDescriptor extends Eventail {
  private valueInternal: number;
  private maximumValueInternal: number;

  constructor(value: number, maximumValue: number) {
    super();
    this.valueInternal = value;
    this.maximumValueInternal = maximumValue;
  }

  public get value(): number {
    return this.valueInternal;
  }

  public get maxValue(): number {
    return this.maximumValueInternal;
  }

  public set maxValue(value: number) {
    this.maximumValueInternal = value;
    this.valueInternal = Math.min(
      this.valueInternal,
      this.maximumValueInternal,
    );
  }

  public applyDamage(value: number): void {
    if (this.valueInternal > 0) {
      this.valueInternal = Math.max(0, this.valueInternal - value);

      this.emit(
        this.valueInternal > 0
          ? HealthDescriptorEvent.DAMAGE
          : HealthDescriptorEvent.DEATH,
        this,
      );
    }
  }

  public async restore(duration: number) {
    return safePromise((resolve) => {
      const helper = { value: this.valueInternal };
      gsap.to(helper, {
        value: this.maximumValueInternal,
        duration,
        ease: "power1.inOut",
        onUpdate: () => {
          this.valueInternal = helper.value;
        },
        onComplete: resolve,
      });
    });
  }
}
