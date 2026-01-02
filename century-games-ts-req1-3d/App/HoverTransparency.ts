import * as THREE from "three";

type UniformDict = { [key: string]: THREE.IUniform };
type DefineDict = { [key: string]: any };

export type HoverTransparencyOptions = {
    radius?: number;
    feather?: number;
    enabledOnStart?: boolean;
    maxBrushes?: number;
};

type Brush = { center: THREE.Vector3; radius: number };

export class HoverTransparency {
    private root: THREE.Object3D;
    private targetMesh: THREE.Mesh;
    private raycaster = new THREE.Raycaster();
    private ndc = new THREE.Vector2();
    private radius: number;
    private feather: number;
    private enabled: boolean;
    private readonly MAX_BRUSHES: number;
    private brushes: Brush[] = [];
    private brushesBuffer: Float32Array;
    private brushCount = 0;
    private brushTex: THREE.DataTexture;
    private brushTexSize: number;
    private brushTexDirty = false;
    private hoverCenter = new THREE.Vector3(99999, 99999, 99999);
    private lastPatchedMaterials: Set<THREE.Material> = new Set();
    private writeIndex = 0;

    constructor(root: THREE.Object3D, opts: HoverTransparencyOptions = {}) {
        this.root = root;
        this.radius = Math.max(0.001, opts.radius ?? 0.35);
        this.feather = THREE.MathUtils.clamp(opts.feather ?? 0.7, 0, 1);
        this.enabled = opts.enabledOnStart ?? true;
        this.MAX_BRUSHES = Math.max(1, Math.floor(opts.maxBrushes ?? 256));
        this.brushTexSize = this.MAX_BRUSHES;
        this.brushesBuffer = new Float32Array(this.brushTexSize * 4);
        this.brushTex = new THREE.DataTexture(
            this.brushesBuffer,
            this.brushTexSize,
            1,
            THREE.RGBAFormat,
            THREE.FloatType
        );
        this.brushTex.magFilter = THREE.NearestFilter;
        this.brushTex.minFilter = THREE.NearestFilter;
        this.brushTex.wrapS = THREE.ClampToEdgeWrapping;
        this.brushTex.wrapT = THREE.ClampToEdgeWrapping;
        this.brushTexDirty = true;
        const mesh = this._findFirstMesh(root);
        if (!mesh) throw new Error("[HoverTransparency] No Mesh found under provided Object3D.");
        this.targetMesh = mesh;
        this._patchAllMaterials(root);
        this._updateUniforms();
    }

    setEnabled(v: boolean) {
        this.enabled = v;
        if (!v) {
            this.hoverCenter.set(99999, 99999, 99999);
            this._updateUniforms();
        }
    }

    getRadius() {
        return this.radius;
    }

    clearStamps() {
        this.brushes.length = 0;
        this.brushCount = 0;
        this.writeIndex = 0;
        this.brushesBuffer.fill(0);
        this.brushTexDirty = true;
        this._updateUniforms();
    }

    addStampAt(worldPos: THREE.Vector3, radius = this.radius) {
        const r = Math.max(0.001, radius);
        const idx = this.brushCount < this.MAX_BRUSHES ? this.brushCount : this.writeIndex;
        this.brushes[idx] = { center: worldPos.clone(), radius: r };
        const i = idx * 4;
        this.brushesBuffer[i + 0] = worldPos.x;
        this.brushesBuffer[i + 1] = worldPos.y;
        this.brushesBuffer[i + 2] = worldPos.z;
        this.brushesBuffer[i + 3] = r;
        if (this.brushCount < this.MAX_BRUSHES) this.brushCount++;
        else this.writeIndex = (this.writeIndex + 1) % this.MAX_BRUSHES;
        this.brushTexDirty = true;
        this._updateUniforms();
    }

    stampFromPointer(camera: THREE.Camera, pointerClient: { x: number; y: number }, rendererDom: HTMLElement) {
        const rect = rendererDom.getBoundingClientRect();
        const x = ((pointerClient.x - rect.left) / rect.width) * 2 - 1;
        const y = -((pointerClient.y - rect.top) / rect.height) * 2 + 1;
        this.ndc.set(x, y);
        this.raycaster.setFromCamera(this.ndc, camera);
        const hits = this.raycaster.intersectObject(this.root, true);
        const hit = hits.find(h => (h.object as any).isMesh);
        if (!hit) return;
        this.addStampAt(hit.point, this.radius);
    }

    updateFromPointer(camera: THREE.Camera, pointerClient: { x: number; y: number }, rendererDom: HTMLElement): THREE.Vector3 | undefined {
        if (!this.enabled) return;
        const rect = rendererDom.getBoundingClientRect();
        const x = ((pointerClient.x - rect.left) / rect.width) * 2 - 1;
        const y = -((pointerClient.y - rect.top) / rect.height) * 2 + 1;
        this.ndc.set(x, y);
        this.raycaster.setFromCamera(this.ndc, camera);
        const hits = this.raycaster.intersectObject(this.root, true);
        const hit = hits.find(h => (h.object as any).isMesh);
        if (hit) this.hoverCenter.copy(hit.point);
        else this.hoverCenter.set(99999, 99999, 99999);
        this._updateUniforms();
        return hit?.point;
    }

