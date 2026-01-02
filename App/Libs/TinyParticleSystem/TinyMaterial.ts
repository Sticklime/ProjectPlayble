import type { Blending, Texture } from "three";
import { Color, DoubleSide, NormalBlending, ShaderMaterial } from "three";

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
  uniform mat3 uvTransform;
  uniform vec3 color;
  varying vec2 vUv;
  varying float vOpacity;

  void main() {
    vec2 transformedUV = (uvTransform * vec3(vUv, 1.0)).xy;
    vec4 textureColor = texture2D(map, transformedUV);
    textureColor.a *= vOpacity;
    gl_FragColor = vec4(color * textureColor.rgb, textureColor.a);
  }
`;

interface TinyParticleMaterialOptions {
  texture: Texture;
  depthWrite?: boolean;
  depthTest?: boolean;
  color?: Color;
  blending?: Blending;
}

export class TinyParticleMaterial extends ShaderMaterial {
  constructor(options: TinyParticleMaterialOptions) {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        map: { value: options.texture },
        color: { value: options.color ?? new Color(0xffffff) },
        uvTransform: { value: options.texture.matrix },
      },
      transparent: true,
      depthWrite: options.depthWrite ?? false,
      depthTest: options.depthTest ?? true,
      blending: options.blending ?? NormalBlending,
      side: DoubleSide,
    });
  }

  public setNewTexture(texture: Texture): void {
    if (this.uniforms["map"] && this.uniforms["uvTransform"]) {
      this.uniforms["map"].value = texture;
      this.uniforms["uvTransform"].value = texture.matrix;
      this.needsUpdate = true;
    }
  }
}
