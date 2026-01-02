import { safePromise } from "Libs/Toolbox/safeFunctions";
import type { Group, Object3D, Vector2Like } from "three";
import {
  MathUtils,
  Sprite,
  SpriteMaterial,
  Vector3,
  type Texture,
} from "three";

const COIN_POOL: Sprite[] = [];
let spriteMaterial: SpriteMaterial | undefined;

export class UICoinAnimator {
  public static async animateFromWorldToUI(
    worldPosition: Vector3,
    uiElement: Object3D,
    uiElementOffset: Vector2Like = { x: 0, y: 0 },
    delay = 0,
  ): Promise<void> {
    if (COIN_POOL.length === 0) {
      UICoinAnimator.fillPool(8);
    }

    const camera = App.World.Camera;
    if (camera === undefined) {
      throw new Error("Camera not found");
    }

    const uiCamera = App.World.CameraGUI;
    if (uiCamera === undefined) {
      throw new Error("Camera UI not found");
    }

    const ndcPosition = worldPosition.clone().project(camera);
    const originUIPosition = new Vector3(
      MathUtils.lerp(uiCamera.left, uiCamera.right, ndcPosition.x / 2 + 0.5),
      MathUtils.lerp(uiCamera.bottom, uiCamera.top, ndcPosition.y / 2 + 0.5),
      0,
    );
    const targetUIPosition = uiElement.localToWorld(
      new Vector3(uiElementOffset.x, uiElementOffset.y, 0),);

    originUIPosition.z = targetUIPosition.z + 1;
    targetUIPosition.z = originUIPosition.z;

    const coin = COIN_POOL.pop();
    if (coin === undefined) {
      throw new Error("No coin available");
    }

    coin.visible = true;

    await UICoinAnimator.runUIAnimation(
      coin,
      originUIPosition,
      targetUIPosition,
      delay,
    );

    coin.visible = false;
    COIN_POOL.push(coin);
  }

  public static async animateFromUIToUI(
    fromUIElement: Object3D,
    fromUIElementOffset: Vector2Like = { x: 0, y: 0 },
    toUIElement: Object3D,
    toUIElementOffset: Vector2Like = { x: 0, y: 0 },
    delay = 0,
  ): Promise<void> {
    if (COIN_POOL.length === 0) {
      UICoinAnimator.fillPool(4);
    }

    const uiCamera = App.World.CameraGUI;
    if (uiCamera === undefined) {
      throw new Error("Camera UI not found");
    }

    const originUIPosition = fromUIElement.localToWorld(
      new Vector3(fromUIElementOffset.x, fromUIElementOffset.y, 0),
    );

    const targetUIPosition = toUIElement.localToWorld(
      new Vector3(toUIElementOffset.x, toUIElementOffset.y, 0),
    );

    originUIPosition.z = Math.max(originUIPosition.z, targetUIPosition.z) + 1;
    targetUIPosition.z = originUIPosition.z;

    const coin = COIN_POOL.pop();
    if (coin === undefined) {
      throw new Error("No coin available");
    }

    coin.visible = true;

    await UICoinAnimator.runUIAnimation(
      coin,
      originUIPosition,
      targetUIPosition,
      delay,
    );

    coin.visible = false;
    COIN_POOL.push(coin);
  }

  private static async runUIAnimation(
    coin: Sprite,
    from: Vector3,
    to: Vector3,
    delay: number,
  ): Promise<void> {
    return safePromise((resolve) => {
      const direction = new Vector3().subVectors(to, from);
      const distance = direction.length();
      direction.divideScalar(distance);
      const perpendicular = new Vector3(-direction.y, direction.x, direction.z);

      const offsetMagnitude = distance * MathUtils.randFloat(-0.2, 0.2);
      const coinScale = coin.scale.x;
      const helper = { t: 0 };

      gsap.timeline().to(helper, {
        t: 1,
        delay,
        duration: 1,
        ease: "power1.inOut",
        onUpdate: () => {
          {
            const sin = Math.sin(helper.t * Math.PI);
            coin.position
              .copy(from)
              .addScaledVector(direction, distance * helper.t)
              .addScaledVector(perpendicular, sin * offsetMagnitude);
          }
          {
            const t = Math.sin(helper.t * Math.PI * 0.5);
            const scale = MathUtils.lerp(coinScale * 0.25, coinScale, t);
            coin.scale.set(scale, scale, scale);
          }
        },
        onComplete: resolve,
      });
    });
  }

  private static fillPool(capacity: number): void {
    if (spriteMaterial === undefined) {
      const texture = App.ThreeAssets["coin"] as Texture | undefined;
      if (texture === undefined) {
        throw new Error("Coin texture not found");
      }
      spriteMaterial = new SpriteMaterial({
        map: texture,
        transparent: true,
      });
    }

    const uiContainer = App.Gameplay["UIContainer"] as Group | undefined;
    if (uiContainer === undefined) {
      throw new Error("UIContainer not found");
    }

    for (let i = COIN_POOL.length; i < capacity; i++) {
      const coin = new Sprite(spriteMaterial);
      coin.scale.set(100, 100, 1);
      coin.visible = false;

      uiContainer.add(coin);
      COIN_POOL.push(coin);
    }
  }
}
