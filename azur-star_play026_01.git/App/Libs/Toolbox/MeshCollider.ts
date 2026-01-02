// MeshCollider.ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export type MeshColliderShapeType = 'box' | 'trimesh';

export interface MeshColliderOptions {
    mass?: number;
    material?: CANNON.Material;
    shapeType?: MeshColliderShapeType;
}

export class MeshCollider {
    public readonly mesh: THREE.Mesh;
    public readonly body: CANNON.Body;

    constructor(
        mesh: THREE.Mesh,
        world: CANNON.World,
        options: MeshColliderOptions = {},
    ) {
        this.mesh = mesh;

        const {
            mass = 1,
            material,
            shapeType = 'box',
        } = options;

        const geometry = mesh.geometry as THREE.BufferGeometry;

        // Получаем масштаб меша для правильного создания коллайдера
        const worldScale = new THREE.Vector3();
        mesh.getWorldScale(worldScale);

        const shape =
            shapeType === 'trimesh'
                ? MeshCollider.createTrimeshShapeFromGeometry(geometry, worldScale)
                : MeshCollider.createBoxShapeFromGeometry(geometry, worldScale);

        this.body = new CANNON.Body({
            mass,
            material,
            shape,
        });

        // Настраиваем collision filter для стен (группа 0x0008 - другие объекты)
        // Статические объекты (mass = 0) коллидируют с игроками и мячами
        if (mass === 0) {
            this.body.collisionFilterGroup = 0x0008; // Группа для статических объектов (стены)
            this.body.collisionFilterMask = 0x0001 | 0x0004 | 0x0010; // Коллидирует с главным игроком (0x0001), AI игроками (0x0004) и мячами (0x0010)
        }

        // Используем мировые координаты меша
        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        
        mesh.getWorldPosition(worldPosition);
        mesh.getWorldQuaternion(worldQuaternion);
        // worldScale уже получен выше

        this.body.position.set(
            worldPosition.x,
            worldPosition.y,
            worldPosition.z,
        );

        this.body.quaternion.set(
            worldQuaternion.x,
            worldQuaternion.y,
            worldQuaternion.z,
            worldQuaternion.w,
        );

        world.addBody(this.body);
    }

    public syncMeshWithBody(): void {
        const { position: p, quaternion: q } = this.body;

        this.mesh.position.set(p.x, p.y, p.z);
        this.mesh.quaternion.set(q.x, q.y, q.z, q.w);
    }

    private static createBoxShapeFromGeometry(
        geometry: THREE.BufferGeometry,
        scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1),
    ): CANNON.Box {
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;

        if (!box) {
            throw new Error('Geometry has no bounding box');
        }

        const size = new THREE.Vector3();
        box.getSize(size);

        // Учитываем масштаб меша
        const scaledSize = new THREE.Vector3(
            size.x * scale.x,
            size.y * scale.y,
            size.z * scale.z,
        );

        const halfExtents = new CANNON.Vec3(
            scaledSize.x / 2,
            scaledSize.y / 2,
            scaledSize.z / 2,
        );

        return new CANNON.Box(halfExtents);
    }

    private static createTrimeshShapeFromGeometry(
        geometry: THREE.BufferGeometry,
        scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1),
    ): CANNON.Trimesh {
        // Клонируем геометрию для работы с индексами
        const geom = geometry.index ? geometry.clone() : geometry;

        const positionAttr = geom.getAttribute('position');

        if (!positionAttr) {
            throw new Error('Geometry has no position attribute');
        }

        // Получаем вершины из геометрии с учетом масштаба
        const vertices: number[] = [];
        for (let i = 0; i < positionAttr.count; i++) {
            // Применяем масштаб к вершинам
            vertices.push(
                positionAttr.getX(i) * scale.x,
                positionAttr.getY(i) * scale.y,
                positionAttr.getZ(i) * scale.z,
            );
        }

        // Получаем индексы
        let indices: number[] = [];
        if (geom.index) {
            indices = Array.from(geom.index.array as ArrayLike<number>);
        } else {
            // Если нет индексов, создаем последовательные индексы
            indices = Array.from(
                { length: positionAttr.count },
                (_, i) => i,
            );
        }

        // Создаем Trimesh с вершинами и индексами
        const trimesh = new CANNON.Trimesh(vertices, indices);
        
        return trimesh;
    }
}
