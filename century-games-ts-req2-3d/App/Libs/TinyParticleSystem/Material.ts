import { Blending, Color, Texture } from "three";
import { DoubleSide, NormalBlending, ShaderMaterial } from "three";

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
  uniform vec3 color;
  varying vec2 vUv;
  varying float vOpacity;

  uniform float alphaTest;

  #include <common>
  #include <alphahash_pars_fragment>

  void main() {
    vec4 diffuseColor = texture2D(map, vUv);
    #include <alphatest_fragment>
    #include <alphahash_fragment>
    gl_FragColor = vec4(color * diffuseColor.rgb, diffuseColor.a * vOpacity);
    #include <colorspace_fragment>
  }
`;

interface IOptions {
  texture: Texture;
  color?: Color;
  blending?: Blending;
}

export class BillboardMaterial extends ShaderMaterial {
  constructor(options: IOptions) {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        map: { value: options.texture },
        color: { value: options.color ?? new Color(0xffffff) },
        alphaTest: { value: 0.5 },
      },
      transparent: true,
      depthWrite: false,
      blending: options.blending ?? NormalBlending,
      side: DoubleSide,
    });
  }
}
