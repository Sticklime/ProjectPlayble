import { Enemy } from "Custom/Enemy/Enemy";
import { MovementController } from "Libs/Toolbox/MovementController";
import { Component, Platform } from "Libs/Toolbox/Platform";
import {
    Box3,
    Mesh,
    Object3D,
    Quaternion,
    Raycaster,
    Vector3,
    SkinnedMesh,
    Bone,
    Scene,
    InstancedMesh,
    Matrix4
} from "three";
import { FragmentCollection, FragmentTypeName } from "../FragmentCollection";
import { HeroAnimationController } from "./HeroAnimationController";
import { HeroTriggerHandler, HeroTriggerHandlerEvent } from "./HeroTriggerHandler";
import { Emitter } from "Libs/TinyParticleSystem";
import { Fragment } from "Custom/Fragment";

interface Parameters {
    object: Object3D;
    collections: FragmentCollection[];
    movementController: MovementController;
    animationController: HeroAnimationController;
    triggerHandler: HeroTriggerHandler;
    dustEmitter: Emitter;
    podium: Mesh;
}

export class Hero extends Component {
    public readonly collections: FragmentCollection[];
    private movementController: MovementController;
    private animationController: HeroAnimationController;
    private triggerHandler: HeroTriggerHandler;
    private podium: Mesh;
    private podiumBox: Box3;
    private dustEmitter: Emitter;
    private lastValidPosition: Vector3;
    private readonly defaultViewVector: Vector3 = new Vector3(0, 0, 1);
    private readonly tempVector3D: Vector3 = new Vector3();
    private readonly tempQuaternion: Quaternion = new Quaternion();
    public heroBodyBone?: Bone;
    public isActiveMovement: boolean = false;
    private targets: Platform[] = [];
    private obstacles: Object3D[] = [];

    public constructor(platform: Platform, parameters: Parameters) {
        super(platform, 200);
        this.platform.add(parameters.object);
        this.collections = parameters.collections;
        this.movementController = parameters.movementController;
        this.animationController = parameters.animationController;
        this.triggerHandler = parameters.triggerHandler;
        this.triggerHandler.on(HeroTriggerHandlerEvent.attackContentChanged, this.onAttackContentChanged, this);
        this.podium = parameters.podium;
        this.dustEmitter = parameters.dustEmitter;
        this.podiumBox = new Box3().setFromObject(this.podium);
        this.lastValidPosition = this.platform.position.clone();
        this.addAttackEffect(parameters);
    }

    private addAttackEffect(parameters: Parameters) {
        let skinned: SkinnedMesh | undefined;
        parameters.object.traverse((child) => {
            if (!skinned && (child as SkinnedMesh).isSkinnedMesh) {
                skinned = child as SkinnedMesh;
            }
        });

        if (skinned && skinned.skeleton) {
            const boneName = "Spine";
            this.heroBodyBone = skinned.skeleton.getBoneByName(boneName)
                || skinned.skeleton.getBoneByName("Hips")
                || skinned.skeleton.bones[0];

            if (this.heroBodyBone) {
                let emitterObject3D: Object3D;
                if ((this.dustEmitter as any).isObject3D) {
                    emitterObject3D = this.dustEmitter as unknown as Object3D;
                } else {
                    emitterObject3D = new Object3D();
                    emitterObject3D.add((this.dustEmitter as any));
                }
                this.heroBodyBone.add(emitterObject3D);
                emitterObject3D.position.set(0, 0.2, 0);
                const forward = new Vector3(0, 0, 1).applyQuaternion(this.platform.quaternion);
                const backward = forward.multiplyScalar(-1);
                this.dustEmitter.lookAt(this.platform.position.clone().add(backward));
            }
        }
    }

    public setFragment(collectionName: string, fragmentType: FragmentTypeName) {
        const collection = this.collections.find((c) => c.name === collectionName);
        if (!collection) throw new Error("Collection not found");
        collection.enableFragment(fragmentType);
    }

