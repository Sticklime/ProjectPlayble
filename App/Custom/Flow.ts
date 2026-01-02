import { AssetKeeper } from "Generated/AssetKeeper";
import { TinyParticleEmitter } from "Libs/TinyParticleSystem/TinyEmitter";
import type { TinyParticleSystem } from "Libs/TinyParticleSystem/TinyParticleSystem";
import {
  Bone,
  Color,
  DoubleSide,
  MathUtils,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import { SceneTraversal } from "three-zoo";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";
import { Shared } from "./Shared";

const UP_DIRECTION = new Vector3(0, 1, 0);

export class Flow extends Object3D {
  private readonly flow: Object3D;
  private readonly bones: Bone[];
  private readonly material: MeshStandardMaterial;
  private readonly depthMaterial: MeshDepthMaterial;
  private readonly tempOrigin = new Vector3();
  private readonly tempDirection = new Vector3();
  private readonly tempBoneDirection = new Vector3();
  private readonly tempPosition = new Vector3();
  private readonly maxDistance: number;
  private readonly groundOffset: number;
  private readonly color: Color;

  private brushId?: number;
  private intensity = 0;
  private isEnabledInternal = false;

  private enableAnimation?: gsap.core.Tween;
  private disableAnimation?: gsap.core.Tween;

  private readonly emitter = new TinyParticleEmitter(
    {
      playByDefault: false,
      playTime: 8192,
      spawnRate: 256,
      system: this.particleSystem,
    },
    {
      lifeTimeRange: { min: 0.25, max: 0.5 },
      positionRange: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
      rotationRange: { min: -Math.PI, max: Math.PI },
      scaleOverTime: [
        { min: 0, max: 0 },
        { min: 0.1, max: 1.5 },
        { min: 0, max: 0 },
      ],
      opacityOverTime: [{ min: 1, max: 1 }],
      velocityRange: {
        theta: { min: -Math.PI, max: Math.PI },
        phi: { min: -Math.PI / 4, max: Math.PI / 4 },
        magnitude: { min: 2, max: 5 },
      },
      angularVelocityRange: { min: -4, max: 4 },
    },
  );

  constructor(
    private readonly anchor: Object3D,
    color: number,
    maxDistance: number,
    groundOffset: number,
    private readonly particleSystem: TinyParticleSystem,
  ) {
    super();
    this.color = new Color(color);
    this.maxDistance = maxDistance;
    this.groundOffset = groundOffset;
    const [flow, material, depthMaterial] = Flow.buildFlow(color);

    this.flow = flow;
    this.material = material;
    this.depthMaterial = depthMaterial;

    this.bones = SceneTraversal.filterObjects(
      this.flow,
      (o: Object3D) => o instanceof Bone,
    ) as Bone[];

    SceneTraversal.enumerateObjectsByType(this.flow, Mesh, (mesh: Mesh) => {
      mesh.material = this.material;
      mesh.customDepthMaterial = this.depthMaterial;
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      mesh.receiveShadow = false;
    });

    App.World?.Scene.add(this.flow);
    this.flow.visible = false;
  }

  public destroy(): void {
    this.emitter.destroy();
    this.releaseBrush();
    App.World?.Scene.remove(this.flow);
  }

  public get direction(): Vector3 {
    return this.tempDirection;
  }

  public get isEnable(): boolean {
    return this.isEnabledInternal;
  }

  public set isEnable(value: boolean) {
    if (this.isEnabledInternal === value) {
      return;
    }

    this.isEnabledInternal = value;
    const helper = { intensity: this.intensity };
    const duration = 0.5;

    if (this.isEnabledInternal) {
      this.disableAnimation?.kill();
      this.disableAnimation = undefined;
      this.flow.visible = true;
      this.emitter.play();
      this.brushId = Shared.levelPaintingCanvas.acquireBrush();

      this.enableAnimation = gsap.to(helper, {
        intensity: 1,
        duration,
        ease: "power2.inOut",
        onUpdate: () => {
          this.intensity = helper.intensity;
        },
        onComplete: () => {
          this.enableAnimation = undefined;
        },
      });
    } else {
      this.enableAnimation?.kill();
      this.enableAnimation = undefined;
      this.emitter.stop();
      this.releaseBrush();

      this.disableAnimation = gsap.to(helper, {
        intensity: 0,
        duration,
        ease: "power2.inOut",
        onUpdate: () => {
          this.intensity = helper.intensity;
        },
        onComplete: () => {
          this.flow.visible = false;
          this.disableAnimation = undefined;
        },
      });
    }
  }

  public update(deltaTime: number): void {
    const shader = this.material.userData["shader"];
    if (shader) {
      shader.uniforms["u_Time"].value += deltaTime;
    }

    const depthShader = this.depthMaterial.userData["shader"];
    if (depthShader) {
      depthShader.uniforms["u_Time"].value += deltaTime;
    }

    const origin = this.anchor.getWorldPosition(this.tempOrigin);
    const direction = this.anchor.getWorldDirection(this.tempDirection);

    for (let i = 0; i < this.bones.length; i++) {
      const bone = this.bones[i] as Bone;
      const alpha = i / (this.bones.length - 1);

      Flow.calculatePointOnJet(
        origin,
        direction,
        alpha,
        this.intensity,
        this.maxDistance,
        this.groundOffset,
        this.tempPosition,
      );

      if (i === this.bones.length - 1) {
        this.emitter.positionRange = {
          min: {
            x: this.tempPosition.x - 0.25,
            y: this.tempPosition.y,
            z: this.tempPosition.z - 0.25,
          },
          max: {
            x: this.tempPosition.x + 0.25,
            y: this.tempPosition.y,
            z: this.tempPosition.z + 0.25,
          },
        };
        if (this.brushId !== undefined) {
          Shared.levelPaintingCanvas.setBrush(
            this.brushId,
            this.tempPosition.x,
            this.tempPosition.z,
            1,
            this.color.r,
            this.color.g,
            this.color.b,
          );
        }
      }

      const lerpFactor = 1 - Math.exp(-MathUtils.lerp(1, 0.35, alpha));
      bone.position.lerp(this.tempPosition, lerpFactor);

      const scale =
        MathUtils.mapLinear(i, 0, this.bones.length - 1, 0.5, 3) *
        this.intensity;
      bone.scale.set(scale, scale, scale);
    }

    for (let i = 0; i < this.bones.length - 1; i++) {
      const bone = this.bones[i]!;
      const next = this.bones[i + 1]!;

      bone.quaternion.setFromUnitVectors(
        UP_DIRECTION,
        this.tempBoneDirection
          .subVectors(next.position, bone.position)
          .normalize(),
      );
    }

    this.bones[this.bones.length - 1]!.quaternion.copy(
      this.bones[this.bones.length - 2]!.quaternion,
    );
  }

  private releaseBrush() {
    if (this.brushId !== undefined) {
      Shared.levelPaintingCanvas.releaseBrush(this.brushId);
      this.brushId = undefined;
    }
  }

  private static calculatePointOnJet(
    origin: Vector3,
    direction: Vector3,
    alpha: number,
    intensity: number,
    maxDistance: number,
    groundOffset: number,
    result: Vector3,
  ): Vector3 {
    const gravity = 9.81;
    const effectiveDistance = maxDistance * intensity;

    if (effectiveDistance < 0.001) {
      result.copy(origin);
      return result;
    }

    const horizontalDirection = new Vector3(direction.x, 0, direction.z);
    const horizontalLength = horizontalDirection.length();

    if (horizontalLength < 0.0001) {
      throw new Error("Vertical jet direction is not supported");
    }

    horizontalDirection.normalize();

    const targetHeight = origin.y - groundOffset;
    const heightDifference = origin.y - targetHeight;

    const angle = Math.atan(heightDifference / effectiveDistance);
    const initialVelocity = Math.sqrt(
      (gravity * effectiveDistance * effectiveDistance) /
        (2 * effectiveDistance * Math.sin(angle) * Math.cos(angle) +
          2 * heightDifference * Math.cos(angle) * Math.cos(angle)),
    );

    const horizontalVelocity = initialVelocity * Math.cos(angle);
    const verticalVelocity = initialVelocity * Math.sin(angle);

    const totalTime = effectiveDistance / horizontalVelocity;
    const time = alpha * totalTime;

    result.x = origin.x + horizontalDirection.x * horizontalVelocity * time;
    result.y = origin.y + verticalVelocity * time - 0.5 * gravity * time * time;
    result.z = origin.z + horizontalDirection.z * horizontalVelocity * time;

    return result;
  }

  private static buildFlow(
    color: number,
  ): [Object3D, MeshStandardMaterial, MeshDepthMaterial] {
    const material = new MeshStandardMaterial({
      roughness: 0.1,
      metalness: 0,
      color: new Color(color),
      side: DoubleSide,
    });

    const depthMaterial = new MeshDepthMaterial();

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
    `;

    material.onBeforeCompile = (program): void => {
      program.uniforms["u_Time"] = { value: 0 };

      program.vertexShader = shaderFunctions + program.vertexShader;

      program.vertexShader = program.vertexShader.replace(
        "#include <beginnormal_vertex>",
        `
          vec3 displacedPosition = vec3(position);

          vec3 waveCoord = vec3(
            position.x * 8.0,
            position.y * 8.0 - u_Time * 25.0f,
            position.z * 8.0
          );

          float wave = (noise(waveCoord) - 0.5) * 0.08;

          displacedPosition += normal * wave;

          const float epsilon = 0.01;

          float waveDx = (noise(waveCoord + vec3(epsilon, 0.0, 0.0)) - 0.5) * 0.08;
          float waveDy = (noise(waveCoord + vec3(0.0, epsilon, 0.0)) - 0.5) * 0.08;
          float waveDz = (noise(waveCoord + vec3(0.0, 0.0, epsilon)) - 0.5) * 0.08;

          vec3 gradient = vec3(
            (waveDx - wave) / epsilon,
            (waveDy - wave) / epsilon,
            (waveDz - wave) / epsilon
          );

          vec3 displacedNormal = normalize(normal - gradient);

          vec3 objectNormal = displacedNormal;
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(tangent.xyz);
          #endif
        `,
      );

      program.vertexShader = program.vertexShader.replace(
        "#include <begin_vertex>",
        `
          vec3 transformed = displacedPosition;
        `,
      );

      material.userData["shader"] = program;
    };

    depthMaterial.onBeforeCompile = (program): void => {
      program.uniforms["u_Time"] = { value: 0 };

      program.vertexShader = shaderFunctions + program.vertexShader;

      program.vertexShader = program.vertexShader.replace(
        "#include <begin_vertex>",
        `
          vec3 waveCoord = vec3(
            position.x * 8.0,
            position.y * 8.0 - u_Time * 25.0f,
            position.z * 8.0
          );

          float wave = (noise(waveCoord) - 0.5) * 0.08;

          vec3 transformed = vec3(position) + normal * wave;
        `,
      );

      depthMaterial.userData["shader"] = program;
    };

    return [clone(AssetKeeper.SK_Flow.scene), material, depthMaterial];
  }
}
