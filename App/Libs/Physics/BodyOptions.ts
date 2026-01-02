export enum BodyAxis {
  X = 1 << 0,
  Y = 1 << 1,
  Z = 1 << 2,
}

export interface Collision {
  readonly group: number;
  readonly mask: number;
}

export interface DynamicOptions {
  mass: number;

  linearLock?: BodyAxis;
  angularLock?: BodyAxis;

  collision?: Collision;
}

export interface StaticOptions {
  isKinematic: boolean;
  collision?: Collision;
}

export function isDynamicOptions(object: unknown): object is DynamicOptions {
  return (
    typeof object === "object" &&
    object !== null &&
    "mass" in object &&
    !("isKinematic" in object) &&
    typeof object.mass === "number"
  );
}

export function isStaticOptions(object: unknown): object is StaticOptions {
  return (
    typeof object === "object" &&
    object !== null &&
    !("mass" in object) &&
    "isKinematic" in object &&
    typeof object.isKinematic === "boolean"
  );
}
