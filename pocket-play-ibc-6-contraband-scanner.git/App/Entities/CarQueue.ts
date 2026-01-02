import { AnchorKeeper } from "Generated/AnchorKeeper";
import { AssetKeeper } from "Generated/AssetKeeper";
import { TinyParticleEmitter } from "Libs/TinyParticleSystem/TinyEmitter";
import { TinyParticleSystem } from "Libs/TinyParticleSystem/TinyParticleSystem";
import { safePromise } from "Libs/Toolbox/safeFunctions";
import { TimeController } from "Libs/Toolbox/TimeController";
import { Box3, MathUtils, Mesh, Vector3, type Object3D } from "three";
import { SceneTraversal } from "three-zoo";

interface CarDescriptor {
  object: Object3D;
  emojiEmitter?: TinyParticleEmitter;
  smokeEmitter?: TinyParticleEmitter;
}

export class CarQueue {
  private pendingCar?: CarDescriptor;
  private readonly queue: CarDescriptor[] = [];
  private readonly emojiParticleSystem = new TinyParticleSystem(
    {
      capacity: 1024,
    },
    {
      texture: AssetKeeper.T_Angry_Emoji[0],
      depthTest: false,
      depthWrite: false,
    },
  );
  private readonly smokeParticleSystem = new TinyParticleSystem(
    {
      capacity: 1024,
    },
    {
      texture: AssetKeeper.T_Smoke[0],
    },
  );

  constructor(carCount: number) {
    const asset = AssetKeeper.Cars.scene.clone();

    SceneTraversal.enumerateObjectsByType(asset, Mesh, (mesh) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    const tempBox3 = new Box3();
    const tempVector3 = new Vector3();

    for (let i = 0; i < carCount; i++) {
      const object = SceneTraversal.getObjectByName(
        asset,
        `car-${i + 1}`,
      ) as Mesh;

      object.updateWorldMatrix(true, true);
      object.position.copy(AnchorKeeper.Scene.ANC_Queue.position);
      object.position.z += i * 5;
      tempBox3.setFromObject(object);
      tempBox3.getSize(tempVector3);

      let emojiEmitter: TinyParticleEmitter | undefined;
      let smokeEmitter: TinyParticleEmitter | undefined;

      if (Settings["enable-emoji"]) {
        emojiEmitter = new TinyParticleEmitter(
          {
            playByDefault: true,
            playTime: 8192,
            spawnRate: 2,
            system: this.emojiParticleSystem,
            isLocalSpace: true,
          },
          {
            lifeTimeRange: { min: 2, max: 3 },
            positionRange: {
              min: {
                x: -tempVector3.x * 0.25,
                y: tempVector3.y,
                z: -tempVector3.z * 0.25,
              },
              max: {
                x: tempVector3.x * 0.25,
                y: tempVector3.y,
                z: tempVector3.z * 0.25,
              },
            },
            rotationRange: { min: -0.25, max: 0.25 },
            scaleOverTime: [
              { min: 0, max: 0 },
              { min: 0.35, max: 0.75 },
              { min: 0, max: 0 },
            ],
            opacityOverTime: [
              { min: 0, max: 0 },
              { min: 1, max: 1 },
              { min: 0, max: 0 },
            ],
            velocityRange: {
              theta: { min: 0, max: 0 },
              phi: { min: 0, max: 0 },
              magnitude: { min: 0.5, max: 1 },
            },
            angularVelocityRange: { min: 0, max: 0 },
          },
        );
        object.add(emojiEmitter);
      }

      if (Settings["enable-smoke"]) {
        const smokeOffset = {
          x: tempVector3.x * 0.35,
          y: tempVector3.y * 0.25,
          z: tempVector3.z / 2,
        };

        smokeEmitter = new TinyParticleEmitter(
          {
            playByDefault: true,
            playTime: 8192,
            spawnRate: 32,
            system: this.smokeParticleSystem,
          },
          {
            lifeTimeRange: { min: 0.5, max: 1 },
            positionRange: {
              min: smokeOffset,
              max: smokeOffset,
            },
            rotationRange: { min: -Math.PI, max: Math.PI },
            scaleOverTime: [
              { min: 0, max: 0 },
              { min: 0.5, max: 1 },
            ],
            opacityOverTime: [
              { min: 0.1, max: 0.15 },
              { min: 0, max: 0 },
            ],
            velocityRange: {
              theta: { min: -Math.PI / 2, max: -Math.PI / 2 },
              phi: { min: Math.PI / 2, max: Math.PI / 2 },
              magnitude: { min: 1, max: 2 },
            },
            angularVelocityRange: { min: -2, max: 2 },
          },
        );
        object.add(smokeEmitter);
      }

      this.queue.push({ object, emojiEmitter, smokeEmitter });
      App.World?.Scene.add(object);
    }

    TimeController.instance.on(TimeController.Event.TICK, () => {
      if (this.pendingCar) {
        this.animateCar(this.pendingCar.object);
      }

      for (const { object } of this.queue) {
        this.animateCar(object);
      }
    });
  }

  public flushPendingCar() {
    this.pendingCar?.object?.removeFromParent();
    this.pendingCar?.emojiEmitter?.destroy();
    this.pendingCar?.smokeEmitter?.destroy();
    this.pendingCar = undefined;
  }

  public async move(): Promise<void> {
    this.flushPendingCar();

    const duration = 1.5;
    let previousCarPosition = AnchorKeeper.Scene.ANC_Scanner.position.z;

    await Promise.all(
      this.queue.map(({ object }, i) => {
        const carPosition = object.position.z;
        const promise = this.moveCarByDistance(
          object,
          i * duration * 0.25,
          duration,
          previousCarPosition,
        );
        previousCarPosition = carPosition;
        return promise;
      }),
    );

    this.pendingCar = this.queue.shift();
  }

  private async moveCarByDistance(
    car: Object3D,
    delay: number,
    duration: number,
    position: number,
  ): Promise<void> {
    return safePromise((resolve) => {
      gsap.to(car.position, {
        z: position,
        delay,
        duration,
        ease: "power2.inOut",
        onComplete: resolve,
      });

      for (const wheel of car.children) {
        if (wheel.name.includes("wheel")) {
          gsap.to(wheel.rotation, {
            x: "+=4",
            delay,
            duration,
            ease: "power2.inOut",
          });
        }
      }
    });
  }

  public switchToHappyParticles() {
    this.emojiParticleSystem.setNewTexture(AssetKeeper.T_Happy_Emoji[0]);
  }

  private animateCar(car: Object3D) {
    car.scale.y = MathUtils.mapLinear(
      Math.sin(TimeController.instance.time * 50),
      -1,
      1,
      0.995,
      1.005,
    );
  }
}
