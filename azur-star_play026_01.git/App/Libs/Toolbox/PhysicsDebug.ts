import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsDebug {
    private debugObjects: THREE.Object3D[] = [];
    private scene: THREE.Scene;
    private bodyToMeshMap: Map<CANNON.Body, THREE.Object3D[]> = new Map();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public visualizeWorld(world: CANNON.World): void {
        this.clear();

        world.bodies.forEach((body) => {
            if (body.shapes && body.shapes.length > 0) {
                body.shapes.forEach((shape, shapeIndex) => {
                    if (!shape) return;
                    const offset = body.shapeOffsets && body.shapeOffsets[shapeIndex] ? body.shapeOffsets[shapeIndex] : new CANNON.Vec3(0, 0, 0);
                    const quaternion = body.shapeOrientations && body.shapeOrientations[shapeIndex] ? body.shapeOrientations[shapeIndex] : new CANNON.Quaternion();
                    
                    const mesh = this.createDebugMesh(shape, body, offset, quaternion);
                    if (mesh) {
                        this.scene.add(mesh);
                        this.debugObjects.push(mesh);
                    }
                });
            } else {
                const mesh = this.createDebugMeshForBody(body);
                if (mesh) {
                    this.scene.add(mesh);
                    this.debugObjects.push(mesh);
                }
            }
        });
    }

    private createDebugMeshForBody(body: CANNON.Body): THREE.Object3D | null {
        if (!body.shapes || body.shapes.length === 0) return null;
        
        const shape = body.shapes[0];
        if (!shape) return null;
        
        const offset = body.shapeOffsets && body.shapeOffsets[0] ? body.shapeOffsets[0] : new CANNON.Vec3(0, 0, 0);
        const quaternion = body.shapeOrientations && body.shapeOrientations[0] ? body.shapeOrientations[0] : new CANNON.Quaternion();
        
        return this.createDebugMesh(shape, body, offset, quaternion);
    }

    private createDebugMesh(
        shape: CANNON.Shape,
        body: CANNON.Body,
        offset: CANNON.Vec3,
        quaternion: CANNON.Quaternion
    ): THREE.Object3D | null {
        let geometry: THREE.BufferGeometry | null = null;

        if (shape instanceof CANNON.Box) {
            const halfExtents = shape.halfExtents;
            geometry = new THREE.BoxGeometry(
                halfExtents.x * 2,
                halfExtents.y * 2,
                halfExtents.z * 2
            );
        } else if (shape instanceof CANNON.Sphere) {
            geometry = new THREE.SphereGeometry(shape.radius, 16, 16);
        } else if (shape instanceof CANNON.Plane) {
            geometry = new THREE.PlaneGeometry(100, 100);
        } else if (shape instanceof CANNON.Cylinder) {
            const cylinder = shape as CANNON.Cylinder;
            geometry = new THREE.CylinderGeometry(
                cylinder.radiusTop,
                cylinder.radiusBottom,
                cylinder.height,
                16
            );
        } else if (shape instanceof CANNON.Trimesh) {
            const vertices = shape.vertices;
            const indices = shape.indices;
            
            geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(vertices);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            if (indices && indices.length > 0) {
                const indexArray = Array.isArray(indices) ? indices : Array.from(indices);
                geometry.setIndex(indexArray);
            }
            
            geometry.computeVertexNormals();
        }

        if (!geometry) return null;

        // Для триггеров делаем более яркий и заметный вид
        const isTrigger = (body as any).__isGoalTrigger || (body.material && body.material.name === 'goalTrigger');
        const material = new THREE.MeshBasicMaterial({
            color: this.getColorForBody(body),
            wireframe: !isTrigger, // Для триггеров делаем заполненный, а не wireframe
            transparent: true,
            opacity: isTrigger ? 0.3 : 0.8 // Триггеры более прозрачные, но заметные
        });

        const mesh = new THREE.Mesh(geometry, material);

        const worldPosition = new CANNON.Vec3();
        body.quaternion.vmult(offset, worldPosition);
        worldPosition.vadd(body.position, worldPosition);

        mesh.position.set(
            worldPosition.x,
            worldPosition.y,
            worldPosition.z
        );

        const worldQuaternion = new CANNON.Quaternion();
        body.quaternion.mult(quaternion, worldQuaternion);
        mesh.quaternion.set(
            worldQuaternion.x,
            worldQuaternion.y,
            worldQuaternion.z,
            worldQuaternion.w
        );

        return mesh;
    }

    private getColorForBody(body: CANNON.Body): number {
        // Триггеры ворот - яркий зеленый
        if ((body as any).__isGoalTrigger || (body.material && body.material.name === 'goalTrigger')) {
            return 0x00ffff; // Циан/ярко-голубой для триггеров
        } else if (body.material && body.material.name === 'wall') {
            return 0xff00ff;
        } else if (body.material && body.material.name === 'ball') {
            return 0xff0000;
        } else if (body.material && body.material.name === 'character') {
            return 0x0000ff;
        } else if (body.material && body.material.name === 'ground') {
            return 0x00ff00;
        } else if (body.material && body.material.name === 'scene') {
            return 0xffff00;
        } else if (body.mass === 0) {
            return 0x00ff00;
        }
        return 0xffffff;
    }

    public update(world: CANNON.World): void {
        const newBodyToMeshMap = new Map<CANNON.Body, THREE.Object3D[]>();
        const bodiesToRemove: CANNON.Body[] = [];

        // Обновляем существующие меши и идентифицируем тела для удаления
        this.bodyToMeshMap.forEach((meshes, body) => {
            if (!world.bodies.includes(body)) {
                bodiesToRemove.push(body);
            } else {
                newBodyToMeshMap.set(body, meshes);
                
                // Обновляем позиции только для динамических объектов (mass > 0)
                // Статические объекты (mass === 0) не двигаются, поэтому их не нужно обновлять
                if (body.mass > 0) {
                    meshes.forEach((mesh, meshIndex) => {
                        const shapeIndex = meshIndex;
                        const shape = body.shapes[shapeIndex];
                        if (!shape || !mesh) return;

                        const offset = body.shapeOffsets && body.shapeOffsets[shapeIndex] ? body.shapeOffsets[shapeIndex] : new CANNON.Vec3(0, 0, 0);
                        const quaternion = body.shapeOrientations && body.shapeOrientations[shapeIndex] ? body.shapeOrientations[shapeIndex] : new CANNON.Quaternion();
                        
                        const worldPosition = new CANNON.Vec3();
                        body.quaternion.vmult(offset, worldPosition);
                        worldPosition.vadd(body.position, worldPosition);

                        mesh.position.set(
                            worldPosition.x,
                            worldPosition.y,
                            worldPosition.z
                        );

                        const worldQuaternion = new CANNON.Quaternion();
                        body.quaternion.mult(quaternion, worldQuaternion);
                        mesh.quaternion.set(
                            worldQuaternion.x,
                            worldQuaternion.y,
                            worldQuaternion.z,
                            worldQuaternion.w
                        );
                    });
                }
            }
        });

        // Удаляем старые тела
        bodiesToRemove.forEach(body => {
            const meshes = this.bodyToMeshMap.get(body);
            if (meshes) {
                meshes.forEach(mesh => {
                    this.scene.remove(mesh);
                    if (mesh instanceof THREE.Mesh) {
                        if (mesh.geometry) mesh.geometry.dispose();
                        if (mesh.material) {
                            if (Array.isArray(mesh.material)) {
                                mesh.material.forEach((mat) => mat.dispose());
                            } else {
                                mesh.material.dispose();
                            }
                        }
                    }
                });
            }
        });

        // Добавляем новые тела
        world.bodies.forEach((body) => {
            if (!newBodyToMeshMap.has(body)) {
                const meshes: THREE.Object3D[] = [];
                if (body.shapes && body.shapes.length > 0) {
                    body.shapes.forEach((shape, shapeIndex) => {
                        if (!shape) return;
                        const offset = body.shapeOffsets && body.shapeOffsets[shapeIndex] ? body.shapeOffsets[shapeIndex] : new CANNON.Vec3(0, 0, 0);
                        const quaternion = body.shapeOrientations && body.shapeOrientations[shapeIndex] ? body.shapeOrientations[shapeIndex] : new CANNON.Quaternion();
                        
                        const mesh = this.createDebugMesh(shape, body, offset, quaternion);
                        if (mesh) {
                            this.scene.add(mesh);
                            meshes.push(mesh);
                        }
                    });
                }
                newBodyToMeshMap.set(body, meshes);
            }
        });

        this.bodyToMeshMap = newBodyToMeshMap;
    }

    public clear(): void {
        this.bodyToMeshMap.forEach((meshes) => {
            meshes.forEach(obj => {
                this.scene.remove(obj);
                if (obj instanceof THREE.Mesh) {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) {
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach((mat) => mat.dispose());
                        } else {
                            obj.material.dispose();
                        }
                    }
                }
            });
        });
        this.debugObjects = [];
        this.bodyToMeshMap.clear();
    }

    public destroy(): void {
        this.clear();
    }
}

