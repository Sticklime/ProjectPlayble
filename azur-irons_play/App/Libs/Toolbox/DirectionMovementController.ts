import {Vector3, Vector3Like} from "three";
import {MovementController} from "./MovementController";

interface Parameters {
    initialPosition?: Vector3Like;
    initialVelocity?: Vector3Like;
    initialDirection?: Vector3Like;
    acceleration?: number;
    deceleration?: number;
    maximumSpeed?: number;
    isActive?: boolean;
}

export class DirectionMovementController implements MovementController {
    public acceleration: number;
    public deceleration: number;
    public maximumSpeed: number;

    public position: Vector3 = new Vector3();
    public direction: Vector3 = new Vector3();
    public velocity: Vector3 = new Vector3();

    public isActive: boolean;
    private readonly tempVector3D0 = new Vector3();
    private readonly tempVector3D1 = new Vector3();
    private lastSpeed = 0;
    private lastDirection = new Vector3(0, 0, -1);

    public constructor(parameters: Parameters = {}) {
        if (parameters.initialPosition) {
            this.position.copy(parameters.initialPosition);
        }
        if (parameters.initialVelocity) {
            this.velocity.copy(parameters.initialVelocity);
        }
        if (parameters.initialDirection) {
            this.direction.copy(parameters.initialDirection).normalize();
            this.lastDirection.copy(this.direction);
        }
        this.acceleration = parameters.acceleration ?? 24;
        this.deceleration = parameters.deceleration ?? 24;
        this.maximumSpeed = parameters.maximumSpeed ?? 12;
        this.isActive = parameters.isActive ?? false;
    }

    private move(deltaTime: number): void {
        const targetVelocity = this.tempVector3D0
            .copy(this.direction)
            .multiplyScalar(this.maximumSpeed);

        const velocityDelta = this.tempVector3D1
            .copy(targetVelocity)
            .sub(this.velocity);

        const velocityDeltaSquaredLength = velocityDelta.lengthSq();
        if (velocityDeltaSquaredLength > 1e-5) {
            const velocityDeltaLength = Math.sqrt(velocityDeltaSquaredLength);
            const change = Math.min(
                this.acceleration * deltaTime,
                velocityDeltaLength,
            );
            velocityDelta.divideScalar(velocityDeltaLength);
            this.velocity.addScaledVector(velocityDelta, change);
            this.lastSpeed = this.velocity.length();
        }
    }

    private stop(deltaTime: number): void {
        const velocitySquaredLength = this.velocity.length();
        if (velocitySquaredLength > 1e-5) {
            const velocityLength = Math.sqrt(velocitySquaredLength);
            const deceleration = Math.min(
                this.deceleration * deltaTime,
                velocityLength,
            );
            this.tempVector3D0.copy(this.velocity).divideScalar(velocityLength);
            this.velocity.addScaledVector(this.tempVector3D0, -deceleration);
            this.lastSpeed = velocityLength - deceleration;
        } else {
            this.velocity.set(0, 0, 0);
            this.lastSpeed = 0;
        }
    }

    public update(deltaTime: number): void {
        if (this.isActive && this.direction.lengthSq() > 1e-5) this.move(deltaTime);
        else this.stop(deltaTime);

        this.tempVector3D0.copy(this.velocity).multiplyScalar(deltaTime);
        this.position.add(this.tempVector3D0);
    }

    public getDirection(result: Vector3) {
        result.copy(this.direction);
    }

    public setDirection(direction: Vector3Like) {
        this.direction.copy(direction);
        const directionLengthSquared = this.direction.lengthSq();

        if (Math.abs(directionLengthSquared - 1) > 1e-5) {
            const directionLength = Math.sqrt(directionLengthSquared);
            this.direction.divideScalar(directionLength);
        }

        const angle = this.velocity.angleTo(this.direction);
        if (angle > Math.PI / 2) {
            this.velocity.set(0, 0, 0);
            this.lastSpeed = 0;
        }
    }

    public getLastDirection(result: Vector3): void {
        const lengthSq = this.velocity.lengthSq();
        if (lengthSq > 1e-5) {
            const length = Math.sqrt(lengthSq);
            this.lastDirection.copy(this.velocity).divideScalar(length);
        }

        result.copy(this.lastDirection);
    }

    public getLastSpeed(): number {
        return this.lastSpeed;
    }
}
