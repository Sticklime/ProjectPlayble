import { Vector3Like } from "three";

export interface IRange {
  min: number;
  max: number;
}

export interface IRangeVector3 {
  min: Vector3Like;
  max: Vector3Like;
}

export interface IRangeSpherical {
  theta: IRange;
  phi: IRange;
  magnitude: IRange;
}

function isVector3Like(value: any): value is Vector3Like {
  return (
    value != null &&
    typeof value === "object" &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.z === "number"
  );
}

export function isIRange(value: any): value is IRange {
  return (
    value != null &&
    typeof value === "object" &&
    typeof value.min === "number" &&
    typeof value.max === "number"
  );
}

export function isIRangeVector3(value: any): value is IRangeVector3 {
  return (
    value != null &&
    typeof value === "object" &&
    isVector3Like(value.min) &&
    isVector3Like(value.max)
  );
}

export function isIRangeSpherical(value: any): value is IRangeSpherical {
  return (
    value != null &&
    typeof value === "object" &&
    isIRange(value.theta) &&
    isIRange(value.phi) &&
    isIRange(value.magnitude)
  );
}
