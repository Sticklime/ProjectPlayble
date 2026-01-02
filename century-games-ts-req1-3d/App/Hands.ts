import {AnimationMachine, ClipState} from "animouse";
import {AnimationActionLoopStyles, AnimationClip, Material, Mesh, Object3D} from "three";
import {
    AnimationAction,
    AnimationMixer,
    Euler,
    Group,
    LoopOnce,
    Vector3,
    type PerspectiveCamera,
} from "three";
import type {GLTF} from "three/examples/jsm/loaders/GLTFLoader";
import {clone} from "three/examples/jsm/utils/SkeletonUtils";
import {TimeController} from "Libs/Toolbox/TimeController";
import * as THREE from "three";
import { SceneTraversal } from "three-zoo";
import { gsap } from "gsap";

export enum HandsState {
    PULL,
    PUSH,
}

export enum WaterGunType {
    WEAK = 1,
    POWERFUL = 2,
}

export class Hands {
    private readonly orientationWrapper = new Group();
    private readonly wrapper = new Group();
    private readonly machine: AnimationMachine;
    private stateInternal = HandsState.PUSH;
    private waterGunTypeInternal = WaterGunType.WEAK;
    private readonly offsetPosition = new Vector3(0.2, -0.35, -0.5);
    private readonly offsetRotation: Euler = new Euler(0.25, Math.PI + 0.15, 0.5);
    private streamCloned: Object3D[] = [];
    private streamMixers: (AnimationMixer | null)[] = [];
    private streamActions: (AnimationAction | null)[] = [];
    private waterTextures: THREE.Texture[] = [];
    private lastTargetPoint?: THREE.Vector3;
    private isChangingGun: boolean = false;

    constructor(camera: PerspectiveCamera, asset: GLTF, streamAsset?: GLTF) {
        const clonedScene = clone(asset.scene);


        clonedScene.traverse((child: Object3D) => {
            child.renderOrder = 1500;

            if ((child as any).isMesh && (child as any).material) {
                const mesh = child as THREE.Mesh;
                const material = mesh.material as THREE.Material;
                const materials = Array.isArray(material) ? material : [material];
                materials.forEach((mat: THREE.Material) => {
                    (mat as any).depthTest = true;
                    (mat as any).depthWrite = true;
                    (mat as any).transparent = true;
                });
            }
        });
        
        this.wrapper.position.copy(this.offsetPosition);
        this.wrapper.rotation.copy(this.offsetRotation);
        this.wrapper.add(clonedScene);
        this.orientationWrapper.add(this.wrapper);
        camera.add(this.orientationWrapper);
        camera.near = 0.1;
        camera.updateProjectionMatrix();

        const pullHandleClip = asset.animations.find((a) => a.name === "A_Pull_Handle");
        const pushHandleClip = asset.animations.find((a) => a.name === "A_Push_Handle");
        if (pullHandleClip === undefined || pushHandleClip === undefined) {
            throw new Error("Animation not found");
        }

        const mixer = new AnimationMixer(clonedScene);
        const pullHandleState = new ClipState(Hands.buildAction(mixer, pullHandleClip, LoopOnce));
        const pushHandleState = new ClipState(Hands.buildAction(mixer, pushHandleClip, LoopOnce));
        this.machine = new AnimationMachine(pushHandleState, mixer);
        this.machine.addEventTransition(HandsState.PULL, {to: pullHandleState, duration: 0.1});
        this.machine.addEventTransition(HandsState.PUSH, {to: pushHandleState, duration: 0.1});

        if (streamAsset) {
            const gunRoots: Object3D[] = [];
            this.wrapper.traverse((child: Object3D) => {
                const name = child.name;

                child.renderOrder = 1500;
                if (name === ("SM_Water_Gun_1") || name === ("SM_Water_Gun_2")) {
                    gunRoots.push(child);
                }
            });

            for (const gunRoot of gunRoots) {

                gunRoot.renderOrder = 1500;
                gunRoot.traverse((node: Object3D) => {
                    node.renderOrder = 1500;

                    if ((node as any).isMesh && (node as any).material) {
                        const mesh = node as THREE.Mesh;
                        const material = mesh.material as THREE.Material;
                        const materials = Array.isArray(material) ? material : [material];
                        materials.forEach((mat: THREE.Material) => {
                            (mat as any).depthTest = true;
                            (mat as any).depthWrite = true;
                            (mat as any).transparent = true;
                        });
                    }
                });
                
                const streamClone = clone(streamAsset.scene);
                gunRoot.add(streamClone);
                streamClone.position.set(-0, 0.25, 0.2);

                streamClone.renderOrder = 500;

                gunRoot.traverse((node: Object3D) => {

                    if (node !== streamClone && !streamClone.children.includes(node)) {
                        node.renderOrder = 1500;

                        if ((node as any).isMesh && (node as any).material) {
                            const mesh = node as THREE.Mesh;
                            const material = mesh.material as THREE.Material;
                            const materials = Array.isArray(material) ? material : [material];
                            materials.forEach((mat: THREE.Material) => {
                                (mat as any).depthTest = true;
                                (mat as any).depthWrite = true;
                                (mat as any).transparent = true;
                            });
                        }
                    }
                });

                SceneTraversal.enumerateObjectsByType(streamClone, THREE.Mesh, (mesh: THREE.Mesh) => {
                  const material = (mesh.material as THREE.MeshStandardMaterial);
                  const map = material.map as THREE.Texture;
                  const newMaterial = new THREE.MeshBasicMaterial({ 
                      map, 
                      transparent: true,
                      opacity: 0.75,
                      depthTest: false,
                      depthWrite: false
                  });
                  mesh.material = newMaterial;
                  mesh.renderOrder = 500;

                  if (material.name.includes("mesh_stream.png")) {
                    this.waterTextures.push(map);
                  }
                });

                let mixerStream: AnimationMixer | null = null;
                let actionStream: AnimationAction | null = null;
                if (streamAsset.animations.length > 0) {
                    mixerStream = new AnimationMixer(streamClone);
                    const clip = streamAsset.animations[0];
                    if (clip === undefined) {
                      throw new Error('No animation clip found');
                    }
                    const action = mixerStream.clipAction(clip);
                    action.loop = THREE.LoopRepeat;
                    action.reset();
                    action.clampWhenFinished = false;
                    action.enabled = true;
                    action.paused = true;
                    actionStream = action;
                }

                streamClone.visible = false;
                streamClone.position.z  += 0.8;
                streamClone.position.y  -= 0.5;
                streamClone.position.x  -= 0.3;
                this.streamCloned.push(streamClone);
                this.streamMixers.push(mixerStream);
                this.streamActions.push(actionStream);

            }
        }

        for (let i = 0; i < this.streamCloned.length; i++) {
            const stream = this.streamCloned[i];
            const mixer = this.streamMixers[i];
            const action = this.streamActions[i];
            if (this.stateInternal === HandsState.PULL) {
                if (!stream) {
                  throw new Error("Stream is undefined");
                }
                stream.visible = false;
                if (action) {
                    action.reset();
                    action.paused = false;
                    action.play();
                } else if (mixer) {
                    mixer.setTime(0);
                }
                if (mixer) mixer.setTime(0);
            }
        }

        this.setWaterGunVisibility(this.waterGunTypeInternal);
        TimeController.instance.on(TimeController.Event.TICK, this.onTick);

        for (let i = 0; i < this.streamCloned.length; i++) {
            const stream = this.streamCloned[i];
            if (stream === undefined) {
              throw new Error("Stream is undefined");
            }
            stream.visible = false;
        }
    }

