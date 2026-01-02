export interface BoxShape {
  width: number;
  height: number;
  depth: number;
}

export interface SphereShape {
  radius: number;
}

export interface CylinderShape {
  radius: number;
  height: number;
}

export function isBoxShape(object: unknown): object is BoxShape {
  return (
    typeof object === "object" &&
    object !== null &&
    "width" in object &&
    "height" in object &&
    "depth" in object &&
    typeof object.width === "number" &&
    typeof object.height === "number" &&
    typeof object.depth === "number"
  );
}

export function isSphereShape(object: unknown): object is SphereShape {
  return (
    typeof object === "object" &&
    object !== null &&
    "radius" in object &&
    typeof object.radius === "number"
  );
}

export function isCylinderShape(object: unknown): object is CylinderShape {
  return (
    typeof object === "object" &&
    object !== null &&
    "radius" in object &&
    typeof object.radius === "number" &&
    "height" in object &&
    typeof object.height === "number"
  );
}