    private isCollisionWithObstacles(position: Vector3): boolean {
        const heroBox = new Box3().setFromCenterAndSize(
            position,
            new Vector3(0.7, 1, 0.7)
        );
        for (const obstacle of this.obstacles) {
            if (obstacle instanceof InstancedMesh) {
                const matrix = new Matrix4();
                const instanceCount = obstacle.count;
                const geometryBox = new Box3().setFromBufferAttribute(obstacle.geometry.attributes.position);
                for (let i = 0; i < instanceCount; i++) {
                    obstacle.getMatrixAt(i, matrix);
                    const instanceBox = geometryBox.clone();
                    instanceBox.applyMatrix4(matrix);
                    instanceBox.applyMatrix4(obstacle.matrixWorld);
                    if (heroBox.intersectsBox(instanceBox)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public collectObstacles(scene: Scene) {
        this.obstacles = [];
        scene.traverse(child => {
            if ((child.name === "SM_Cone" || child.name === "SM_Box") && ('isMesh' in child) && (child as any).isMesh) {
                this.obstacles.push(child);
            }
        });
    }

    public removeFragment(collectionName: string, fragmentType: FragmentTypeName): void {
        const collection = this.collections.find((c) => c.name === collectionName);
        if (!collection) throw new Error("Collection not found");
        collection.disableFragment(fragmentType);
    }

    public disableAll(): void {
        for (const collection of this.collections) {
            collection.disableAll();
        }
    }

    private checkOnPodium(position: Vector3, heroRadius = 0.4): boolean {
        const offsets = [
            [ heroRadius, 0, 0],
            [-heroRadius, 0, 0],
            [0, 0,  heroRadius],
            [0, 0, -heroRadius]
        ];
        for (let offset of offsets) {
            const checkPos = new Vector3(
                position.x + offset[0]!,
                position.y + 1,
                position.z + offset[2]!
            );
            const ray = new Raycaster(checkPos, new Vector3(0, -1, 0));
            const intersects = ray.intersectObject(this.podium, true);
            if (intersects.length === 0) {
                return false;
            }
        }
        return true;
    }

    protected override onTick(deltaTime: number): void {
        const currentSpeed = this.movementController.getLastSpeed();
        const maximumSpeed = this.movementController.maximumSpeed;
        this.animationController.setMovementSpeed(currentSpeed / maximumSpeed);

        let desiredPosition = this.movementController.position.clone();
        let isPositionValid = true;

        if (this.isActiveMovement) {
            isPositionValid = this.checkOnPodium(desiredPosition, 0.4);
            if (isPositionValid && !this.isCollisionWithObstacles(desiredPosition)) {
                this.lastValidPosition.copy(desiredPosition);
            } else {
                desiredPosition.copy(this.lastValidPosition);
                this.movementController.position.copy(this.lastValidPosition);
            }
        } else {
            this.lastValidPosition.copy(desiredPosition);
        }

        this.platform.position.copy(desiredPosition);

        if (this.targets.length > 0 && this.targets[0]?.position) {
            this.tempVector3D.subVectors(this.targets[0].position, this.platform.position).normalize();
            this.tempQuaternion.setFromUnitVectors(this.defaultViewVector, this.tempVector3D);
        } else {
            this.movementController.getLastDirection(this.tempVector3D);
            this.tempQuaternion.setFromUnitVectors(this.defaultViewVector, this.tempVector3D);
        }

        const factor = Math.min(1, deltaTime * 10);
        this.platform.quaternion.slerp(this.tempQuaternion, factor);
    }

    public setMovementController(controller: MovementController) {
        this.movementController = controller;
    }

    public playWin() {
        this.animationController.runWinState();
    }

    private onAttackContentChanged(platform: Platform) {
        if (!this.targets.includes(platform)) {
            this.targets.push(platform);
            this.animationController.runAttackState();
            setTimeout(() => {
                const enemy = platform.getComponent(Enemy);
                if (enemy) enemy.kill();
                this.dustEmitter.play();
                setTimeout(() => {
                    this.dustEmitter.stop();
                    this.targets = this.targets.filter(t => t !== platform);
                    if (this.targets.length === 0) {
                        this.animationController.runMovementState();
                    }
                }, 500);
            }, 500);
        }
    }
}