    public disableWater(): void {
    }

    public get waterGunType(): WaterGunType {
        return this.waterGunTypeInternal;
    }

    public get state(): HandsState {
        return this.stateInternal;
    }

    public get rootObject(): Group {
        return this.orientationWrapper;
    }

    public setColorGun(color: string, secondColor: string): void {
        this.wrapper.traverse((child) => {
            if (child.name === "M_Water_Gun_2_1") {
                const mesh = child as THREE.Mesh;
                const newMaterial = new THREE.MeshStandardMaterial({color: new THREE.Color(color)});
                if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(() => newMaterial);
                else mesh.material = newMaterial;
            }
            if (child.name === "M_Water_Gun_2_2") {
                const mesh = child as THREE.Mesh;
                const newMaterial = new THREE.MeshStandardMaterial({color: new THREE.Color(secondColor)});
                if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(() => newMaterial);
                else mesh.material = newMaterial;
            }
        });

        setTimeout(() => {
            for (let i = 0; i < this.streamCloned.length; i++) {
                const stream = this.streamCloned[i];
                if (!stream) {
                  throw new Error("Stream is undefined");
                }
                stream.visible = false;
            }
        }, 800)
    }

    public disableModel(): void {
        this.wrapper.visible = false;
    }

    public set waterGunType(value: WaterGunType) {
        if (value !== this.waterGunTypeInternal) {
            this.waterGunTypeInternal = value;
            this.isChangingGun = true;
            const inDuration = 0.75;
            const outDuration = 0.75;
            gsap
                .timeline()
                .to(this.wrapper.position, {z: 0, duration: inDuration, ease: "power1.in"})
                .to(
                    this.wrapper.rotation,
                    {
                        x: -1,
                        duration: inDuration,
                        ease: "back.in",
                        onComplete: () => this.setWaterGunVisibility(this.waterGunTypeInternal)
                    },
                    0,
                )
                .to(this.wrapper.position, {z: this.offsetPosition.z, duration: outDuration, ease: "power1.in"})
                .to(this.wrapper.rotation, {
                    x: this.offsetRotation.x,
                    duration: outDuration,
                    ease: "back.out",
                    onComplete: () => {
                        this.isChangingGun = false;
                    }
                }, inDuration);
        }
    }

