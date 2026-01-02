import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export interface GroundColliderOptions {
    position?: THREE.Vector3;
    size?: number | THREE.Vector3; // Может быть число (квадрат) или Vector3 (разные размеры по осям)
    thickness?: number;
    material?: CANNON.Material;
}

export class GroundCollider {
    public readonly body: CANNON.Body;

    constructor(
        world: CANNON.World,
        options: GroundColliderOptions = {}
    ) {
        const {
            position = new THREE.Vector3(0, 0, 0),
            size = 1000,
            thickness = 0.1,
            material,
        } = options;

        // Определяем размеры по осям
        let sizeX: number;
        let sizeZ: number;
        if (size instanceof THREE.Vector3) {
            sizeX = size.x;
            sizeZ = size.z;
        } else {
            sizeX = size;
            sizeZ = size;
        }

        // Создаем большой статический пол как Box
        const groundShape = new CANNON.Box(new CANNON.Vec3(
            sizeX / 2,
            thickness / 2,
            sizeZ / 2
        ));
        
        const groundBody = new CANNON.Body({
            mass: 0, // Статическое тело
            shape: groundShape,
        });
        
        // Размещаем пол так, чтобы верхняя поверхность была на указанной Y позиции
        groundBody.position.set(
            position.x,
            position.y - thickness / 2, // Центр Box ниже на половину толщины
            position.z
        );
        
        // Настраиваем материал пола
        const groundMaterial = material || new CANNON.Material('ground');
        groundMaterial.friction = 0.4;
        groundMaterial.restitution = 0.0;
        groundBody.material = groundMaterial;
        
        // Настраиваем collision filter для пола (группа 0x0008 - другие объекты)
        groundBody.collisionFilterGroup = 0x0008; // Группа для статических объектов (пол, стены)
        groundBody.collisionFilterMask = 0x0001 | 0x0004 | 0x0010; // Коллидирует с главным игроком (0x0001), AI игроками (0x0004) и мячами (0x0010)
        
        world.addBody(groundBody);
        
        this.body = groundBody;
    }

    public getPosition(): THREE.Vector3 {
        const pos = this.body.position;
        return new THREE.Vector3(pos.x, pos.y, pos.z);
    }

    public setPosition(position: THREE.Vector3): void {
        const thickness = this.body.shapes[0] instanceof CANNON.Box 
            ? this.body.shapes[0].halfExtents.y * 2 
            : 0.1;
        this.body.position.set(
            position.x,
            position.y - thickness / 2,
            position.z
        );
    }

    public destroy(): void {
        if (this.body && this.body.world) {
            this.body.world.removeBody(this.body);
        }
    }
}

