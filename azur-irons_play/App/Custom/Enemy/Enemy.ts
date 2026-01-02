import { EnemyAnimationController } from "Custom/Enemy/EnemyAnimationController";
import { MovementController } from "Libs/Toolbox/MovementController";
import { Component, Platform } from "Libs/Toolbox/Platform";
import { TargetMovementController } from "Libs/Toolbox/TargetMovementController";
import { Object3D, Quaternion, Vector3, MeshStandardMaterial } from "three";
import { EnemyTriggerHandler, EnemyTriggerHandlerEvent } from "./EnemyTriggerHandler";
import { gsap } from "gsap";

interface Parameters {
    object: Object3D;
    movementController: MovementController;
    animationController: EnemyAnimationController;
    triggerHandler: EnemyTriggerHandler;
    material: MeshStandardMaterial;
}

export class Enemy extends Component {
    private movementController: MovementController;
    private animationController: EnemyAnimationController;
    private triggerHandler: EnemyTriggerHandler;
    private target?: Platform;
    private material: MeshStandardMaterial;

    private readonly defaultViewVector: Vector3 = new Vector3(0, 0, 1);
    private readonly tempVector3D: Vector3 = new Vector3();
    private readonly tempQuaternion: Quaternion = new Quaternion();

    public onDeath: (() => void) | null = null;

    public constructor(platform: Platform, parameters: Parameters) {
        super(platform, 200);
        this.platform.add(parameters.object);
        this.movementController = parameters.movementController;
        this.animationController = parameters.animationController;
        this.triggerHandler = parameters.triggerHandler;
        this.triggerHandler.on(
            EnemyTriggerHandlerEvent.attackContentChanged,
            this.onCanAttack,
            this,
        );
        this.triggerHandler.once(
            EnemyTriggerHandlerEvent.detectContentChanged,
            this.onCanFollow,
            this,
        );
        this.material = parameters.material;
    }

    public kill() {
        this.movementController.isActive = false;
        this.animationController.runDeathState();
        this.triggerHandler.destroy();

        if (this.onDeath) this.onDeath();

        const startEmissive = this.material.emissive.clone();

        gsap.to(this.material.color, {
            r: 0,
            g: 0,
            b: 0,
            duration: 0.6,
            ease: "power2.out",
            onUpdate: () => {
                this.material.needsUpdate = true;
            }
        });
        
        gsap.to(this.material.emissive, {
            r: 0,
            g: 0,
            b: 0,
            duration: 0.6,
            ease: "power2.out",
            onUpdate: () => {
                this.material.needsUpdate = true;
            }
        });

        if (this.material.emissiveIntensity !== undefined) {
            gsap.to(this.material, {
                emissiveIntensity: 0,
                duration: 0.6,
                ease: "power2.out",
            });
        }
    }

    protected override onTick(deltaTime: number): void {
        if (!this.movementController.isActive) return;
        this.platform.position.copy(this.movementController.position);

        const currentSpeed = this.movementController.getLastSpeed();
        const maximumSpeed = this.movementController.maximumSpeed;
        this.animationController.setMovementSpeed(currentSpeed / maximumSpeed);

        if (this.target) {
            this.tempVector3D
                .subVectors(this.target.position, this.platform.position)
                .normalize();
            this.tempQuaternion.setFromUnitVectors(
                this.defaultViewVector,
                this.tempVector3D,
            );
        } else {
            this.movementController.getLastDirection(this.tempVector3D);
            this.tempQuaternion.setFromUnitVectors(
                this.defaultViewVector,
                this.tempVector3D,
            );
        }

        const factor = Math.min(1, deltaTime * 10);
        this.platform.quaternion.slerp(this.tempQuaternion, factor);
    }

    private onCanAttack(platforms: Platform[]) {
        if (!this.target || platforms.indexOf(this.target) === -1) {
            this.target = undefined;

            const firstElement = platforms[0];
            if (firstElement) {
                this.target = firstElement;
                this.animationController.runAttackState();
            } else {
                this.animationController.runMovementState();
            }
        }
    }

    private onCanFollow(platforms: Platform[]) {
        const platform = platforms[0];
        if (
            platform &&
            this.movementController instanceof TargetMovementController
        ) {
            this.movementController.target = platform.position;
        }
    }
}
