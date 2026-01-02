import type { Collision } from "Libs/Physics/BodyOptions";
import { CollisionController } from "Libs/Physics/CollisionController";

const PLAYER = CollisionController.instance.register("player");
const ENEMY = CollisionController.instance.register("enemy");
const TRIGGER = CollisionController.instance.register("trigger");
const PLATFORM = CollisionController.instance.register("platform");

export class CollisionHandler {
  public static readonly player: Collision = CollisionHandler.build(PLAYER, [
    PLATFORM,
    ENEMY,
    TRIGGER,
  ]);

  public static readonly enemy: Collision = CollisionHandler.build(ENEMY, [
    ENEMY,
    PLATFORM,
    PLAYER,
  ]);

  public static readonly trigger: Collision = CollisionHandler.build(TRIGGER, [
    PLAYER,
  ]);

  public static readonly platform: Collision = CollisionHandler.build(
    PLATFORM,
    [PLAYER, ENEMY],
  );

  private static build(name: string, collidesWith: string[]): Collision {
    return {
      group: CollisionController.instance.getGroup(name),
      mask: CollisionController.instance.getMask(collidesWith),
    };
  }
}
