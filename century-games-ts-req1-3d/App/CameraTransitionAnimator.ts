import { gsap } from "gsap";
import { safePromise } from "Libs/Toolbox/safeFunctions";
import type { PerspectiveCamera, Vector3Like } from "three";
import { Matrix4, Quaternion, Vector3 } from "three";

export class CameraTransitionAnimator {
  public static animate(options: {
    camera: PerspectiveCamera;
    targetPosition: Vector3Like;
    targetLookAt: Vector3Like;
    targetFov: number;
    duration: number;
  }): Promise<void> {
    const {
      camera,
      targetPosition,
      targetLookAt,
      targetFov = camera.fov,
      duration = 1,
    } = options;

    return safePromise((resolve) => {
      const timeline = gsap.timeline({ onComplete: resolve });

      timeline.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration,
        ease: "power2.inOut",
      });

      const currentQuaternion = camera.quaternion.clone();
      const targetDirection = new Vector3()
        .subVectors(targetPosition, targetLookAt)
        .normalize();

      const right = new Vector3()
        .crossVectors(new Vector3(0, 1, 0), targetDirection)
        .normalize();
      const up = new Vector3()
        .crossVectors(targetDirection, right)
        .normalize();
      const rotationMatrix = new Matrix4().makeBasis(
        right,
        up,
        targetDirection,
      );

      const targetQuaternion = new Quaternion().setFromRotationMatrix(
        rotationMatrix,
      );
      const helper = { t: 0 };

      timeline.to(
        helper,
        {
          t: 1,
          duration,
          ease: "power2.inOut",
          onUpdate: () => {
            camera.quaternion.slerpQuaternions(
              currentQuaternion,
              targetQuaternion,
              helper.t,
            );
          },
        },
        0,
      );

      if (targetFov !== camera.fov) {
        timeline.to(
          camera,
          {
            fov: targetFov,
            duration,
            ease: "power2.inOut",
            onUpdate: () => {
              camera.updateProjectionMatrix();
            },
          },
          0,
        );
      }

      if (targetLookAt !== camera.position) {
        timeline.to(
          camera,
          {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            duration,
            ease: "power2.inOut",
            onUpdate: () => {
              camera.updateProjectionMatrix();
            },
          },
          0,
        );
      }
    });
  }
}
