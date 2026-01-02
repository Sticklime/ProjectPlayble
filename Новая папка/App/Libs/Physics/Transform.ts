import { Quaternion, Vector3 } from "three";

export interface Transform {
  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
}

export interface TransformUnitScale {
  position: Vector3;
  quaternion: Quaternion;
}

export function isTransform(object: unknown): object is Transform {
  return (
    object !== null &&
    typeof object === "object" &&
    "position" in object &&
    object.position instanceof Vector3 &&
    "quaternion" in object &&
    object.quaternion instanceof Quaternion &&
    "scale" in object &&
    object.scale instanceof Vector3
  );
}

export function isTransformUnitScale(
  object: unknown,
): object is TransformUnitScale {
  return (
    object !== null &&
    typeof object === "object" &&
    "position" in object &&
    object.position instanceof Vector3 &&
    "quaternion" in object &&
    object.quaternion instanceof Quaternion
  );
}
