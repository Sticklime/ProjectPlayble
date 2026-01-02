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

export type AnyShape = BoxShape | SphereShape | CylinderShape;

export function isBoxShape(shape: AnyShape): shape is BoxShape {
  return "width" in shape && "height" in shape && "depth" in shape;
}

export function isSphereShape(shape: AnyShape): shape is SphereShape {
  return "radius" in shape;
}

export function isCylinderShape(shape: AnyShape): shape is CylinderShape {
  return "radius" in shape && "height" in shape;
}
