import { Emitter } from "eventail";
import { Object3D } from "three";
import { TimeHandler } from "./TimeHandler";

export class Component extends Emitter {
  public constructor(
    public readonly platform: Platform,
    public readonly priority: number = 100,
  ) {
    super();
    //@ts-ignore
    this.platform.addComponent(this);
  }

  protected onTick(deltaTime: number) {}

  protected lateOnTick(deltaTime: number) {}

  public destroy() {
    //@ts-ignore
    this.platform.removeComponent(this);
  }
}

export class Platform extends Object3D {
  private components: Component[] = [];

  public constructor(priority: number = 100) {
    super();
    TimeHandler.instance.on(
      TimeHandler.Event.tick,
      this.onTick,
      this,
      priority,
    );
  }

  public destroy(): void {
    for (const component of this.components) {
      component.destroy();
    }
    this.components = [];
    TimeHandler.instance.off(TimeHandler.Event.tick, this.onTick, this);
    this.parent?.remove(this);
  }

  private onTick(deltaTime: number): void {
    for (const component of this.components) {
      //@ts-ignore
      component.onTick(deltaTime);
    }
  }

  private addComponent(component: Component): void {
    if (this.components.includes(component)) {
      console.warn(`Component ${component.constructor.name} already exists!`);
      return;
    }

    this.components.push(component);
    this.components.sort((a, b) => a.priority - b.priority);
  }

  private removeComponent(component: Component): void {
    const index = this.components.indexOf(component);
    if (index !== -1) {
      this.components.splice(index, 1);
    }
  }

  public getComponent<T extends Component>(
    constructor: new (...args: any[]) => T,
  ): T | undefined {
    return this.components.find((c) => c instanceof constructor) as T;
  }
}
