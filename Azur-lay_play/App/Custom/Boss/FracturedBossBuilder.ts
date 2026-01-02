import { ITransform } from "Libs/System/ITransform";
import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { FracturedBoss } from "./FracturedBoss";

interface IFragment {
  object: THREE.Object3D;
  transform: ITransform;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
}

interface IMovementInfo {
  previousMatrix: THREE.Matrix4;
  currentMatrix: THREE.Matrix4;
}

interface IOptions {
  asset: GLTF;

  head: IMovementInfo;
  body: IMovementInfo;
  pelvis: IMovementInfo;
  sword: IMovementInfo;
  handLeft: IMovementInfo;
  handRight: IMovementInfo;
  legLeft: IMovementInfo;
  legRight: IMovementInfo;

  deltaTime: number;

  collisionGroup: number;
  collisionMask: number;
}

export class FracturedBossBuilder extends FracturedBoss {
  public static build(options: IOptions): FracturedBoss {
    const createFragmentInfo = (
      objectName: string,
      movementInfo: IMovementInfo,
      deltaTime: number,
    ): IFragment => {
      const object = options.asset.scene.getObjectByName(objectName)?.clone();
      if (!object) {
        throw new Error(`Missing object: ${objectName}`);
      }

      const previousPosition = new THREE.Vector3();
      const previousQuaternion = new THREE.Quaternion();
      const previousScale = new THREE.Vector3();

      const currentPosition = new THREE.Vector3();
      const currentQuaternion = new THREE.Quaternion();
      const currentScale = new THREE.Vector3();

      movementInfo.previousMatrix.decompose(
        previousPosition,
        previousQuaternion,
        previousScale,
      );
      movementInfo.currentMatrix.decompose(
        currentPosition,
        currentQuaternion,
        currentScale,
      );

      const velocity = currentPosition
        .clone()
        .sub(previousPosition)
        .divideScalar(deltaTime);

      const angularVelocity = new THREE.Vector3()
        .crossVectors(
          previousQuaternion.clone().invert().multiply(currentQuaternion),
          new THREE.Vector3(0, 1, 0),
        )
        .divideScalar(deltaTime);

      return {
        object,
        transform: {
          position: currentPosition,
          quaternion: currentQuaternion,
          scale: currentScale,
        },
        velocity,
        angularVelocity,
      };
    };

    return new FracturedBoss({
      fragments: [
        createFragmentInfo("SM_Head", options.head, options.deltaTime),
        createFragmentInfo("SM_Body", options.body, options.deltaTime),
        createFragmentInfo("SM_Pelvis", options.pelvis, options.deltaTime),
        createFragmentInfo("SM_Sword", options.sword, options.deltaTime),
        createFragmentInfo("SM_Arm_Left", options.handLeft, options.deltaTime),
        createFragmentInfo(
          "SM_Arm_Right",
          options.handRight,
          options.deltaTime,
        ),
        createFragmentInfo("SM_Leg_Left", options.legLeft, options.deltaTime),
        createFragmentInfo("SM_Leg_Right", options.legRight, options.deltaTime),
      ],

      collisionGroup: options.collisionGroup,
      collisionMask: options.collisionMask,
    });
  }
}
