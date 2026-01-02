import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import { GraphicsHandler } from "./GraphicsHandler";
import { TimeHandler } from "./TimeHandler";

export namespace PhysicsHandler {
  const solver = new CANNON.GSSolver();
  solver.iterations = 8;
  solver.tolerance = 0.001;

  export const instance: CANNON.World = new CANNON.World({ solver });
  instance.broadphase = new CANNON.SAPBroadphase(instance);
  instance.gravity.set(0, -9.82, 0);

  let cannonDebugger: { update: Function } | null = null;
  const frameDuration = 1 / 45;

  TimeHandler.instance.once(
    TimeHandler.Event.tick,
    (deltaTime: number) => {
      cannonDebugger = CannonDebugger(
        GraphicsHandler.instance.scene,
        instance,
        {},
      );
    },
    null,
    0,
  );

  TimeHandler.instance.on(
    TimeHandler.Event.tick,
    (deltaTime: number) => {
      instance.step(frameDuration, deltaTime);
      // cannonDebugger?.update();
    },
    instance,
    2000,
  );
}
