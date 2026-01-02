import type { Vector3Like } from "three";

export interface TinyRange {
  min: number;
  max: number;
}

export interface TinyRangeVector3 {
  min: Vector3Like;
  max: Vector3Like;
}

export interface TinyRangeSpherical {
  theta: TinyRange;
  phi: TinyRange;
  magnitude: TinyRange;
}

function isVector3Like(value: unknown): value is Vector3Like {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value === "object" &&
    "x" in value &&
    typeof value.x === "number" &&
    "y" in value &&
    typeof value.y === "number" &&
    "z" in value &&
    typeof value.z === "number"
  );
}

export function isRange(value: unknown): value is TinyRange {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value === "object" &&
    "min" in value &&
    typeof value.min === "number" &&
    "max" in value &&
    typeof value.max === "number"
  );
}

export function isRangeVector3(value: unknown): value is TinyRangeVector3 {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value === "object" &&
    "min" in value &&
    isVector3Like(value.min) &&
    "max" in value &&
    isVector3Like(value.max)
  );
}

export function isRangeSpherical(value: unknown): value is TinyRangeSpherical {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value === "object" &&
    "theta" in value &&
    isRange(value.theta) &&
    "phi" in value &&
    isRange(value.phi) &&
    "magnitude" in value &&
    isRange(value.magnitude)
  );
}
