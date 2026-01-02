import { Matrix3, Matrix4, Quaternion, Vector3 } from "three";

/**
 * Decomposes a transformation matrix (without skew) into position, quaternion, and scale components.
 * Ensures that matrix.compose(position, quaternion, scale) recreates the original matrix.
 * @param matrix - The input transformation matrix (only translation, rotation, scale)
 * @param position - Output position vector
 * @param quaternion - Output rotation quaternion
 * @param scale - Output scale vector (can be anisotropic and negative)
 */
export function safeDecompose(
  matrix: Matrix4,
  position: Vector3,
  quaternion: Quaternion,
  scale: Vector3,
): void {
  const EPSILON = 1e-6;
  const matrixElements = matrix.elements;

  // Extract position from the last column of the matrix
  position.set(matrixElements[12], matrixElements[13], matrixElements[14]);

  // Function to compute scale and sign for an axis (X, Y, Z)
  const decomposeScale = (
    columnStart: number,
  ): { length: number; sign: number } => {
    const x = matrixElements[columnStart] as number;
    const y = matrixElements[columnStart + 1] as number;
    const z = matrixElements[columnStart + 2] as number;

    // Calculate the length of the scale vector
    const length = Math.hypot(x, y, z);
    if (length < EPSILON) return { length: 0, sign: 1 }; // Zero scale

    // Determine the sign by the component with the largest absolute value
    const maxAbsComponent = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
    const sign =
      Math.abs(x) === maxAbsComponent
        ? Math.sign(x)
        : Math.abs(y) === maxAbsComponent
          ? Math.sign(y)
          : Math.sign(z);

    return { length, sign };
  };

  // Decompose scale for each axis
  const xScale = decomposeScale(0);
  const yScale = decomposeScale(4);
  let zScale = decomposeScale(8);

  // Create rotation matrix considering scale signs
  const rotationMatrix = new Matrix3().set(
    (matrixElements[0] / (xScale.length || 1)) * xScale.sign,
    (matrixElements[4] / (yScale.length || 1)) * yScale.sign,
    (matrixElements[8] / (zScale.length || 1)) * zScale.sign,

    (matrixElements[1] / (xScale.length || 1)) * xScale.sign,
    (matrixElements[5] / (yScale.length || 1)) * yScale.sign,
    (matrixElements[9] / (zScale.length || 1)) * zScale.sign,

    (matrixElements[2] / (xScale.length || 1)) * xScale.sign,
    (matrixElements[6] / (yScale.length || 1)) * yScale.sign,
    (matrixElements[10] / (zScale.length || 1)) * zScale.sign,
  );

  // Correct orientation (right-handed system)
  if (rotationMatrix.determinant() < 0) {
    zScale = { ...zScale, sign: -zScale.sign }; // Invert Z sign
    rotationMatrix.set(
      rotationMatrix.elements[0],
      rotationMatrix.elements[1],
      -rotationMatrix.elements[2],
      rotationMatrix.elements[3],
      rotationMatrix.elements[4],
      -rotationMatrix.elements[5],
      rotationMatrix.elements[6],
      rotationMatrix.elements[7],
      -rotationMatrix.elements[8],
    );
  }

  // Set final scale with signs considered
  scale.set(
    xScale.length * xScale.sign,
    yScale.length * yScale.sign,
    zScale.length * zScale.sign,
  );

  // Convert Matrix3 → Matrix4 for the quaternion
  quaternion.setFromRotationMatrix(
    new Matrix4().setFromMatrix3(rotationMatrix),
  );
}