    increaseRadius(delta: number = 0.1) {
        this.radius = Math.max(0.001, this.radius + delta);
        this._updateUniforms();
    }

    private _updateUniforms() {
        if (this.brushTexDirty) {
            if (this.brushTex.image) this.brushTex.image.data = this.brushesBuffer;
            else this.brushTex.image = { data: this.brushesBuffer, width: this.brushTexSize, height: 1 } as any;
            this.brushTex.needsUpdate = true;
            this.brushTexDirty = false;
        }
        for (const mat of this.lastPatchedMaterials) {
            const u = (mat as any).userData?._hoverUniforms as
                | {
                uHoverCenter: { value: THREE.Vector3 };
                uHoverRadius: { value: number };
                uHoverFeather: { value: number };
                uBrushTex: { value: THREE.DataTexture };
                uBrushCount: { value: number };
                uMaxBrushesF: { value: number };
            }
                | undefined;
            if (!u) continue;
            u.uHoverCenter.value.copy(this.hoverCenter);
            u.uHoverRadius.value = this.radius;
            u.uHoverFeather.value = this.feather;
            u.uBrushCount.value = this.brushCount;
            u.uBrushTex.value = this.brushTex;
            u.uMaxBrushesF.value = this.brushTexSize * 1.0;
        }
    }

    private _patchAllMaterials(root: THREE.Object3D) {
        const meshes = this._collectMeshes(root);
        for (const m of meshes) {
            const mat = m.material as THREE.Material | THREE.Material[];
            if (Array.isArray(mat)) mat.forEach(mm => this._patchMaterial(mm));
            else this._patchMaterial(mat);
        }
    }

    private _patchMaterial(mat: THREE.Material) {
        if (!mat || (mat as any).userData?._hoverPatched) return;

        const uniforms = (mat as any).userData._hoverUniforms ?? {
            uHoverCenter: { value: this.hoverCenter.clone() },
            uHoverRadius: { value: this.radius },
            uHoverFeather: { value: this.feather },
            uBrushCount: { value: this.brushCount },
            uBrushTex: { value: this.brushTex },
            uMaxBrushesF: { value: this.brushTexSize * 1.0 },
        };
        (mat as any).userData._hoverUniforms = uniforms;
        (mat as any).alphaHash = true;
        mat.onBeforeCompile = (shader: { vertexShader: string; fragmentShader: string; uniforms: UniformDict; defines?: DefineDict }) => {
            shader.uniforms["uHoverCenter"] = uniforms.uHoverCenter;
            shader.uniforms["uHoverRadius"] = uniforms.uHoverRadius;
            shader.uniforms["uHoverFeather"] = uniforms.uHoverFeather;
            shader.uniforms["uBrushTex"] = uniforms.uBrushTex;
            shader.uniforms["uBrushCount"] = uniforms.uBrushCount;
            shader.uniforms["uMaxBrushesF"] = uniforms.uMaxBrushesF;
            shader.defines = shader.defines || {};
            shader.defines["MAX_BRUSHES"] = String(this.MAX_BRUSHES);
            if (!shader.vertexShader.includes("varying vec3 vWorldPos;")) {
                shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWorldPos;");
            }
            if (!shader.vertexShader.includes("vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;")) {
                shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
            }
            if (!shader.fragmentShader.includes("uniform sampler2D uBrushTex;")) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <common>",
                    "#include <common>\nvarying vec3 vWorldPos;\nuniform vec3 uHoverCenter;\nuniform float uHoverRadius;\nuniform float uHoverFeather;\nuniform sampler2D uBrushTex;\nuniform float uBrushCount;\nuniform float uMaxBrushesF;"
                );
            }
            const hook = "#include <clipping_planes_fragment>";
            const inject = `
float persistentK = 0.0;
for (int i = 0; i < MAX_BRUSHES; i++) {
  if (float(i) >= uBrushCount) break;
  vec2 uv = vec2((float(i) + 0.5) / uMaxBrushesF, 0.5);
  vec4 d = texture2D(uBrushTex, uv);
  vec3 c = d.xyz;
  float r = d.w;
  if (r > 0.0001) {
    float inner = r * clamp(uHoverFeather, 0.0, 0.9999);
    float dist = length(vWorldPos - c);
    float k = 1.0 - smoothstep(inner, r, dist);
    persistentK = max(persistentK, k);
  }
}

gl_FragColor.a *= (1.0 - persistentK);
diffuseColor.a *= (1.0 - persistentK);
`;

            shader.fragmentShader = shader.fragmentShader.replace(hook, inject + "\n" + hook);
        };
        mat.needsUpdate = true;
        (mat as any).userData._hoverPatched = true;
        this.lastPatchedMaterials.add(mat);
    }

    private _findFirstMesh(root: THREE.Object3D): THREE.Mesh | null {
        if ((root as any).isMesh) return root as THREE.Mesh;
        let found: THREE.Mesh | null = null;
        root.traverse(o => {
            if (!found && (o as any).isMesh) found = o as THREE.Mesh;
        });
        return found;
    }

    private _collectMeshes(root: THREE.Object3D): THREE.Mesh[] {
        const out: THREE.Mesh[] = [];
        root.traverse(o => {
            if ((o as any).isMesh) out.push(o as THREE.Mesh);
        });
        return out;
    }
}
