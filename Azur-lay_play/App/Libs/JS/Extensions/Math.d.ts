declare interface Math {
  readonly PIQ: number;
  readonly PIH: number;
  readonly PI2: number;
  readonly PI4: number;
  readonly PI6: number;
  readonly PI8: number;

  lerp(value1: number, value2: number, amount: number): number;
  unlerp(value1: number, value2: number, amount: number): number;
  qarp(a: number, b: number, c: number, x: number): number;
  clamp(x: number, min: number, max: number): number;
  clamp01(x: number): number;
  clampAngle(a: number): number;
  randomAngle(): number;
  randomFloat(min: number, max: number): number;
  randomRange(value: number): number;
  randomInt(min: number, max: number): number;
  randomColor(): number;
  randomPositionInCircle(
    outerRadius: number,
    innerRadius?: number,
  ): { x: number; y: number };
  randomSign(): -1 | 1;
  randomBool(edge?: number): boolean;
  mix(x: number, y: number, a: number): number;
  smoothstep(edge0: number, edge1: number, x: number): number;
  doubleSmoothstep(
    x: number,
    fromBegin: number,
    toBegin: number,
    fromEnd: number,
    toEnd: number,
  ): number;
  doubleSmoothstep01(x: number, plateauWidth: number): number;
  step(edge: number, x: number): 0 | 1;
  toGLSLFloatString(value: number): string;
  mapRange(
    v: number,
    iMin: number,
    iMax: number,
    oMin: number,
    oMax: number,
  ): number;
  mapRangeFrom01(v: number, oMin: number, oMax: number): number;
  mapRangeTo01(v: number, iMin: number, iMax: number): number;
  degToRad(deg: number): number;
  radToDeg(rad: number): number;
}
