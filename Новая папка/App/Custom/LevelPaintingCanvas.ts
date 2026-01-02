import type { Texture, Vector2Like, WebGLRenderer } from "three";
import {
  ClampToEdgeWrapping,
  LinearFilter,
  MathUtils,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector3,
  Vector4,
  WebGLRenderTarget,
} from "three";

export interface LevelPaintingCanvasOptions {
  min: Vector2Like;
  max: Vector2Like;
  resolution?: number;
  brushCount?: number;
}

export class LevelPaintingCanvas {
  public readonly min: Vector2Like;
  public readonly max: Vector2Like;

  private readonly renderer: WebGLRenderer;
  private readonly renderTargetA: WebGLRenderTarget;
  private readonly renderTargetB: WebGLRenderTarget;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly paintMaterial: ShaderMaterial;
  private readonly quad: Mesh;
  private readonly availableBrushes: Set<number>;
  private readonly brushCount: number;
  private currentTarget: 0 | 1 = 0;

  constructor(options: LevelPaintingCanvasOptions) {
    const { min, max, resolution = 32, brushCount = 10 } = options;

    const renderer = App.World?.Renderer;
    if (!renderer) {
      throw new Error("Renderer not found!");
    }

    this.renderer = renderer;
    this.brushCount = brushCount;
    this.min = min;
    this.max = max;
    this.availableBrushes = new Set(
      Array.from({ length: brushCount }, (_, i) => i),
    );

    const renderTargetOptions = {
      format: RGBAFormat,
      type: UnsignedByteType,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
    };

    this.renderTargetA = new WebGLRenderTarget(
      resolution,
      resolution,
      renderTargetOptions,
    );
    this.renderTargetB = new WebGLRenderTarget(
      resolution,
      resolution,
      renderTargetOptions,
    );

    this.paintMaterial = new ShaderMaterial({
      uniforms: {
        u_PreviousTexture: { value: this.renderTargetA.texture },
        u_BrushPositions: {
          value: Array.from(
            { length: brushCount },
            () => new Vector3(-1, -1, 0),
          ),
        },
        u_BrushRadii: {
          value: Array.from(
            { length: brushCount },
            () => new Vector4(0, 0, 0, 0),
          ),
        },
        u_BrushColors: {
          value: Array.from({ length: brushCount }, () => new Vector3(0, 0, 0)),
        },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D u_PreviousTexture;
        uniform vec3 u_BrushPositions[${brushCount}];
        uniform vec4 u_BrushRadii[${brushCount}];
        uniform vec3 u_BrushColors[${brushCount}];

        varying vec2 vUv;

        void main() {
          vec4 newColor = texture2D(u_PreviousTexture, vUv);

          for (int i = 0; i < ${brushCount}; i++) {
            vec2 center = u_BrushPositions[i].xy;
            vec2 radius = u_BrushRadii[i].xy;

            vec2 delta = (vUv - center) / radius;
            float distanceSquared = dot(delta, delta);

            if (distanceSquared <= 1.0) {
              newColor = vec4(u_BrushColors[i], 1.0);
            }
          }

          gl_FragColor = newColor;
        }
      `,
    });

    this.quad = new Mesh(new PlaneGeometry(2, 2), this.paintMaterial);
    this.scene.add(this.quad);
  }

  public acquireBrush(): number {
    if (this.availableBrushes.size === 0) {
      throw new Error(
        "No available brushes. All brushes are currently in use.",
      );
    }
    const iterator = this.availableBrushes.values();
    const brushId = iterator.next().value as number;
    this.availableBrushes.delete(brushId);
    return brushId;
  }

  public releaseBrush(brushId: number): void {
    if (brushId < 0 || brushId >= this.brushCount) {
      throw new Error(
        `Invalid brushId: ${brushId}. Expected value between 0 and ${this.brushCount - 1}`,
      );
    }

    this.availableBrushes.add(brushId);

    const positionsUniform = this.paintMaterial.uniforms["u_BrushPositions"];
    if (!positionsUniform) {
      throw new Error("u_BrushPositions uniform not found");
    }
    const positions = positionsUniform.value as Vector3[];

    const radiiUniform = this.paintMaterial.uniforms["u_BrushRadii"];
    if (!radiiUniform) {
      throw new Error("u_BrushRadii uniform not found");
    }
    const radii = radiiUniform.value as Vector4[];

    const colorsUniform = this.paintMaterial.uniforms["u_BrushColors"];
    if (!colorsUniform) {
      throw new Error("u_BrushColors uniform not found");
    }
    const colors = colorsUniform.value as Vector3[];

    const position = positions[brushId];
    if (!position) {
      throw new Error(`Position not found for brushId: ${brushId}`);
    }
    position.set(-1, -1, 0);

    const radius = radii[brushId];
    if (!radius) {
      throw new Error(`Radius not found for brushId: ${brushId}`);
    }
    radius.set(0, 0, 0, 0);

    const color = colors[brushId];
    if (!color) {
      throw new Error(`Color not found for brushId: ${brushId}`);
    }
    color.set(0, 0, 0);
  }

  public setBrush(
    brushId: number,
    x: number,
    y: number,
    radius: number,
    r: number,
    g: number,
    b: number,
  ): void {
    if (brushId < 0 || brushId >= this.brushCount) {
      throw new Error(
        `Invalid brushId: ${brushId}. Expected value between 0 and ${this.brushCount - 1}`,
      );
    }

    if (this.availableBrushes.has(brushId)) {
      throw new Error(
        `Brush ${brushId} is not acquired. Call acquireBrush() first.`,
      );
    }

    if (radius <= 0) {
      throw new Error(
        `Invalid radius: ${radius}. Radius must be greater than 0`,
      );
    }

    const uvX = MathUtils.mapLinear(x, this.min.x, this.max.x, 0, 1);
    const uvY = MathUtils.mapLinear(y, this.min.y, this.max.y, 0, 1);
    const radiusUVX = radius / (this.max.x - this.min.x);
    const radiusUVY = radius / (this.max.y - this.min.y);

    const positionsUniform = this.paintMaterial.uniforms["u_BrushPositions"];
    if (!positionsUniform) {
      throw new Error("u_BrushPositions uniform not found");
    }
    const positions = positionsUniform.value as Vector3[];

    const radiiUniform = this.paintMaterial.uniforms["u_BrushRadii"];
    if (!radiiUniform) {
      throw new Error("u_BrushRadii uniform not found");
    }
    const radii = radiiUniform.value as Vector4[];

    const colorsUniform = this.paintMaterial.uniforms["u_BrushColors"];
    if (!colorsUniform) {
      throw new Error("u_BrushColors uniform not found");
    }
    const colors = colorsUniform.value as Vector3[];

    const position = positions[brushId];
    if (!position) {
      throw new Error(`Position not found for brushId: ${brushId}`);
    }
    position.set(uvX, uvY, 0);

    const radiusVec = radii[brushId];
    if (!radiusVec) {
      throw new Error(`Radius not found for brushId: ${brushId}`);
    }
    radiusVec.set(radiusUVX, radiusUVY, 0, 0);

    const color = colors[brushId];
    if (!color) {
      throw new Error(`Color not found for brushId: ${brushId}`);
    }
    color.set(r, g, b);
  }

  public flush(): void {
    const currentRenderTarget = this.renderer.getRenderTarget();

    const sourceTarget =
      this.currentTarget === 0 ? this.renderTargetA : this.renderTargetB;
    const destTarget =
      this.currentTarget === 0 ? this.renderTargetB : this.renderTargetA;

    const previousTextureUniform =
      this.paintMaterial.uniforms["u_PreviousTexture"];
    if (!previousTextureUniform) {
      throw new Error("u_PreviousTexture uniform not found");
    }
    previousTextureUniform.value = sourceTarget.texture;

    this.renderer.setRenderTarget(destTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(currentRenderTarget);

    this.currentTarget = this.currentTarget === 0 ? 1 : 0;
  }

  public getTexture(): Texture {
    return this.currentTarget === 0
      ? this.renderTargetA.texture
      : this.renderTargetB.texture;
  }
}
