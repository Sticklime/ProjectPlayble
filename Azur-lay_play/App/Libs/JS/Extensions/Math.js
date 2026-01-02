/**
 * Constants for PI values.
 */
Object.defineProperties(Math, {
  PIQ: { value: Math.PI / 4, writable: false }, // π/4
  PIH: { value: Math.PI / 2, writable: false }, // π/2
  PI2: { value: Math.PI * 2, writable: false }, // 2π
  PI4: { value: Math.PI * 4, writable: false }, // 4π
  PI6: { value: Math.PI * 6, writable: false }, // 6π
  PI8: { value: Math.PI * 8, writable: false }, // 8π
});

/**
 * Performs linear interpolation between two values.
 * @param {number} value1 - The starting value.
 * @param {number} value2 - The ending value.
 * @param {number} amount - The interpolation factor (usually between 0 and 1).
 * @returns {number} The interpolated value.
 */
Math.lerp = (value1, value2, amount) => value1 + (value2 - value1) * amount;

/**
 * Performs inverse linear interpolation to find the interpolation factor.
 * @param {number} value1 - The starting value.
 * @param {number} value2 - The ending value.
 * @param {number} amount - The value to find the interpolation factor for.
 * @returns {number} The interpolation factor.
 */
Math.unlerp = (value1, value2, amount) => (amount - value1) / (value2 - value1);

/**
 * Performs quadratic interpolation between three values.
 * @param {number} a - The first value.
 * @param {number} b - The second value.
 * @param {number} c - The third value.
 * @param {number} x - The interpolation factor (usually between 0 and 1).
 * @returns {number} The interpolated value.
 */
Math.qarp = (a, b, c, x) =>
  Math.lerp(Math.lerp(a, b, x), Math.lerp(b, c, x), x);

/**
 * Clamps a value between a minimum and maximum range.
 * @param {number} x - The value to clamp.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The clamped value.
 */
Math.clamp = (x, min, max) => Math.max(min, Math.min(max, x));

/**
 * Clamps a value between 0 and 1.
 * @param {number} x - The value to clamp.
 * @returns {number} The clamped value.
 */
Math.clamp01 = (x) => Math.clamp(x, 0, 1);

/**
 * Clamps an angle to the range [0, 2π].
 * @param {number} a - The angle in radians.
 * @returns {number} The clamped angle.
 */
Math.clampAngle = (a) => {
  a %= Math.PI2;
  return a < 0 ? a + Math.PI2 : a;
};

/**
 * Generates a random angle in radians.
 * @returns {number} A random angle between 0 and 2π.
 */
Math.randomAngle = () => Math.randomFloat(0, Math.PI2);

/**
 * Generates a random floating-point number within a range.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random number between min and max.
 */
Math.randomFloat = (min, max) => Math.random() * (max - min) + min;

/**
 * Generates a random number within a symmetric range around zero.
 * @param {number} value - The range magnitude.
 * @returns {number} A random number between -value and value.
 */
Math.randomRange = (value) => Math.random() * (2 * value) - value;

/**
 * Generates a random integer within a range.
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (inclusive).
 * @returns {number} A random integer between min and max.
 */
Math.randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generates a random color as a floating-point number.
 * @returns {number} A random color value between 0 and 0xFFFFFF.
 */
Math.randomColor = () => Math.randomFloat(0, 0xffffff);

/**
 * Generates a random position within a circle.
 * @param {number} outerRadius - The outer radius of the circle.
 * @param {number} [innerRadius=0.00001] - The inner radius of the circle.
 * @returns {{x: number, y: number}} A random position within the circle.
 */
Math.randomPositionInCircle = (outerRadius, innerRadius = 0.00001) => {
  const aspect = innerRadius / outerRadius;
  const square = Math.sqrt(Math.randomFloat(Math.pow(aspect, 2), 1));
  const distance = outerRadius * square;
  const angle = Math.randomFloat(-Math.PI, Math.PI);
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
};

/**
 * Generates a random sign (-1 or 1).
 * @returns {number} -1 or 1.
 */
Math.randomSign = () => (Math.random() < 0.5 ? -1 : 1);

/**
 * Generates a random boolean value.
 * @param {number} [edge=0.5] - The probability threshold.
 * @returns {boolean} A random boolean value.
 */
Math.randomBool = (edge = 0.5) => Math.random() < edge;

