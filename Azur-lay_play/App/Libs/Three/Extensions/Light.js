import * as THREE from "three";

const __extension_temp_vector_3d = new THREE.Vector3();
const __extension_temp_spherical = new THREE.Spherical();

// Object.assign(THREE.DirectionalLight.prototype, {
//   setShadowMapFromBox3: function (box3) {
//     const camera = this.shadow.camera;

//     this.updateMatrixWorld();
//     camera.position.copy(this.position);
//     camera.updateMatrixWorld();

//     __extension_temp_vector_3d.set(0, 0, 0);

//     if (this.target) {
//       this.target.getWorldPosition(__extension_temp_vector_3d);
//     }

//     camera.lookAt(__extension_temp_vector_3d);
//     camera.updateMatrixWorld();

//     const points = [
//       new THREE.Vector3(box3.min.x, box3.min.y, box3.min.z),
//       new THREE.Vector3(box3.min.x, box3.min.y, box3.max.z),
//       new THREE.Vector3(box3.min.x, box3.max.y, box3.min.z),
//       new THREE.Vector3(box3.min.x, box3.max.y, box3.max.z),
//       new THREE.Vector3(box3.max.x, box3.min.y, box3.min.z),
//       new THREE.Vector3(box3.max.x, box3.min.y, box3.max.z),
//       new THREE.Vector3(box3.max.x, box3.max.y, box3.min.z),
//       new THREE.Vector3(box3.max.x, box3.max.y, box3.max.z),
//     ];

//     const transformedPoints = points.map((point) => {
//       const transformedPoint = point.clone();
//       transformedPoint.applyMatrix4(camera.matrixWorldInverse);
//       return transformedPoint;
//     });

//     let [left, right, top, bottom, near, far] = [
//       Infinity,
//       -Infinity,
//       -Infinity,
//       Infinity,
//       Infinity,
//       -Infinity,
//     ];

//     transformedPoints.forEach((p) => {
//       left = Math.min(left, p.x);
//       right = Math.max(right, p.x);
//       top = Math.max(top, p.y);
//       bottom = Math.min(bottom, p.y);
//       near = Math.min(near, -p.z);
//       far = Math.max(far, -p.z);
//     });

//     Object.assign(camera, { left, right, top, bottom });

//     const offset = 1 - near;
//     this.distance += offset;

//     Object.assign(camera, { near: near + offset, far: far + offset });

//     Object.entries({
//       left,
//       right,
//       top,
//       bottom,
//       near: camera.near,
//       far: camera.far,
//     }).forEach(([key, value]) => {
//       if (isNaN(value)) console.warn(`Warning: Camera bound '${key}' is NaN.`);
//     });
//   },
// });

// Object.assign(THREE.DirectionalLight.prototype, {
//   setDirectionFromHDR: function (texture, distance = 1) {
//     const data = texture.image.data;
//     const width = texture.image.width;
//     const height = texture.image.height;

//     let maxLuminance = 0;
//     let maxIndex = 0;

//     const step = texture.format === THREE.RGBAFormat ? 4 : 3;
//     for (let i = 0; i < data.length; i += step) {
//       const r = data[i];
//       const g = data[i + 1];
//       const b = data[i + 2];
//       const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
//       if (luminance > maxLuminance) {
//         maxLuminance = luminance;
//         maxIndex = i;
//       }
//     }

//     const pixelIndex = maxIndex / step;
//     const x = pixelIndex % width;
//     const y = Math.floor(pixelIndex / width);

//     const u = x / width;
//     const v = y / height;

//     const elevation = v * Math.PI;
//     const azimuth = u * -Math.PI2 - Math.PIH;

//     this.position.setFromSphericalCoords(distance, elevation, azimuth);
//   },
// });

// Object.defineProperty(THREE.DirectionalLight.prototype, "distance", {
//   get: function () {
//     return this.position.length();
//   },
//   set: function (value) {
//     __extension_temp_spherical.setFromVector3(this.position);
//     this.position.setFromSphericalCoords(
//       value,
//       __extension_temp_spherical.phi,
//       __extension_temp_spherical.theta,
//     );
//   },
// });

// Object.defineProperty(THREE.DirectionalLight.prototype, "elevation", {
//   get: function () {
//     return __extension_temp_spherical.setFromVector3(this.position).phi;
//   },
//   set: function (value) {
//     __extension_temp_spherical.setFromVector3(this.position);
//     this.position.setFromSphericalCoords(
//       __extension_temp_spherical.radius,
//       value,
//       __extension_temp_spherical.theta,
//     );
//   },
// });

// Object.defineProperty(THREE.DirectionalLight.prototype, "azimuth", {
//   get: function () {
//     return __extension_temp_spherical.setFromVector3(this.position).theta;
//   },
//   set: function (value) {
//     __extension_temp_spherical.setFromVector3(this.position);
//     this.position.setFromSphericalCoords(
//       __extension_temp_spherical.radius,
//       __extension_temp_spherical.phi,
//       value,
//     );
//   },
// });

Object.assign(THREE.HemisphereLight.prototype, {
  setFromHDR: function (texture, intensity = 1) {
    const img = texture.image;
    const width = img.width;
    const height = img.height;
    const data = img.data;
    const isHDR = texture.type === THREE.FloatType;
    const format = texture.format;
    const step = format === THREE.RGBAFormat ? 4 : 3;

    let skySum = new THREE.Vector3(0, 0, 0);
    let groundSum = new THREE.Vector3(0, 0, 0);
    let skyCount = 0;
    let groundCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const v = y / height;
        const i = (y * width + x) * step;

        const r = isHDR ? data[i] : Math.pow(data[i] / 255, 2.2);
        const g = isHDR ? data[i + 1] : Math.pow(data[i + 1] / 255, 2.2);
        const b = isHDR ? data[i + 2] : Math.pow(data[i + 2] / 255, 2.2);

        const theta = Math.PI * (0.5 - (y + 0.5) / height);
        const weight = Math.sin(theta);

        if (v < 0.25) {
          groundSum.x += r * weight;
          groundSum.y += g * weight;
          groundSum.z += b * weight;
          groundCount += weight;
        } else if (v > 0.75) {
          skySum.x += r * weight;
          skySum.y += g * weight;
          skySum.z += b * weight;
          skyCount += weight;
        }
      }
    }

    const skyColor = new THREE.Color(
      skySum.x / skyCount,
      skySum.y / skyCount,
      skySum.z / skyCount,
    );

    const groundColor = new THREE.Color(
      groundSum.x / groundCount,
      groundSum.y / groundCount,
      groundSum.z / groundCount,
    );

    this.color.set(skyColor);
    this.groundColor.set(groundColor);
    this.intensity = intensity;
  },
});
