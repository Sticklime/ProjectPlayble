import { GraphicsHandler } from "GraphicsHandler";
import { Body } from "Libs/System/Body";
import { ITransform } from "Libs/System/ITransform";
import { Box3, Object3D, Quaternion, Vector3 } from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { TimeHandler } from "TimeHandler";

interface IFragment {
  body: Body;
  object: Object3D;
}

interface IOptions {
  asset: GLTF;
  transform: ITransform;
  hitPosition: Vector3;
  hitDirection: Vector3;
  collisionGroup: number;
  collisionMask: number;
}

export class FracturedObstacle {
  private fragments: IFragment[] = [];

  public constructor(options: IOptions) {
    const children = options.asset.scene.children;
    const box3 = new Box3();
    const tempVector3_0 = new Vector3();
    const tempVector3_1 = new Vector3();
    const tempQuaternion = new Quaternion();

    for (const child of children) {
      box3.setFromObject(child);
      const size = box3.getSize(tempVector3_0);

      const body = new Body(
        { width: size.x, height: size.y, depth: size.z },
        {
          mass: 1,
          collisionGroup: options.collisionGroup,
          collisionMask: options.collisionMask,
        },
      );

      const position = tempVector3_0.addVectors(
        child.position,
        options.transform.position,
      );
      const quaternion = tempQuaternion.multiplyQuaternions(
        child.quaternion,
        options.transform.quaternion,
      );

      const impulsePower = Math.random() * 0.25;
      const impulseDirection = tempVector3_1
        .set(0, 0, 0)
        .subVectors(position, options.hitPosition)
        .add(options.hitDirection)
        .normalize()
        .multiplyScalar(impulsePower);

      body.setTransform(position, quaternion);
      body.applyImpulse(impulseDirection, options.hitPosition);

      const object = child.clone();
      object.position.copy(position);
      object.quaternion.copy(quaternion);
      object.scale.copy(options.transform.scale);
      object.castShadow = true;
      object.receiveShadow = true;
      GraphicsHandler.instance.scene.add(object);

      this.fragments.push({ body, object });
    }

    TimeHandler.instance.on(
      TimeHandler.EEvent.TICK,
      this.onTick,
      this,
      Infinity,
    );
  }

  public destroy() {
    TimeHandler.instance.off(TimeHandler.EEvent.TICK, this.onTick, this);

    for (const fragment of this.fragments) {
      fragment.body.destroy();
      GraphicsHandler.instance.scene.remove(fragment.object);
    }
  }

  private onTick(deltaTime: number): void {
    for (const fragment of this.fragments) {
      fragment.body.getPosition(fragment.object.position);
      fragment.body.getQuaternion(fragment.object.quaternion);
    }
  }
}
