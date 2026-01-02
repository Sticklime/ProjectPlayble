import {
  Blending,
  DoubleSide,
  NormalBlending,
  ShaderMaterial,
  Texture,
} from "three";

const vertexShader = `
  attribute vec3 instancePosition;
  attribute float instanceRotation;
  attribute float instanceScale;
  attribute float instanceOpacity;

  varying vec2 vUv;
  varying float vOpacity;

  void main() {
    vUv = uv;
    vOpacity = instanceOpacity;

    vec3 pos = position;
    pos *= instanceScale;

    float c = cos(instanceRotation);
    float s = sin(instanceRotation);
    pos = vec3(
      pos.x * c - pos.y * s,
      pos.x * s + pos.y * c,
      pos.z
    );

    vec3 lookAt = normalize(cameraPosition - instancePosition);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, lookAt));
    up = normalize(cross(lookAt, right));

    pos = right * pos.x + up * pos.y + lookAt * pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(instancePosition + pos, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D map;
  varying vec2 vUv;
  varying float vOpacity;

  void main() {
    vec4 texColor = texture2D(map, vUv);
    texColor.a *= vOpacity;
    gl_FragColor = texColor;
  }
`;

interface IOptions {
  texture: Texture;
  blending?: Blending;
}

export class BillboardMaterial extends ShaderMaterial {
  public constructor(options: IOptions) {
    super({
      vertexShader,
      fragmentShader,
      uniforms: { map: { value: options.texture } },
      transparent: true,
      depthWrite: false,
      blending: options.blending ?? NormalBlending,
      side: DoubleSide,
    });
  }
}
