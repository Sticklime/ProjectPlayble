import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class BallPhysics {
    private world: CANNON.World;
    private ballBodies: Map<THREE.Object3D, CANNON.Body> = new Map();
    private ballOffsets: Map<THREE.Object3D, THREE.Vector3> = new Map();
    private balls: THREE.Object3D[] = [];

    constructor(world: CANNON.World, balls: THREE.Object3D[]) {
        this.world = world;
        this.balls = balls.filter(ball => {
            if ((ball as any).__isStaticSceneObject) {
                return false;
            }
            return true;
        });
        
        if (this.balls.length === 0) {
            return;
        }
        
        const existingPhysics = this.balls.find(ball => (ball as any).__ballPhysics);
        if (existingPhysics) {
            const existing = (existingPhysics as any).__ballPhysics;
            this.ballBodies = existing.ballBodies;
            this.ballOffsets = existing.ballOffsets;
            return;
        }
        
        this.balls.forEach(ball => {
            (ball as any).__ballPhysics = this;
        });
        
        this.createBallBodies();
    }

    private createBallBodies(): void {
        if (this.ballBodies.size > 0) {
            return;
        }
        
        this.balls.forEach((ball) => {
            if (!ball) return;
            
            if ((ball as any).__ballPhysicsBody) {
                return;
            }
            (ball as any).__ballPhysicsBody = true;

            const box = new THREE.Box3().setFromObject(ball);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            const worldPosition = new THREE.Vector3();
            ball.getWorldPosition(worldPosition);
            
            const offset = new THREE.Vector3().subVectors(center, worldPosition);
            this.ballOffsets.set(ball, offset);
            
            let radius = Math.max(size.x, size.y, size.z) / 2;
            if (radius < 0.1) {
                radius = 0.5;
            }

            const shape = new CANNON.Sphere(radius);

            const body = new CANNON.Body({
                mass: 1,
                shape: shape,
                position: new CANNON.Vec3(
                    center.x,
                    center.y,
                    center.z
                )
            });

            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);
            body.sleep();

            body.material = new CANNON.Material('ball');
            if (body.material) {
                body.material.friction = 0.3;
                body.material.restitution = 0.85;
            }

            body.collisionFilterGroup = 0x0010;
            body.collisionFilterMask = 0x0001 | 0x0004 | 0x0008 | 0x0010;

            if (!body.world) {
                this.world.addBody(body);
            }
            this.ballBodies.set(ball, body);
        });
    }

    public update(deltaTime: number): void {
        this.ballBodies.forEach((body, ball) => {
            if (!ball || !body) return;

            const offset = this.ballOffsets.get(ball) || new THREE.Vector3(0, 0, 0);

            ball.position.set(
                body.position.x - offset.x,
                body.position.y - offset.y,
                body.position.z - offset.z
            );

            ball.quaternion.set(
                body.quaternion.x,
                body.quaternion.y,
                body.quaternion.z,
                body.quaternion.w
            );
        });
    }

    public addBall(ball: THREE.Object3D): void {
        if (this.ballBodies.has(ball)) return;

        const box = new THREE.Box3().setFromObject(ball);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const worldPosition = new THREE.Vector3();
        ball.getWorldPosition(worldPosition);
        
        const offset = new THREE.Vector3().subVectors(center, worldPosition);
        this.ballOffsets.set(ball, offset);
        
        let radius = Math.max(size.x, size.y, size.z) / 2;
        if (radius < 0.1) {
            radius = 0.5;
        }
        
        radius = radius / 2;

        const shape = new CANNON.Sphere(radius);

        const body = new CANNON.Body({
            mass: 1,
            shape: shape,
            position: new CANNON.Vec3(
                center.x,
                center.y,
                center.z
            )
        });

        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.sleep();

        body.material = new CANNON.Material('ball');
        if (body.material) {
            body.material.friction = 0.3;
            body.material.restitution = 0.85;
        }

        body.collisionFilterGroup = 0x0010;
        body.collisionFilterMask = 0x0001 | 0x0004 | 0x0008 | 0x0010;

        if (!body.world) {
            this.world.addBody(body);
        }
        this.ballBodies.set(ball, body);
        this.balls.push(ball);
    }

    public getBody(ball: THREE.Object3D): CANNON.Body | undefined {
        return this.ballBodies.get(ball);
    }

    public getAllBodies(): CANNON.Body[] {
        return Array.from(this.ballBodies.values());
    }

    public removeBall(ball: THREE.Object3D): void {
        const body = this.ballBodies.get(ball);
        if (body) {
            this.world.removeBody(body);
            this.ballBodies.delete(ball);
            this.ballOffsets.delete(ball);
            const index = this.balls.indexOf(ball);
            if (index > -1) {
                this.balls.splice(index, 1);
            }
        }
    }

    public destroy(): void {
        this.ballBodies.forEach((body) => {
            if (body) {
                this.world.removeBody(body);
            }
        });
        this.ballBodies.clear();
        this.balls = [];
    }
}

