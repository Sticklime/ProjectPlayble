import Class from "Class";
import Screen from "Screen";

import ThreeText from "../Three/ThreeText";

Class.mixin(Screen, {
  SpecialThreeParams: [
    "name",
    "type",
    "scaleStrategy",
    "event",
    "button",
    "text",
    "color",
    "size",
    "position",
    "rotation",
    "scale",
    "data",
    "material",
    "geometry",
  ],

  initialize() {
    this.threeTextures = {};
    this.threeBaseTextures = {};

    this.animationModels = [];

    //Вызывается только для Game.Engine === 'Three'
    //Здесь мы создаём всё что в Containers через Three
    this.on(
      "before build",
      () => {
        this.each(this.Containers, (container_params) => {
          //if (!container_params.position && container_params.type !== 'dom-container') container_params.position = ['width/2', 'height/2'];
          //if (!container_params.scale) container_params.scale = 'scale';
          if (!container_params.type) container_params.type = "container";

          if (
            container_params.type === "container" ||
            container_params.type === "three-ui"
          ) {
            let scene =
              container_params.type === "container"
                ? App.World.Scene
                : App.World.ThreeGUI;

            let container = this.buildThreeChild(scene, container_params);

            this._containers.push(container);

            container.visible = false;

            if (container_params.childs)
              this.buildThreeChilds(container_params.childs, container);
          }
        });
      },
      "Screen.Three",
    );

    this.on(
      "update",
      () => {
        this.updateThreeChilds();
      },
      "Screen.Three",
    );

    this.on(
      "resize",
      () => {
        this.resizeThree();
      },
      "Screen.Three",
    );
  },

  buildThreeChilds: function (childs, container) {
    this.each(childs, function (child_params) {
      const child = this.buildThreeChild(container, child_params);

      if (child_params.childs)
        this.buildThreeChilds(child_params.childs, child);
    });
  },

  buildThreeChild: function (container, child_params, options = {}) {
    let child;

    MRAID.processDynamicProperties(child_params);

    if (
      child_params.type === "three-group" ||
      child_params.type === "container" ||
      child_params.type === "emitter" ||
      !child_params.type
    ) {
      if (!child_params.type) child_params.type = "container";

      child = new THREE.Group();
    } else if (child_params.type === "three-directional-light") {
      child = new THREE.DirectionalLight(
        child_params.color,
        child_params.intensity,
      );
    } else if (child_params.type === "three-ambient-light") {
      child = new THREE.AmbientLight(
        child_params.color,
        child_params.intensity,
      );
    } else if (child_params.type === "three-point-light") {
      child = new THREE.PointLight(child_params.color, child_params.intensity);
    } else if (child_params.type === "three-spot-light") {
      child = new THREE.SpotLight(child_params.color, child_params.intensity);
    } else if (child_params.type === "three-mesh") {
      const geometry = child_params.geometry;
      const material = this.parseMaterial(child_params.material);

      child = new THREE.Mesh(geometry, material);
    } else if (child_params.type === "three-sphere") {
      const geometry = new THREE.SphereGeometry(
        child_params.size,
        child_params.widthSegments,
        child_params.heightSegments,
      );
      const material = this.parseMaterial(child_params.material);

      child = new THREE.Mesh(geometry, material);
    } else if (child_params.type === "three-box") {
      const geometry = new THREE.BoxBufferGeometry(
        child_params.size[0],
        child_params.size[1],
        child_params.size[2],
      );
      const material = this.parseMaterial(child_params.material);

      child = new THREE.Mesh(geometry, material);

      if (child_params.text) {
        child_params.text.resolution = child_params.text.resolution || 256;

        const dynamicTexture = new THREEx.DynamicTexture(
          child_params.text.resolution,
          child_params.text.resolution,
        );
        dynamicTexture.context.font = child_params.text.font;
        dynamicTexture.texture.anisotropy =
          App.World.Renderer.capabilities.getMaxAnisotropy();

        material.map = dynamicTexture.texture;

        child.dynamicTexture = dynamicTexture;
      }

      if (child_params.texture) {
        var sideTextures = child_params.texture;

        for (var i = 0; sideTextures[i]; i++) {
          if (sideTextures[i].map)
            sideTextures[i].map = App.ThreeAssets[sideTextures[i].map];

          sideTextures[i] = new THREE.MeshBasicMaterial(sideTextures[i]);
        }

        child.material = sideTextures;
      }
    } else if (child_params.type === "three-plane") {
      const material = this.parseMaterial(child_params.material);

      if (child_params.material && child_params.material.map) {
        if (!child_params.size) {
          child_params.size = [];
          child_params.size[0] = material.map.image.width;
          child_params.size[1] = material.map.image.height;
        }
      }

      if (!child_params.size) child_params.size = [100, 100];

      const geometry = new THREE.PlaneGeometry(
        child_params.size[0],
        child_params.size[1],
      );
      child = new THREE.Mesh(geometry, material);
    } else if (child_params.type === "three-circle") {
      if (!child_params.radius) child_params.radius = 100;
      if (!child_params.segments) child_params.segments = 32;
      if (!child_params.thetaStart) child_params.thetaStart = 0;
      if (!child_params.thetaLength) child_params.thetaLength = 2 * Math.PI;

      const geometry = new THREE.CircleGeometry(
        child_params.radius,
        child_params.segments,
        child_params.thetaStart,
        child_params.thetaLength,
      );
      const material = this.parseMaterial(child_params.material);

      child = new THREE.Mesh(geometry, material);
    } else if (child_params.type === "three-plane-buffer") {
      if (!child_params.size) child_params.size = [100, 100];

      const geometry = new THREE.PlaneGeometry(
        child_params.size[0],
        child_params.size[1],
      );
      const material = this.parseMaterial(child_params.material);

      child = new THREE.Mesh(geometry, material);
    } else if (child_params.type === "three-image") {
      let map = null;
      let repeatX = 1,
        repeatY = 1,
        offsetX = 0,
        offsetY = 0;

      if (child_params.image) {
        map = this.getThreeTexture(child_params.image);
      } else if (child_params.material && child_params.material.map) {
        map = this.getThreeTexture(child_params.material.map);
      }

      // Параметр part для возможности использования половинчатых и четвертичных симметричных изображений, чтобы экономить место.
      // Например, нам нужна картинка в виде круга и для этого достаточно вырезать в ФШ и сохранить только его четвертинку (или половинку),
      // а отзеркалить уже нижним кодом, указав в параметре part какая именно часть круга находится на сохранённом изображении.
      // part = L | R | T | B или их комбинации LT | LB | RT | RB
      if (child_params.part && map) {
        if (/L/i.test(child_params.part)) {
          map.wrapS = THREE.MirroredRepeatWrapping;
          repeatX = 2;
          offsetX = 0;
        } else if (/R/i.test(child_params.part)) {
          map.wrapS = THREE.MirroredRepeatWrapping;
          repeatX = 2;
          offsetX = -1;
        }
        if (/T/i.test(child_params.part)) {
          map.wrapT = THREE.MirroredRepeatWrapping;
          repeatY = 2;
          offsetY = 1;
        } else if (/B/i.test(child_params.part)) {
          map.wrapT = THREE.MirroredRepeatWrapping;
          repeatY = 2;
          offsetY = 0;
        }
      }

      if (!child_params.size) {
        if (map) {
          if (map.trim) {
            child_params.size = [map.trim.width, map.trim.height];
          } else if (map.orig) {
            child_params.size = [map.orig.width, map.orig.height];
          } else {
            child_params.size = [map.image.width, map.image.height];
          }
          child_params.size[0] *= repeatX;
          child_params.size[1] *= repeatY;
        } else {
          child_params.size = [100, 100];
        }
      }

      const geometry = new THREE.PlaneGeometry(
        child_params.size[0],
        child_params.size[1],
      );

      let mat = child_params.material || {};

      if (!mat.hasOwnProperty("transparent"))
        mat.transparent =
          child_params.transparent !== undefined
            ? child_params.transparent
            : map
              ? map.format === THREE.RGBAFormat
              : false;
      if (!mat.hasOwnProperty("opacity"))
        mat.opacity =
          child_params.opacity !== undefined ? child_params.opacity : 1;
      if (!mat.hasOwnProperty("type")) mat.type = "MeshBasicMaterial";
      if (!mat.hasOwnProperty("color"))
        mat.color =
          child_params.color !== undefined ? child_params.color : "#ffffff";

      let material = this.parseMaterial(mat);

      if (!mat.hasOwnProperty("map")) material.map = map;

      if (material.map) {
        material.map.repeat.set(repeatX, repeatY);
        material.map.offset.set(offsetX, offsetY);
      }

      if (child_params.anchor) {
        const verts = geometry.attributes.position;
        const _w = child_params.size[0];
        const _h = child_params.size[1];

        let leftX = -_w * child_params.anchor[0];
        let rightX = leftX + _w;
        let topY = _h * child_params.anchor[1] - _h;
        let bottomY = topY + _h;

        verts.setXY(0, leftX, bottomY);
        verts.setXY(1, rightX, bottomY);
        verts.setXY(2, leftX, topY);
        verts.setXY(3, rightX, topY);

        verts.needsUpdate = true;
      }

      child = new THREE.Mesh(geometry, material);
    } else if (child_params.type === "three-animation-fbx") {
      if (child_params.clone === false)
        child = App.ThreeAssets[child_params.data];
      else child = this.cloneModel(App.ThreeAssets[child_params.data]);

      child.mixer = new THREE.AnimationMixer(child);

      this.animationModels.push(child);
    } else if (child_params.type === "three-animation-glb") {
      if (child_params.clone === false)
        child = App.ThreeAssets[child_params.data].scene.children[0];
      else
        child = this.cloneModel(
          App.ThreeAssets[child_params.data].scene.children[0],
        );

      child.animations = App.ThreeAssets[child_params.data].animations;

      child.mixer = new THREE.AnimationMixer(child);

      this.animationModels.push(child);
    } else if (child_params.type === "three-model-fbx") {
      if (child_params.clone === false)
        child = App.ThreeAssets[child_params.data];
      else child = this.cloneModel(App.ThreeAssets[child_params.data]);
    } else if (child_params.type === "three-model-glb") {
      if (child_params.clone === false)
        child = App.ThreeAssets[child_params.data].scene.children[0];
      else
        child = this.cloneModel(
          App.ThreeAssets[child_params.data].scene.children[0],
        );
    } else if (child_params.type === "three-sprite") {
      const material = this.parseMaterial(child_params.material);

      child = new THREE.Sprite(material);
    } else if (child_params.type === "three-text") {
      let options = this.getMessage(child_params.text, child_params.noWarnings);

      if (!child_params.styles) child_params.styles = {};

      for (let key in options) {
        child_params.styles[key] = options[key];
      }

      child = new ThreeText(options.text || options, child_params);
    } else if (child_params.type === "three-ui") {
      child = App.World.ThreeGUI.createContainer(child_params.name);
    }

    if (child_params.name) {
      (options.linkTo || this)[child_params.name] = child;

      child.name = child_params.name;
    }

    if (container) {
      if (container.isGUI) child.isGUI = true;

      container.add(child);
    }

    if (child.name) this._childs.push(child);

    this.call("build child", [child, child_params]);

    this.applyThreeParams(child, child_params);

    {
      // ================================================================ Events
      let event_params = child_params.event || child_params.button;

      if (event_params && App.World.events) {
        if (event_params === true) event_params = { name: child_params.name };
        else if (_.isString(event_params))
          event_params = { name: event_params };

        if (child_params.button) event_params.button = true;

        if (!event_params.name) event_params.name = child_params.name;

        this.enableThreeEvents(child, event_params);

        if (event_params.button) {
          //TODO: child.defaultCursor = 'pointer';
          //child.buttonMode = true;
        }
      }
    }

    return child;
  },

  getThreeTexture(value) {
    if (this.threeTextures[value]) return this.threeTextures[value];

    if (this.App.ThreeAssets[value]) return App.ThreeAssets[value];
    else if (App.ThreeTextureCache[value]) return App.ThreeTextureCache[value];
  },

  getThreeBaseTexture(value) {
    if (this.threeBaseTextures[value]) return this.threeBaseTextures[value];

    const texture = this.getTexture(value);

    if (!texture) return null;

    this.threeBaseTextures[value] = new THREE.Texture(
      App.Renderer.plugins.extract.image(new PIXI.Sprite(texture)),
    );

    this.threeBaseTextures[value].minFilter = THREE.LinearFilter;

    return this.threeBaseTextures[value];
  },

  applyThreeParams(child, params) {
    if (_.isString(child)) child = this[child];

    MRAID.processDynamicProperties(params);

    this.each(params, function (param_value, param_name) {
      //Except custom values
      if (this.SpecialThreeParams.includes(param_name)) return;

      //Except orientation values
      if (
        param_name.indexOf("Landscape") > 0 ||
        param_name.indexOf("Portrait") > 0
      )
        return;

      //Apply other values
      child[param_name] = this.calculate(param_value);
    });

    if (params.position)
      child.position.set(
        params.position[0],
        params.position[1],
        params.position[2] !== undefined
          ? params.position[2]
          : child.position.z,
      );

    if (Array.isArray(params.scale))
      child.scale.set(
        params.scale[0] || child.scale.x,
        params.scale[1] || child.scale.y,
        params.scale[2] !== undefined ? params.scale[2] : child.scale.z,
      );
    else if (typeof params.scale === "number")
      child.scale.set(params.scale, params.scale, params.scale);

    if ("cameraScaling" in params) {
      let scale = this.getScaleByStrategy(params.cameraScaling) || 1;

      App.World.Camera.fov = Math.min(45 / scale, 100);

      App.World.Camera.updateProjectionMatrix();
    }

    if (params.rotation) {
      if (Array.isArray(params.rotation))
        child.rotation.set(
          params.rotation[0],
          params.rotation[1],
          params.rotation[2],
        );
      else if (typeof params.rotation === "number")
        child.rotation.z = params.rotation;
    }

    if (params.text && params.type !== "three-text") {
      params.text.message = params.text.text;

      child.dynamicTexture
        .clear("#ffffff")
        .drawText(
          params.text.text,
          params.text.position ? params.text.position[0] : null,
          params.text.position
            ? params.text.position[1]
            : params.text.resolution / 2,
          params.text.color,
        );
    }

    if (params.type === "three-text") {
      let codename = params.text;
      let no_warnings = params.noWarnings;

      let styles = this.getMessage(codename, no_warnings, child);

      if (_.isString(styles)) styles = { text: styles };

      let sprite_params_styles = child.params.styles;

      styles = _.extend({}, sprite_params_styles, styles);

      child.text = codename;

      styles = this.translateTextStyles(styles);

      MRAID.processDynamicProperties(styles);

      _.extend(child.style, styles);

      if (typeof styles.text === "string" || typeof styles.text === "number")
        child.text = styles.text;

      child.updateText();
    }

    child.params = params;

    if (params.text && params.text.message)
      this.setText(child, params.text.message);
  },

  enableThreeEvents(sprite, event_params) {
    sprite._screen_name = this.Name;

    if (sprite.isGUI && App.World.ThreeGUI) {
      App.World.ThreeGUI.addEvent(
        sprite,
        event_params.name,
        this.Name,
        event_params.collider,
        event_params.points,
      );
    } else {
      App.World.EventsObjects.push(sprite);
    }
  },

  updateThreeChilds() {
    if (!App.World || !App.World.Renderer) return;

    if (App.Engine === "Pixi" && !this.ThreeSprite) return;

    if (this.ThreeSprite) this.ThreeSprite.texture.update();

    // Если поставить перед рендером появляются артефакты
    _.each(this.animationModels, (child) => {
      child.mixer.update(this.updateTimeOffset / 1000);
    });
  },

  //Этот метод ресайза только для Three встроенного в Pixi приложение
  resizeThree() {
    if (this.ThreeSprite) this.ThreeSprite.texture.update();
  },

  cloneModel(model) {
    const clone = model.clone(true);
    clone.animations = model.animations;
    clone.skeleton = new THREE.Skeleton();

    const skinnedMeshes = {};

    model.traverse((node) => {
      if (node.isSkinnedMesh) skinnedMeshes[node.name] = node;
    });

    const cloneBones = {};
    const cloneSkinnedMeshes = {};

    clone.traverse((node) => {
      if (node.isBone) cloneBones[node.name] = node;

      if (node.isSkinnedMesh) cloneSkinnedMeshes[node.name] = node;

      if (node.isMesh && node.material) {
        if (Array.isArray(node.material))
          node.material = node.material.map((material) => material.clone());
        else node.material = node.material.clone();
      }
    });

    for (let name in skinnedMeshes) {
      const skinnedMesh = skinnedMeshes[name];
      const skeleton = skinnedMesh.skeleton;
      const cloneSkinnedMesh = cloneSkinnedMeshes[name];

      const orderedCloneBones = [];

      for (let i = 0; i < skeleton.bones.length; i++) {
        const cloneBone = cloneBones[skeleton.bones[i].name];
        orderedCloneBones.push(cloneBone);
      }

      cloneSkinnedMesh.bind(
        new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
        cloneSkinnedMesh.matrixWorld,
      );

      // For animation to work correctly:
      clone.skeleton.bones.push(cloneSkinnedMesh);
      clone.skeleton.bones.push(...orderedCloneBones);
    }

    model.traverse((node) => {
      if (node.bindMatrix)
        clone.getObjectByName(node.name, true).bindMatrix =
          node.bindMatrix.clone();
      if (node.bindMatrixInverse)
        clone.getObjectByName(node.name, true).bindMatrixInverse =
          node.bindMatrixInverse.clone();
    });

    return clone;
  },

  parseMaterial(options) {
    if (!options || options.isMaterial || Array.isArray(options))
      return options;

    const name = options.name || "MeshBasicMaterial";
    delete options.name;

    const handlers = {
      map: (value) => this.getThreeTexture(value),
      alphaMap: (value) => this.getThreeTexture(value),
      color: (value) =>
        new THREE.Color(
          typeof value === "number"
            ? value
            : parseInt(value.replace("#", "0x"), 16),
        ),
    };

    for (let key in handlers) {
      if (options[key]) options[key] = handlers[key](options[key]);
    }

    const material = new THREE[name.trim()]();

    Object.assign(material, options);

    if (material.map) {
      material.map.offset.set(0, 0);
      material.map.repeat.set(1, 1);
    }

    return material;
  },

  normalizeColor(value) {
    return typeof value === "number"
      ? value
      : parseInt(value.replace("#", "0x"), 16);
  },

  playSound(name, options = {}, next = null) {
    if (window.MraidSDK) MraidSDK.playSound(name, options);
    else return App._playSound.apply(this, [name, options, next]);
  },

  stopSound(name) {
    return App._stopSound.apply(this, [name]);
  },

  bringToTop() {
    if (App.World.ThreeGUI) {
      for (let c = 0; c < this.Containers.length; c++) {
        for (let i = 0; i < App.World.ThreeGUI.children.length; i++) {
          if (App.World.ThreeGUI.children[i].name === this.Containers[c].name) {
            App.World.ThreeGUI.add(App.World.ThreeGUI.children[i]);
            break;
          }
        }
      }

      App.World.ThreeGUI.updateOrder();
    }
  },
});
