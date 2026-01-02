import { GraphicsHandler } from "Libs/Toolbox/GraphicsHandler";
import { TimeHandler } from "Libs/Toolbox/TimeHandler";
import {
    Camera,
    DoubleSide,
    DynamicDrawUsage,
    InstancedMesh,
    Material,
    MathUtils,
    Matrix4,
    MeshBasicMaterial,
    PlaneGeometry,
    Quaternion,
    Scene,
    Texture,
    Vector3,
    Vector3Like,
    WebGLRenderer,
} from "three";

interface IRange {
    min: number;
    max: number;
}

interface IRangeVector3 {
    min: Vector3Like;
    max: Vector3Like;
}

interface IRangeSpherical {
    theta: IRange;
    phi: IRange;
    magnitude: IRange;
}

interface IParticle {
    id: number;
    matrix: Matrix4;

    lifeTime: number;
    lifeTimeVelocity: number;

    position: Vector3;
    rotation: number;
    scale: Vector3;
    scaleOverTime: number[];

    opacity: number;
    opacityOverTime: number[];

    velocity: Vector3;
    angularVelocity: number;
}

interface IEmitterOptions {
    count: number;
    lifeTimeRange: IRange;

    position: Vector3Like;
    positionRange: IRangeVector3;
    rotationRange: IRange;
    scaleOverTime: IRange[];
    opacityOverTime: number[];

    velocityRange: IRangeSpherical;
    angularVelocityRange: IRange;
}

interface IOptions {
    texture: Texture;
    gravity: Vector3Like;
    isTimeScaled: boolean;
    emitters: IEmitterOptions[];
}

export class FXSimpleParticleSystem3D {
    private mesh: InstancedMesh;
    private particles: IParticle[] = [];
    private gravity: Vector3 = new Vector3();
    private readonly isTimeScaled: boolean;

    public constructor(options: IOptions) {
        const width = options.texture.image.naturalWidth;
        const height = options.texture.image.naturalHeight;

        if (!width || !height) {
            throw new Error("Invalid texture dimensions");
        }

        this.gravity.copy(options.gravity);
        this.isTimeScaled = options.isTimeScaled;
        const count = options.emitters.reduce((a, e) => a + e.count, 0);

        const aspect = width / height;
        const geometry = new PlaneGeometry(1 * aspect, 1);

        const material = new MeshBasicMaterial({
            map: options.texture,
            transparent: true,
            depthWrite: false,
            side: DoubleSide,
        });

        this.mesh = new InstancedMesh(geometry, material, count);
        this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        this.mesh.frustumCulled = false;
        GraphicsHandler.instance.scene.add(this.mesh);
        this.mesh.onBeforeRender = this.onBeforeRender.bind(this);

        let fromID = 0;
        for (const emitter of options.emitters) {
            const nextID = fromID + emitter.count;
            this.buildEmitter(emitter, { min: fromID, max: nextID });
            fromID = nextID;
        }

        TimeHandler.instance.on(TimeHandler.Event.tick, this.onTick, this);
    }

    public destroy() {
        TimeHandler.instance.off(TimeHandler.Event.tick, this.onTick, this);
        this.mesh.geometry.dispose();
        (this.mesh.material as Material).dispose();
        GraphicsHandler.instance.scene.remove(this.mesh);
    }

