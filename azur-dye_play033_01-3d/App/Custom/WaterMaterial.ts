import { TimeController } from "Libs/Toolbox/TimeController";
import { MeshStandardMaterial } from "three";

export class WaterMaterial extends MeshStandardMaterial {
  constructor(...args: any[]) {
    super(...args);
    TimeController.instance.on(TimeController.Event.TICK, this.onTick);

    const shaderFunctions = `
      uniform float u_Time;

      float hash(float n) { return fract(sin(n) * 43758.5453123); }

      float noise(vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        float n = p.x + p.y * 57.0 + 113.0 * p.z;

        return mix(
          mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
              mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
          mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
              mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y),
          f.z
        );
      }

      vec2 rotateUV(vec2 uv, float angle) {
        float s = sin(angle);
        float c = cos(angle);
        mat2 rotationMatrix = mat2(c, -s, s, c);
        return rotationMatrix * (uv - 0.5) + 0.5;
      }
    `;

    this.onBeforeCompile = (program): void => {
      program.uniforms["u_Time"] = { value: 0 };

      program.fragmentShader = shaderFunctions + program.fragmentShader;

      program.fragmentShader = program.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `
          #ifdef USE_NORMALMAP_OBJECTSPACE

            normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;

            #ifdef FLIP_SIDED
              normal = - normal;
            #endif

            #ifdef DOUBLE_SIDED
              normal = normal * faceDirection;
            #endif

            normal = normalize( normalMatrix * normal );

          #elif defined( USE_NORMALMAP_TANGENTSPACE )

            float time = u_Time * 2.0;

            vec3 normal1 = texture2D(normalMap, vNormalMapUv + vec2(time * 0.02, time * 0.03)).xyz * 2.0 - 1.0;
            vec3 normal2 = texture2D(normalMap, rotateUV(vNormalMapUv, 0.785) + vec2(-time * 0.025, time * 0.02)).xyz * 2.0 - 1.0;
            vec3 normal3 = texture2D(normalMap, rotateUV(vNormalMapUv, 1.571) + vec2(time * 0.015, -time * 0.025)).xyz * 2.0 - 1.0;
            vec3 normal4 = texture2D(normalMap, rotateUV(vNormalMapUv, 2.356) + vec2(-time * 0.03, -time * 0.02)).xyz * 2.0 - 1.0;

            vec3 mapN = normalize(
              normal1 * 1.0 +
              normal2 * 0.9 +
              normal3 * 0.8 +
              normal4 * 0.7
            );

            mapN.xy *= normalScale;

            normal = normalize( tbn * mapN );

          #elif defined( USE_BUMPMAP )

            normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );

          #endif
        `,
      );

      this.userData["shader"] = program;
    };
  }

  public override dispose(): void {
    TimeController.instance.off(TimeController.Event.TICK, this.onTick);
    super.dispose();
  }

  private readonly onTick = (deltaTime: number) => {
    const shader = this.userData["shader"];
    if (shader) {
      shader.uniforms["u_Time"].value += deltaTime;
    }
  };
}
