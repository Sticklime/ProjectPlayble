import type {
  Texture,
  Vector2Like,
  WebGLProgramParametersWithUniforms,
} from "three";
import { MeshStandardMaterial, Vector4 } from "three";
import { Shared } from "./Shared";

export class PaintableMaterial extends MeshStandardMaterial {
  private shaderProgram?: WebGLProgramParametersWithUniforms;

  constructor(paintTexture: Texture, originalMaterial: MeshStandardMaterial) {
    super();
    this.copy(originalMaterial);

    this.onBeforeCompile = (program): void => {
      this.shaderProgram = program;

      program.uniforms["u_PaintTexture"] = { value: paintTexture };
      program.uniforms["u_WorldMinMax"] = {
        value: new Vector4(
          Shared.levelPaintingCanvas.min.x,
          Shared.levelPaintingCanvas.min.y,
          Shared.levelPaintingCanvas.max.x,
          Shared.levelPaintingCanvas.max.y,
        ),
      };

      program.fragmentShader = program.fragmentShader.replace(
        "#include <common>",
        `
        #include <common>
        uniform sampler2D u_PaintTexture;
        uniform vec4 u_WorldMinMax;
        varying vec3 vWorldPosition;

        vec4 g_PaintColor;
        `,
      );

      program.vertexShader = program.vertexShader.replace(
        "#include <common>",
        `
        #include <common>
        varying vec3 vWorldPosition;
        `,
      );

      program.vertexShader = program.vertexShader.replace(
        "#include <worldpos_vertex>",
        `
        #include <worldpos_vertex>
        vWorldPosition = worldPosition.xyz;
        `,
      );

      program.fragmentShader = program.fragmentShader.replace(
        "#include <color_fragment>",
        `
        #include <color_fragment>

        vec2 paintUV = vec2(
          (vWorldPosition.x - u_WorldMinMax.x) / (u_WorldMinMax.z - u_WorldMinMax.x),
          (vWorldPosition.z - u_WorldMinMax.y) / (u_WorldMinMax.w - u_WorldMinMax.y)
        );

        g_PaintColor = texture2D(u_PaintTexture, paintUV);
        diffuseColor.rgb = mix(diffuseColor.rgb, g_PaintColor.rgb, g_PaintColor.a);
        `,
      );

      program.fragmentShader = program.fragmentShader.replace(
        "#include <roughnessmap_fragment>",
        `
        #include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.1, g_PaintColor.a);
        `,
      );

      program.fragmentShader = program.fragmentShader.replace(
        "#include <metalnessmap_fragment>",
        `
        #include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.0, g_PaintColor.a);
        `,
      );
    };
  }

  public setMinMax(min: Vector2Like, max: Vector2Like): void {
    if (!this.shaderProgram) {
      throw new Error("Shader not initialized yet");
    }

    const minMaxUniform = this.shaderProgram.uniforms["u_WorldMinMax"];
    if (!minMaxUniform) {
      throw new Error("u_WorldMinMax uniform not found");
    }

    const minMaxValue = minMaxUniform.value as Vector4;
    if (!minMaxValue) {
      throw new Error("u_WorldMinMax value not found");
    }

    minMaxValue.set(min.x, min.y, max.x, max.y);
  }

  public setPaintTexture(paintTexture: Texture): void {
    if (!this.shaderProgram) {
      throw new Error("Shader not initialized yet");
    }

    const paintTextureUniform = this.shaderProgram.uniforms["u_PaintTexture"];
    if (!paintTextureUniform) {
      throw new Error("u_PaintTexture uniform not found");
    }

    paintTextureUniform.value = paintTexture;
  }
}
