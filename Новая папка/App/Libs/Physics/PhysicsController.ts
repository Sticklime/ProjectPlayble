import CannonDebugger from "cannon-es-debugger";
import { Eventail } from "eventail";
import { TimeController } from "../Toolbox/TimeController";
import {
  CannonGSSolver,
  CannonSAPBroadphase,
  CannonWorld,
} from "./cannonImport";
import { PhysicsMaterial } from "./PhysicsMaterial";

const GRAVITY = -9.82 * 5;
const ITERATIONS = 1;
const TOLERANCE = 0.001;
const FIXED_TIME_STEP = 1 / 60;
const PRIORITY = 200;

export namespace PhysicsController {
  export enum Event {
    FIXED_TICK = 0,
    LATE_FIXED_TICK = 1,
  }

  export const instance = new (class extends Eventail {
    public get defaultMaterial(): PhysicsMaterial {
      if (!this.defaultMaterialInternal) {
        this.defaultMaterialInternal = new PhysicsMaterial();
      }
      return this.defaultMaterialInternal;
    }

    public readonly rawCannonWorld: CannonWorld;

    private defaultMaterialInternal?: PhysicsMaterial;
    private accumulator = 0;

    constructor() {
      super();

      const solver = new CannonGSSolver();
      solver.iterations = ITERATIONS;
      solver.tolerance = TOLERANCE;

      this.rawCannonWorld = new CannonWorld({ solver });
      this.rawCannonWorld.broadphase = new CannonSAPBroadphase(
        this.rawCannonWorld,
      );
      this.rawCannonWorld.gravity.set(0, GRAVITY, 0);

      TimeController.instance.on(
        TimeController.Event.TICK,
        this.onTick,
        this,
        PRIORITY,
      );

      if (process.env["NODE_ENV"] === "development") {
        let cannonDebugger: { update: Function } | undefined;

        TimeController.instance.on(
          TimeController.Event.TICK,
          () => {
            if (!cannonDebugger) {
              const scene = App.World?.Scene;
              if (scene) {
                cannonDebugger = CannonDebugger(scene, this.rawCannonWorld, {});
              }
            } else {
              cannonDebugger?.update();
            }
          },
          this,
          PRIORITY,
        );
      }
    }

    private readonly onTick = (deltaTime: number): void => {
      const maxSubStepCount = 2;
      this.accumulator = Math.min(
        this.accumulator + deltaTime,
        maxSubStepCount * FIXED_TIME_STEP,
      );

      while (this.accumulator >= FIXED_TIME_STEP) {
        this.emit(Event.FIXED_TICK, FIXED_TIME_STEP);
        this.rawCannonWorld.step(FIXED_TIME_STEP);
        this.emit(Event.LATE_FIXED_TICK, FIXED_TIME_STEP);
        this.accumulator -= FIXED_TIME_STEP;
      }
    };
  })();
}