    public get isChangingGunAnimation(): boolean {
        return this.isChangingGun;
    }

    public set state(value: HandsState) {
        if (value === this.stateInternal) return;
        this.stateInternal = value;
        this.machine.handleEvent(this.stateInternal);

        if (value === HandsState.PUSH) {
            for (let i = 0; i < this.streamCloned.length; i++) {
                const s = this.streamCloned[i];
                const a = this.streamActions[i];
                const m = this.streamMixers[i];
                if (s) s.visible = false;
                if (a) {
                    a.stop();
                    a.paused = true;
                }
                if (m) m.setTime(0);
            }
        } else {

            this.wrapper.traverse((node: any) => {

                if (!this.streamCloned.includes(node)) {
                    node.renderOrder = 1500;

                    if (node.isMesh && node.material) {
                        const material = Array.isArray(node.material) ? node.material : [node.material];
                        material.forEach((mat: any) => {
                            mat.depthTest = true;
                            mat.depthWrite = true;
                            mat.transparent = true;
                            mat.needsUpdate = true;
                        });
                    }

                    node.traverse((child: any) => {

                        if (!this.streamCloned.includes(child)) {

                            const isStreamPart = this.streamCloned.some(stream => 
                                stream === child || stream.children.includes(child)
                            );
                            if (!isStreamPart) {
                                child.renderOrder = 1500;

                                if (child.isMesh && child.material) {
                                    const childMaterial = Array.isArray(child.material) ? child.material : [child.material];
                                    childMaterial.forEach((mat: any) => {
                                        mat.depthTest = true;
                                        mat.depthWrite = true;
                                        mat.transparent = true;
                                        mat.needsUpdate = true;
                                    });
                                }
                            }
                        }
                    });
                }
            });
            
            for (let i = 0; i < this.streamCloned.length; i++) {
                const s = this.streamCloned[i];
                if (!s) continue;
                s.visible = true;
                s.traverse((node: any) => {

                    node.renderOrder = 500;
                    if (node.isMesh && node.material) {
                        const mats = Array.isArray(node.material) ? node.material : [node.material];
                        for (const m of mats) {
                            (m as any).depthTest = false;
                            (m as any).depthWrite = false;
                            (m as Material).transparent = true;
                            m.needsUpdate = true;
                        }
                    }
                    if (node.type === "Sprite" && node.material) {
                        const sm = node.material as THREE.SpriteMaterial;
                        sm.depthTest = false;
                        sm.depthWrite = false;
                        sm.transparent = true;
                        sm.needsUpdate = true;
                    }
                });
                const a = this.streamActions[i];
                const m = this.streamMixers[i];
                if (a && m) {
                    a.reset();
                    a.paused = false;
                    a.play();
                    m.setTime(0);
                } else if (a) {
                    a.reset();
                    a.paused = false;
                    a.play();
                } else if (m) {
                    m.setTime(0);
                }
            }
        }
    }

    public setStreamTarget(point: THREE.Vector3): void {
      const defaultStreamLength = 6;
      this.lastTargetPoint = point;
      for (const stream of this.streamCloned) {
        const worldPosition = stream.getWorldPosition(new THREE.Vector3());
        const distance = worldPosition.distanceTo(point);
        const scale = distance / defaultStreamLength;
        const horizontalScale = this.waterGunTypeInternal === WaterGunType.WEAK ? 0.15 : 0.35;
        stream.scale.set(horizontalScale, horizontalScale, scale);
        stream.lookAt(point);
      }
    }

    private static buildAction(mixer: AnimationMixer, clip: AnimationClip, wrap: AnimationActionLoopStyles): AnimationAction {
        const action = new AnimationAction(mixer, clip);
        action.loop = wrap;
        action.clampWhenFinished = wrap === LoopOnce;
        return action;
    }

    private readonly onTick = (deltaTime: number): void => {
        const flowSpeed = 8;
        for (const map of this.waterTextures) {
          map.offset.x -= deltaTime * flowSpeed;
        }

        this.machine.update(deltaTime);
        for (const m of this.streamMixers) if (m) m.update(deltaTime);

        if (this.lastTargetPoint) {
          for (const stream of this.streamCloned) {
            stream.lookAt(this.lastTargetPoint);
          }
        }
    };

    private setWaterGunVisibility(waterGunType: WaterGunType): void {
        this.wrapper.traverse((child: Object3D): void => {
            child.visible = !child.name.includes("SM_Water_Gun_") || child.name.includes(`SM_Water_Gun_${waterGunType}`);
        });
    }
}
