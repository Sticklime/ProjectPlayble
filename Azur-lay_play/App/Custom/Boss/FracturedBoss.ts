import { Body } from "Libs/System/Body";
import { GraphicsHandler } from "Libs/System/GraphicsHandler";
import { ITransform } from "Libs/System/ITransform";
import { TimeHandler } from "Libs/System/TimeHandler";
import * as THREE from "three";

interface IFragment {
  object: THREE.Object3D;
  body: Body;
}

interface IFragmentInfo {
  object: THREE.Object3D;
  transform: ITransform;

  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
}

interface IOptions {
  fragments: IFragmentInfo[];
  collisionGroup: number;
  collisionMask: number;
}

export class FracturedBoss {
  private fragments: IFragment[] = [];

  protected constructor(options: IOptions) {
    for (const fragment of options.fragments) {
      GraphicsHandler.instance.scene.add(fragment.object);

      fragment.object.position.copy(fragment.transform.position);
      fragment.object.quaternion.copy(fragment.transform.quaternion);
      fragment.object.scale.copy(fragment.transform.scale);

      const body = new Body(
        { radius: 1 },
        {
          mass: 1,
          collisionGroup: options.collisionGroup,
          collisionMask: options.collisionMask,
        },
      );

      body.setPosition(fragment.transform.position);
      body.setQuaternion(fragment.transform.quaternion);
      body.setVelocity(fragment.velocity.clone().multiplyScalar(2));
      body.setAngularVelocity(fragment.angularVelocity);

      this.fragments.push({ object: fragment.object, body });
    }

    TimeHandler.instance.on(TimeHandler.EEvent.TICK, this.onTick, this);
  }

  public destroy() {
    TimeHandler.instance.off(TimeHandler.EEvent.TICK, this.onTick, this);

    for (const fragment of this.fragments) {
      fragment.body.destroy();
      GraphicsHandler.instance.scene.remove(fragment.object);
    }
  }

  private onTick(deltaTime: number) {
    for (const fragment of this.fragments) {
      fragment.body.getPosition(fragment.object.position);
      fragment.body.getQuaternion(fragment.object.quaternion);
    }
  }
}