/**
 * Mixes two values based on a weighting factor.
 * @param {number} x - The first value.
 * @param {number} y - The second value.
 * @param {number} a - The weighting factor (usually between 0 and 1).
 * @returns {number} The mixed value.
 */
Math.mix = (x, y, a) => x * (1 - a) + y * a;

/**
 * Performs smoothstep interpolation between two edges.
 * @param {number} edge0 - The lower edge.
 * @param {number} edge1 - The upper edge.
 * @param {number} x - The input value.
 * @returns {number} The interpolated value.
 */
Math.smoothstep = (edge0, edge1, x) => {
  const value = Math.clamp01((x - edge0) / (edge1 - edge0));
  return value * value * (3 - 2 * value);
};

/**
 * Performs double smoothstep interpolation with a plateau.
 * @param {number} x - The input value.
 * @param {number} fromBegin - The start of the first smoothstep.
 * @param {number} toBegin - The end of the first smoothstep.
 * @param {number} fromEnd - The start of the second smoothstep.
 * @param {number} toEnd - The end of the second smoothstep.
 * @returns {number} The interpolated value.
 */
Math.doubleSmoothstep = (x, fromBegin, toBegin, fromEnd, toEnd) => {
  const smoothstep = (t) => t * t * (3 - 2 * t);

  if (x <= fromBegin || x >= toEnd) return 0;
  if (x >= toBegin && x <= fromEnd) return 1;

  if (x > fromBegin && x < toBegin) {
    const t = (x - fromBegin) / (toBegin - fromBegin);
    return smoothstep(t);
  }

  if (x > fromEnd && x < toEnd) {
    const t = (x - fromEnd) / (toEnd - fromEnd);
    return 1 - smoothstep(t);
  }
};

/**
 * Performs double smoothstep interpolation with a plateau, normalized to [0, 1].
 * @param {number} x - The input value.
 * @param {number} plateauWidth - The width of the plateau.
 * @returns {number} The interpolated value.
 */
Math.doubleSmoothstep01 = (x, plateauWidth) =>
  Math.doubleSmoothstep(
    x,
    0,
    (1 - plateauWidth) / 2,
    (1 + plateauWidth) / 2,
    1,
  );

/**
 * Returns 1 if the input value is greater than or equal to the edge, otherwise 0.
 * @param {number} edge - The edge value.
 * @param {number} x - The input value.
 * @returns {number} 1 or 0.
 */
Math.step = (edge, x) => (x >= edge ? 1 : 0);

/**
 * Converts a number to a GLSL-compatible float string.
 * @param {number} value - The number to convert.
 * @returns {string} The number as a GLSL float string.
 */
Math.toGLSLFloatString = (value) =>
  String(value) + (Number.isInteger(value) ? ".0" : "");

/**
 * Maps a value from one range to another.
 * @param {number} v - The value to map.
 * @param {number} iMin - The minimum of the input range.
 * @param {number} iMax - The maximum of the input range.
 * @param {number} oMin - The minimum of the output range.
 * @param {number} oMax - The maximum of the output range.
 * @returns {number} The mapped value.
 */
Math.mapRange = (v, iMin, iMax, oMin, oMax) =>
  oMin + ((v - iMin) / (iMax - iMin)) * (oMax - oMin);

/**
 * Maps a value from the range [0, 1] to another range.
 * @param {number} v - The value to map.
 * @param {number} oMin - The minimum of the output range.
 * @param {number} oMax - The maximum of the output range.
 * @returns {number} The mapped value.
 */
Math.mapRangeFrom01 = (v, oMin, oMax) => oMin + v * (oMax - oMin);

/**
 * Maps a value to the range [0, 1].
 * @param {number} v - The value to map.
 * @param {number} iMin - The minimum of the input range.
 * @param {number} iMax - The maximum of the input range.
 * @returns {number} The mapped value.
 */
Math.mapRangeTo01 = (v, iMin, iMax) => (v - iMin) / (iMax - iMin);

/**
 * Converts degrees to radians.
 * @param {number} deg - The angle in degrees.
 * @returns {number} The angle in radians.
 */
Math.degToRad = (deg) => (deg * Math.PI) / 180;

/**
 * Converts radians to degrees.
 * @param {number} rad - The angle in radians.
 * @returns {number} The angle in degrees.
 */
Math.radToDeg = (rad) => (rad * 180) / Math.PI;