    private buildEmitter(emitter: IEmitterOptions, range: IRange) {
        for (let i = range.min; i < range.max; i++) {
            const theta = MathUtils.randFloat(
                emitter.velocityRange.theta.min,
                emitter.velocityRange.theta.max,
            );
            const phi = MathUtils.randFloat(
                emitter.velocityRange.phi.min,
                emitter.velocityRange.phi.max,
            );
            const magnitude = MathUtils.randFloat(
                emitter.velocityRange.magnitude.min,
                emitter.velocityRange.magnitude.max,
            );

            const velocity = new Vector3().setFromSphericalCoords(
                magnitude,
                phi,
                theta,
            );

            const position = new Vector3(
                emitter.position.x +
                MathUtils.randFloat(
                    emitter.positionRange.min.x,
                    emitter.positionRange.max.x,
                ),
                emitter.position.y +
                MathUtils.randFloat(
                    emitter.positionRange.min.y,
                    emitter.positionRange.max.y,
                ),
                emitter.position.z +
                MathUtils.randFloat(
                    emitter.positionRange.min.z,
                    emitter.positionRange.max.z,
                ),
            );

            const lifeTime = MathUtils.randFloat(
                emitter.lifeTimeRange.min,
                emitter.lifeTimeRange.max,
            );

            const rotation = MathUtils.randFloat(
                emitter.rotationRange.min,
                emitter.rotationRange.max,
            );

            const scaleOverTime = emitter.scaleOverTime.map((range: IRange) =>
                MathUtils.randFloat(range.min, range.max),
            );

            const scaleFactor = this.lerpLifeTimeNumber(0, scaleOverTime);
            const scale = new Vector3(scaleFactor, scaleFactor, scaleFactor);

            const angularVelocity = MathUtils.randFloat(
                emitter.angularVelocityRange.min,
                emitter.angularVelocityRange.max,
            );

            const opacity = this.lerpLifeTimeNumber(0, emitter.opacityOverTime);

            const particle: IParticle = {
                id: i,
                matrix: new Matrix4(),

                lifeTime: 0,
                lifeTimeVelocity: 1 / lifeTime,

                position,
                rotation,

                scale,
                scaleOverTime,

                opacity,
                opacityOverTime: emitter.opacityOverTime,

                velocity,
                angularVelocity,
            };

            this.particles.push(particle);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
    }

    private removeParticle(particle: IParticle) {
        const index = this.particles.indexOf(particle);
        if (index === -1) {
            throw new Error("Element not found");
        }

        this.particles.splice(index, 1);

        for (let i = index; i < this.particles.length; i++) {
            const element = this.particles[i];
            if (!element) {
                throw new Error("Element not found");
            }
            element.id--;
        }

        this.mesh.count -= 1;
    }

    private lerpLifeTimeNumber(lifeTime: number, array: number[]): number {
        const lastIndex = array.length - 1;
        const exactIndex = lastIndex * lifeTime;
        const floorIndex = Math.floor(exactIndex);
        const ceilIndex = Math.min(floorIndex + 1, lastIndex);

        const previous = array[floorIndex];
        const current = array[ceilIndex];

        if (previous == null || current == null) {
            throw new Error(
                `Invalid array index (lifeTime: ${lifeTime}, array length: ${array.length})`,
            );
        }

        return MathUtils.lerp(previous, current, exactIndex - floorIndex);
    }

    private onBeforeRender(
        renderer: WebGLRenderer,
        scene: Scene,
        camera: Camera,
    ) {
        const up = new Vector3(0, 1, 0);
        const target = new Vector3();
        const rotationMatrix = new Matrix4();
        const finalMatrix = new Matrix4();
        const quaternion = new Quaternion();
        const quaternion2 = new Quaternion();

        camera.getWorldPosition(target);

        for (const particle of this.particles) {
            const direction = new Vector3()
                .subVectors(target, particle.position)
                .normalize();
            quaternion2.setFromAxisAngle(direction, particle.rotation);
            up.set(0, 1, 0);
            up.applyQuaternion(quaternion2);

            rotationMatrix.lookAt(particle.position, target, up);
            quaternion.setFromRotationMatrix(rotationMatrix);

            finalMatrix.compose(particle.position, quaternion, particle.scale);
            this.mesh.setMatrixAt(particle.id, finalMatrix);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
    }

    private onTick(_: number) {
        const deltaTime = this.isTimeScaled
            ? TimeHandler.instance.deltaTime
            : TimeHandler.instance.rawDeltaTime;

        const removedParticles: IParticle[] = [];

        for (const particle of this.particles) {
            particle.lifeTime += particle.lifeTimeVelocity * deltaTime;

            if (particle.lifeTime > 1) {
                removedParticles.push(particle);
            } else {
                particle.velocity.addScaledVector(this.gravity, deltaTime);
                particle.position.addScaledVector(particle.velocity, deltaTime);

                particle.rotation += particle.angularVelocity * deltaTime;

                const scale = this.lerpLifeTimeNumber(
                    particle.lifeTime,
                    particle.scaleOverTime,
                );

                particle.scale.set(scale, scale, scale);

                particle.opacity = this.lerpLifeTimeNumber(
                    particle.lifeTime,
                    particle.opacityOverTime,
                );
            }
        }

        for (const particle of removedParticles) {
            this.removeParticle(particle);
        }
    }
}
