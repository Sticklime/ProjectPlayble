import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class CharacterPhysics {
    private world: CANNON.World;
    private characterBody: CANNON.Body | null = null;
    private characterOffset: THREE.Vector3;
    private character: THREE.Object3D;
    private isWorldOwner: boolean = false;
    protected collisionOffset: THREE.Vector3;

    private targetVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    private currentVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    private acceleration: number = 30;
    private deceleration: number = 25;
    private maxSpeed: number = 10;

    constructor(
        character: THREE.Object3D,
        mass: number = 1,
        gravityY: number = -20,
        world?: CANNON.World,
        collisionOffset?: THREE.Vector3
    ) {
        this.character = character;
        this.characterOffset = new THREE.Vector3(0, 0, 0);
        this.collisionOffset = collisionOffset || new THREE.Vector3(-0.3, 0.2, 0);

        if (world) {
            this.world = world;
            this.isWorldOwner = false;
        } else {
            this.world = new CANNON.World();
            this.world.gravity.set(0, gravityY, 0);
            this.world.broadphase = new CANNON.NaiveBroadphase();
            this.isWorldOwner = true;

            this.world.defaultContactMaterial.friction = 0.0;
            this.world.defaultContactMaterial.restitution = 0.0;
            this.world.defaultContactMaterial.contactEquationStiffness = 1e7;
            this.world.defaultContactMaterial.contactEquationRelaxation = 5;
            this.world.defaultContactMaterial.frictionEquationStiffness = 1e7;
            this.world.defaultContactMaterial.frictionEquationRelaxation = 5;
        }

        this.createCharacterBody(mass);

        (character as any).__characterPhysics = this;
    }

    private createCharacterBody(mass: number): void {
        if (this.characterBody) {
            return;
        }

        let radius: number;

        // ---------- 1. Радиус коллизии (по размерам модели, как и раньше) ----------
        const worldKey = (this.world as any).__characterCollisionParams;
        if (worldKey && worldKey.radius !== undefined) {
            radius = worldKey.radius;
        } else {
            const box = new THREE.Box3().setFromObject(this.character);
            const size = box.getSize(new THREE.Vector3());

            const avgSize = (size.x + size.y + size.z) / 3;
            radius = avgSize / 2 * 1.2;

            (this.world as any).__characterCollisionParams = {
                radius: radius
            };
        }

        const shape = new CANNON.Sphere(radius);

        // ---------- 2. Позиция тела = позиция персонажа + collisionOffset ----------

        // Обновляем матрицу, чтобы получить корректные мировые оси
        this.character.updateMatrixWorld(true);

        // Позиция pivot персонажа в мире
        const worldPosition = new THREE.Vector3();
        this.character.getWorldPosition(worldPosition);

        // Базисные векторы (право / вверх / вперёд) в мировых координатах
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        const forward = new THREE.Vector3();
        right.setFromMatrixColumn(this.character.matrixWorld, 0).normalize();
        up.setFromMatrixColumn(this.character.matrixWorld, 1).normalize();
        forward.setFromMatrixColumn(this.character.matrixWorld, 2).normalize();

        // Смещение коллизии в мировых координатах
        const worldOffset = new THREE.Vector3();
        worldOffset.addScaledVector(right, this.collisionOffset.x);
        worldOffset.addScaledVector(up, this.collisionOffset.y);
        worldOffset.addScaledVector(forward, this.collisionOffset.z);

        // Центр сферы = позиция персонажа + offset
        const sphereCenter = new THREE.Vector3(
            worldPosition.x + worldOffset.x + 0.3,
            worldPosition.y + worldOffset.y,
            worldPosition.z + worldOffset.z
        );

        // Сохраняем смещение между телом и персонажем один раз
        this.characterOffset.subVectors(sphereCenter, worldPosition);

        this.characterBody = new CANNON.Body({
            mass: mass,
            shape: shape,
            position: new CANNON.Vec3(
                sphereCenter.x,
                sphereCenter.y,
                sphereCenter.z
            )
        });

        let characterMaterial = (this.world as any).__characterMaterial;
        if (!characterMaterial) {
            characterMaterial = new CANNON.Material('character');
            characterMaterial.friction = 0.0;
            characterMaterial.restitution = 0.0;
            (this.world as any).__characterMaterial = characterMaterial;
        }
        this.characterBody.material = characterMaterial;

        this.characterBody.fixedRotation = true;
        this.characterBody.updateMassProperties();

        if (!this.isWorldOwner) {
            this.characterBody.collisionFilterGroup = 0x0004;
            this.characterBody.collisionFilterMask = 0x0001 | 0x0002 | 0x0008 | 0x0010;
        } else {
            this.characterBody.collisionFilterGroup = 0x0001;
            this.characterBody.collisionFilterMask = 0x0002 | 0x0004 | 0x0008 | 0x0010;
        }

        this.setupContactMaterials();

        if (mass > 0) {
            this.characterBody.wakeUp();
            this.characterBody.allowSleep = false;
        }

        this.world.addBody(this.characterBody);
    }

    private setupContactMaterials(): void {
        if (!this.characterBody || !this.characterBody.material) return;

        let characterMaterial = this.characterBody.material;

        if (!this.isWorldOwner && this.world.bodies) {
            for (let i = 0; i < this.world.bodies.length; i++) {
                const body = this.world.bodies[i];
                if (body && body.material && body.material.name === 'character') {
                    characterMaterial = body.material;
                    this.characterBody.material = characterMaterial;
                    break;
                }
            }
        }

        let groundMaterial = (this.world as any).__groundMaterial;
        if (!groundMaterial) {
            groundMaterial = new CANNON.Material('ground');
            (this.world as any).__groundMaterial = groundMaterial;
        }

        const existingGroundContact = this.findContactMaterial(characterMaterial, groundMaterial);
        if (!existingGroundContact) {
            const characterGroundContact = new CANNON.ContactMaterial(
                characterMaterial,
                groundMaterial,
                {
                    friction: 0.0,
                    restitution: 0.0,
                    contactEquationStiffness: 1e6,
                    contactEquationRelaxation: 10,
                    frictionEquationStiffness: 1e6,
                    frictionEquationRelaxation: 10
                }
            );
            this.world.addContactMaterial(characterGroundContact);
        }

        let wallMaterial = (this.world as any).__wallMaterial;
        if (!wallMaterial) {
            wallMaterial = new CANNON.Material('wall');
            (this.world as any).__wallMaterial = wallMaterial;
        }

        const existingWallContact = this.findContactMaterial(characterMaterial, wallMaterial);
        if (!existingWallContact) {
            const characterWallContact = new CANNON.ContactMaterial(
                characterMaterial,
                wallMaterial,
                {
                    friction: 0.0,
                    restitution: 0.0,
                    contactEquationStiffness: 1e10,
                    contactEquationRelaxation: 1,
                    frictionEquationStiffness: 1e10,
                    frictionEquationRelaxation: 1
                }
            );
            this.world.addContactMaterial(characterWallContact);
        }
    }

    private findContactMaterial(matA: CANNON.Material, matB: CANNON.Material): CANNON.ContactMaterial | null {
        if (!this.world.contactmaterials) return null;

        for (let i = 0; i < this.world.contactmaterials.length; i++) {
            const contactMat = this.world.contactmaterials[i];
            if (contactMat &&
                ((contactMat.materials[0] === matA && contactMat.materials[1] === matB) ||
                 (contactMat.materials[0] === matB && contactMat.materials[1] === matA))) {
                return contactMat;
            }
        }
        return null;
    }

    public update(deltaTime: number): void {
        if (!this.characterBody) return;

        this.updateSmoothMovement(deltaTime);

        if (this.isWorldOwner) {
            const maxStep = 1 / 60;
            const clampedDeltaTime = Math.min(deltaTime, maxStep);
            this.world.step(clampedDeltaTime);
        }

        if (this.characterBody.position.y < 1.0) {
            if (this.characterBody.velocity.y > 0) {
                this.characterBody.velocity.y = 0;
            }
            if (this.characterBody.velocity.y < 0 && this.characterBody.velocity.y > -0.1) {
                this.characterBody.velocity.y = 0;
            }
        }

        if (this.character && this.characterBody) {
            // Простая и стабильная схема:
            // 1. В createCharacterBody мы один раз посчитали characterOffset
            //    (разницу между позицией коллизионной сферы и позицией модели).
            // 2. Здесь просто применяем этот offset каждый кадр.
            this.character.position.set(
                this.characterBody.position.x - this.characterOffset.x,
                this.characterBody.position.y - this.characterOffset.y,
                this.characterBody.position.z - this.characterOffset.z
            );
        }

        if (this.characterBody.angularVelocity) {
            this.characterBody.angularVelocity.set(0, 0, 0);
        }
    }

    public syncPositionOnly(): void {
        if (!this.characterBody || !this.character) return;

        this.character.position.set(
            this.characterBody.position.x - this.characterOffset.x,
            this.characterBody.position.y - this.characterOffset.y,
            this.characterBody.position.z - this.characterOffset.z
        );
    }

    public updateMovement(deltaTime: number): void {
        if (!this.characterBody) return;
        this.updateSmoothMovement(deltaTime);
    }

    private updateSmoothMovement(deltaTime: number): void {
        if (!this.characterBody) return;

        this.currentVelocity.set(
            this.characterBody.velocity.x,
            this.characterBody.velocity.y,
            this.characterBody.velocity.z
        );

        const targetHorizontalSpeed = Math.sqrt(
            this.targetVelocity.x * this.targetVelocity.x +
            this.targetVelocity.z * this.targetVelocity.z
        );
        if (targetHorizontalSpeed > this.maxSpeed) {
            const scale = this.maxSpeed / targetHorizontalSpeed;
            this.targetVelocity.x *= scale;
            this.targetVelocity.z *= scale;
        }

        const velocityDiff = new THREE.Vector3().subVectors(
            this.targetVelocity,
            this.currentVelocity
        );

        const horizontalDiff = new THREE.Vector3(velocityDiff.x, 0, velocityDiff.z);
        const horizontalDiffLength = horizontalDiff.length();

        if (horizontalDiffLength > 0.01) {
            const targetHorizontalLength = Math.sqrt(
                this.targetVelocity.x * this.targetVelocity.x +
                this.targetVelocity.z * this.targetVelocity.z
            );
            const currentHorizontalLength = Math.sqrt(
                this.currentVelocity.x * this.currentVelocity.x +
                this.currentVelocity.z * this.currentVelocity.z
            );
            const isAccelerating = targetHorizontalLength > currentHorizontalLength;
            const accelerationRate = isAccelerating ? this.acceleration : this.deceleration;

            const maxChange = accelerationRate * deltaTime;
            const changeAmount = Math.min(horizontalDiffLength, maxChange);

            horizontalDiff.normalize().multiplyScalar(changeAmount);

            this.characterBody.velocity.x += horizontalDiff.x;
            this.characterBody.velocity.z += horizontalDiff.z;

            const newHorizontalSpeed = Math.sqrt(
                this.characterBody.velocity.x * this.characterBody.velocity.x +
                this.characterBody.velocity.z * this.characterBody.velocity.z
            );
            if (newHorizontalSpeed > this.maxSpeed) {
                const scale = this.maxSpeed / newHorizontalSpeed;
                this.characterBody.velocity.x *= scale;
                this.characterBody.velocity.z *= scale;
            }
        } else {
            this.characterBody.velocity.x = this.targetVelocity.x;
            this.characterBody.velocity.z = this.targetVelocity.z;
        }
    }

    private checkAndFixCollisions(): void {
        if (!this.characterBody || !this.characterBody.world) return;

        const speed = Math.sqrt(
            this.characterBody.velocity.x * this.characterBody.velocity.x +
            this.characterBody.velocity.z * this.characterBody.velocity.z
        );

        if (speed < 0.1) return;

        const contacts = this.characterBody.world.contacts;
        if (!contacts || contacts.length === 0) return;

        const maxContactsToCheck = 5;
        let checkedContacts = 0;

        for (let i = 0; i < contacts.length && checkedContacts < maxContactsToCheck; i++) {
            const contact = contacts[i];
            if (!contact || !contact.bi || !contact.bj) continue;

            const isCharacterContact = contact.bi === this.characterBody || contact.bj === this.characterBody;
            if (!isCharacterContact) continue;

            checkedContacts++;

            const otherBody = contact.bi === this.characterBody ? contact.bj : contact.bi;

            if (otherBody && otherBody.mass === 0 && contact.ni) {
                const normal = contact.ni;
                const velocity = this.characterBody.velocity;

                const velocityTowardWall = velocity.x * normal.x + velocity.z * normal.z;

                if (velocityTowardWall < 0) {
                    this.characterBody.velocity.x -= normal.x * velocityTowardWall;
                    this.characterBody.velocity.z -= normal.z * velocityTowardWall;
                }
            }
        }
    }

    public getWorld(): CANNON.World {
        return this.world;
    }

    public getBody(): CANNON.Body | null {
        return this.characterBody;
    }

    public jump(jumpForce: number = 8): void {
        if (!this.characterBody) return;

        const isOnGround = this.isOnGround();

        if (isOnGround) {
            this.characterBody.velocity.y = jumpForce;
            this.characterBody.wakeUp();
        }
    }

    private isOnGround(): boolean {
        if (!this.characterBody || !this.characterBody.world) return false;

        if (this.characterBody.velocity.y < -0.5) {
            return false;
        }

        const contacts = this.characterBody.world.contacts;
        if (!contacts || contacts.length === 0) {
            if (Math.abs(this.characterBody.velocity.y) < 0.1 && this.characterBody.position.y < 5) {
                return true;
            }
            return false;
        }

        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            if (!contact || !contact.bi || !contact.bj) continue;

            const isCharacterContact = contact.bi === this.characterBody || contact.bj === this.characterBody;
            if (!isCharacterContact) continue;

            if (contact.ni) {
                const normal = contact.ni;
                if (normal.y > 0.5 && this.characterBody.velocity.y <= 0.5) {
                    return true;
                }
            }
        }

        if (Math.abs(this.characterBody.velocity.y) < 0.2 && this.characterBody.position.y < 5) {
            return true;
        }

        return false;
    }

    public applyForce(force: THREE.Vector3): void {
        if (this.characterBody) {
            this.characterBody.applyForce(
                new CANNON.Vec3(force.x, force.y, force.z),
                this.characterBody.position
            );
        }
    }

    public setVelocity(velocity: THREE.Vector3): void {
        this.targetVelocity.set(velocity.x, velocity.y, velocity.z);
    }

    public setTargetVelocity(velocity: THREE.Vector3): void {
        this.targetVelocity.x = velocity.x;
        this.targetVelocity.z = velocity.z;
    }

    public getVelocity(result: THREE.Vector3): THREE.Vector3 {
        if (this.characterBody) {
            result.set(
                this.characterBody.velocity.x,
                this.characterBody.velocity.y,
                this.characterBody.velocity.z
            );
        } else {
            result.set(0, 0, 0);
        }
        return result;
    }

    public destroy(): void {
        if (this.characterBody && this.characterBody.world) {
            this.world.removeBody(this.characterBody);
        }
        this.characterBody = null;
        if ((this.character as any).__characterPhysics === this) {
            delete (this.character as any).__characterPhysics;
        }
    }
}
