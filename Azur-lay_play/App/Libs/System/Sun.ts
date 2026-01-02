import * as THREE from "three";

export class Sun extends THREE.DirectionalLight {
  private tempVector3D_0 = new THREE.Vector3();
  private tempVector3D_1 = new THREE.Vector3();
  private tempVector3D_2 = new THREE.Vector3();
  private tempVector3D_3 = new THREE.Vector3();
  private tempVector3D_4 = new THREE.Vector3();
  private tempVector3D_5 = new THREE.Vector3();
  private tempVector3D_6 = new THREE.Vector3();
  private tempVector3D_7 = new THREE.Vector3();

  private tempBox3 = new THREE.Box3();
  private tempSpherical = new THREE.Spherical();

  public setShadowMapFromBox3(box3: THREE.Box3): void {
    const camera = this.shadow.camera;

    this.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const points: THREE.Vector3[] = [
      this.tempVector3D_0.set(box3.min.x, box3.min.y, box3.min.z),
      this.tempVector3D_1.set(box3.min.x, box3.min.y, box3.max.z),
      this.tempVector3D_2.set(box3.min.x, box3.max.y, box3.min.z),
      this.tempVector3D_3.set(box3.min.x, box3.max.y, box3.max.z),
      this.tempVector3D_4.set(box3.max.x, box3.min.y, box3.min.z),
      this.tempVector3D_5.set(box3.max.x, box3.min.y, box3.max.z),
      this.tempVector3D_6.set(box3.max.x, box3.max.y, box3.min.z),
      this.tempVector3D_7.set(box3.max.x, box3.max.y, box3.max.z),
    ];

    for (const p of points) {
      p.applyMatrix4(camera.matrixWorldInverse);
    }

    const newBox3 = this.tempBox3.setFromPoints(points);

    camera.left = newBox3.min.x;
    camera.bottom = newBox3.min.y;
    camera.near = -newBox3.max.z;

    camera.right = newBox3.max.x;
    camera.top = newBox3.max.y;
    camera.far = -newBox3.min.z;

    camera.updateProjectionMatrix();
  }

  public setDirectionFromHDR(texture: THREE.Texture, distance: number = 1) {
    const data = texture.image.data;
    const width = texture.image.width;
    const height = texture.image.height;

    let maxLuminance = 0;
    let maxIndex = 0;

    const step = texture.format === THREE.RGBAFormat ? 4 : 3;
    for (let i = 0; i < data.length; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (luminance > maxLuminance) {
        maxLuminance = luminance;
        maxIndex = i;
      }
    }

    const pixelIndex = maxIndex / step;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    const u = x / width;
    const v = y / height;

    const elevation = v * Math.PI;
    const azimuth = u * -Math.PI2 - Math.PIH;

    this.position.setFromSphericalCoords(distance, elevation, azimuth);
  }

  public get distance() {
    return this.position.length();
  }

  public set distance(value: number) {
    this.tempSpherical.setFromVector3(this.position);
    this.position.setFromSphericalCoords(
      value,
      this.tempSpherical.phi,
      this.tempSpherical.theta,
    );
  }

  public get elevation() {
    return this.tempSpherical.setFromVector3(this.position).phi;
  }

  public set elevation(value) {
    this.tempSpherical.setFromVector3(this.position);
    this.position.setFromSphericalCoords(
      this.tempSpherical.radius,
      value,
      this.tempSpherical.theta,
    );
  }

  public get azimuth() {
    return this.tempSpherical.setFromVector3(this.position).theta;
  }

  public set azimuth(value) {
    this.tempSpherical.setFromVector3(this.position);
    this.position.setFromSphericalCoords(
      this.tempSpherical.radius,
      this.tempSpherical.phi,
      value,
    );
  }
}
