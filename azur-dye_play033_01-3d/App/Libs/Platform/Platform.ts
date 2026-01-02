import { Object3D } from "three";
import { PhysicsController } from "../Physics/PhysicsController";
import { TimeController } from "../Toolbox/TimeController";
import type { Component } from "./Component";

/**
 * Three.js Object3D wrapper that manages component lifecycle (analogous to MonoBehavior in Unity or nodes in CocosCreator).
 *
 * Coordinates lifecycle callbacks: onBegin (once), onTick (every frame), onFixedTick, onLateFixedTick.
 * Components execute in priority order (lower values first).
 */
export class Platform extends Object3D {
  private readonly components: Component[] = [];

  /**
   * @param priority - Execution priority (lower = earlier, default: 100)
   */
  constructor(priority = 100) {
    super();
    TimeController.instance.once(
      TimeController.Event.TICK,
      this.onBegin,
      this,
      priority,
    );
    TimeController.instance.on(
      TimeController.Event.TICK,
      this.onTick,
      this,
      priority,
    );
    PhysicsController.instance.on(
      PhysicsController.Event.FIXED_TICK,
      this.onFixedTick,
      this,
      priority,
    );
    PhysicsController.instance.on(
      PhysicsController.Event.LATE_FIXED_TICK,
      this.onLateFixedTick,
      this,
      priority,
    );
  }

  /**
   * Unregisters from controllers, destroys all components, removes from scene.
   */
  public destroy(): void {
    TimeController.instance.off(TimeController.Event.TICK, this.onTick, this);
    PhysicsController.instance.off(
      PhysicsController.Event.FIXED_TICK,
      this.onFixedTick,
      this,
    );
    PhysicsController.instance.off(
      PhysicsController.Event.LATE_FIXED_TICK,
      this.onLateFixedTick,
      this,
    );
    const snapshot = this.components.slice();
    for (let i = 0; i < snapshot.length; i++) {
      snapshot[i]?.destroy();
    }
    this.removeFromParent();
  }

  /**
   * Returns first component of type or undefined.
   *
   * @typeParam T - Component type
   * @param constructor - Component class
   */
  public getComponent<T extends Component>(
    constructor: new (...args: any[]) => T,
  ): T | undefined {
    return this.components.find((c) => c instanceof constructor) as T;
  }

  /**
   * Returns first component of type or throws if not found.
   *
   * @typeParam T - Component type
   * @param constructor - Component class
   * @throws Error if component not found
   */
  public forceGetComponent<T extends Component>(
    constructor: new (...args: any[]) => T,
  ): T {
    const component = this.components.find(
      (c) => c instanceof constructor,
    ) as T;
    if (!component) {
      throw new Error(`Component ${constructor.name} not found!`);
    }
    return component;
  }

  /**
   * Registers component (called by Component constructor). Throws if already attached.
   *
   * @param component - Component to register
   * @throws Error if component already attached
   */
  protected addComponent(component: Component): void {
    if (this.components.includes(component)) {
      throw new Error(
        `Component ${component.constructor.name} already exists!`,
      );
      return;
    }

    this.components.push(component);
    // Sort components by priority (lower values execute first)
    this.components.sort((a, b) => a["priority"] - b["priority"]);
  }

  /**
   * Unregisters component (called by Component.destroy()).
   *
   * @param component - Component to unregister
   */
  protected removeComponent(component: Component): void {
    const index = this.components.indexOf(component);
    if (index !== -1) {
      this.components.splice(index, 1);
    }
  }

  /**
   * Invoked once at TimeController start.
   */
  private onBegin(): void {
    const time = TimeController.instance.time;
    for (let i = 0; i < this.components.length; i++) {
      this.components[i]?.["onBegin"]?.(time);
    }
  }

  /**
   * Invoked every frame.
   *
   * @param deltaTime - Time since last frame (seconds)
   */
  private onTick(deltaTime: number): void {
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      if (component?.isActive) {
        component["onTick"]?.(deltaTime);
      }
    }
  }

  /**
   * Invoked before physics step.
   *
   * @param fixedDeltaTime - Fixed time step (seconds)
   */
  private onFixedTick(fixedDeltaTime: number): void {
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      if (component?.isActive) {
        component["onFixedTick"]?.(fixedDeltaTime);
      }
    }
  }

  /**
   * Invoked after physics step.
   *
   * @param fixedDeltaTime - Fixed time step (seconds)
   */
  private onLateFixedTick(fixedDeltaTime: number): void {
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      if (component?.isActive) {
        component["onLateFixedTick"]?.(fixedDeltaTime);
      }
    }
  }
}
