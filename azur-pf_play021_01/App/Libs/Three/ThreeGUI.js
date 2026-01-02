import * as THREE from "three";

/**
 * Контейнер для реализации GUI в three.
 * Это Scene с ортогональной камерой, которая рендерится поверх основной.
 * Основа взята с этого примера: https://threejs.org/examples/#webgl_sprites
 *
 * Если у добаляемых в гуи объектов указывать в параметрах LTRB, stickiness, positionPortrait, positionLandscape,
 * то они будут позиционироваться на экране и липнуть к краям в соответствии с настройками:
 * LTRB - указывает к какому краю должен липнуть элемент. Может принимать значения 'L', 'T', 'R', 'B', '' (а также 'LT', 'RT' и т.д. для прилипания сразу к двум краям экрана)
 * stickiness - указывает насколько сильно будет липнуть элемент. Может быть 0..1. Если 0 - элемент будет оставаться на своём дефолтном месте, если 1 - элемент будет липнуть к соответствующим краям на 100%
 * positionPortrait, positionLandscape - дефолтные позици элементы от центра экрана. Массив из двух значений [x, y]. Вверх по Y идут отрицательные значения, по X всё как обычно (слева минус, справа +). Если значение позиции < 1, то оно становится множителем и позиция вычисляется, как @половина_экрана * значение
 *
 * Чтобы всё заработало, нужно создать новый объект через new (обычно в 'Gameplay build'):
 * this.ThreeGUI = new THREE.ThreeGUI(App, { sizeLandscape: [1920, 1080], sizePortrait: [1080, 1920] });
 *
 * добавить в 'Gameplay update'
 * if (this.ThreeGUI) this.ThreeGUI.update();
 *
 * добавить в 'Gameplay resize'
 * if (this.ThreeGUI) this.ThreeGUI.resize();
 *
 * новые объекты нужно добавлять через addChild, чтобы запускалась функция обновления сортировки. Или через add, но тогда запускать сортировку вручную
 * this.ThreeGUI.addChild(this.helpBubble1);
 */

// x: -ВЛЕВО, +ВПРАВО   y: +ВВЕРХ, -ВНИЗ    z: +ВПЕРЁД, -НАЗАД
//
//              Y+
//               |
//        Math.PI / 2 rad
//               |
// X- <-- 0 rad -+---------> X+
//               |
//               |
//              Y-

class ThreeGUI extends THREE.Scene {
  constructor(app, options) {
    super();

    this.TRANSLATE_Z = 0.1;
    this.RENDER_ORDER = 1000;
    this.MAX_Z = 100;

    this.sizePortrait = [1080, 1920];
    this.sizeLandscape = [1920, 1080];
    this.size = [1080, 1920];

    this.app = null;
    this.camera = null;
    this.scene = null;

    const create = () => {
      let params = {
        name: "ThreeGUI",
        sizeLandscape: [1920, 1080],
        sizePortrait: [1080, 1920],
      };
      Object.assign(params, options);

      this.sizePortrait = params.sizePortrait;
      this.sizeLandscape = params.sizeLandscape;

      this.app = app;
      App.World.Renderer.autoClear = false;

      this.Screens = {};
      this.Containers = {};
      this.EventsObjects = [];

      let width = App.Width / App.PixelRatio / 2;
      let height = App.Height / App.PixelRatio / 2;

      this.camera = new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        1,
        this.MAX_Z + 1,
      );
      this.camera.position.z = this.MAX_Z;

      App.World.CameraGUI = this.camera;

      this.params = params;
    };

    create();
  }

  addEvent(object, eventName, screenName, collider, size) {
    let points = [];

    if (!object.collider || (object.collider && collider)) {
      if (collider === "circle") {
        // if (typeof size === 'number') {
        //
        // }
      } else if (collider === "poly") {
        if (Array.isArray(size)) points = size.slice();
      }

      this.createCollider(object, points);
    }

    if (!object.params) object.params = {};
    object.params.event = eventName;

    if (!object._screen_name) object._screen_name = screenName;
    this.EventsObjects.push(object);

    if (!this.Screens[object._screen_name]) {
      // this.Screens[object._screen_name] = App[object._screen_name];
      this.Screens[object._screen_name] = {};
      this.Screens[object._screen_name].EventsObjects = [];
    }

    this.Screens[object._screen_name].EventsObjects.push(object);
  }

  checkChildEvents(object) {
    if (object.params && object.params.event) {
      object._screen_name = App.Name;
      this.EventsObjects.push(object);
    }

    if (object.children)
      object.children.forEach((child) => this.checkChildEvents(child));
  }
  registerChild = function (object) {
    this.updateOrder();
    this.updateChildPos();

    if (object && object.params) {
      if (object.params.event || object.params.button) {
        this.createCollider(object, []);
      }
    }
  };

  createCollider(object, points) {
    /*
		 +---------+
		 |0,0   1,0|
		 |         |
		 |0,1   1,1|
		 +---------+
	 */
    let defaultPoints = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    if (!object.collider) object.collider = {};

    if (!points.length) {
      object.collider.type = "rectangle";
      object.points = defaultPoints;
    }
  }
  eventHandler(event_type, e, position) {
    let vector = this.convertStageTouch(position);

    let overlapedObject = this.pointOverlap(vector);

    if (overlapedObject) {
      let event = overlapedObject.params && overlapedObject.params.event;

      if (event)
        Broadcast.call(
          overlapedObject._screen_name + " " + event + " " + event_type,
          [overlapedObject, e],
        );

      return true;
    }

    return false;
  }

  convertStageTouch(position) {
    let _pixelRatioX = App.World.Width / window.innerWidth;
    let _pixelRatioY = App.World.Height / window.innerHeight;

    if (!position.x && position.touches) {
      if (position.touches[0] && position.touches[0].clientX)
        position.x = position.touches[0].clientX;
    }
    if (!position.y && position.touches) {
      if (position.touches[0] && position.touches[0].clientY)
        position.y = position.touches[0].clientY;
    }

    position = {
      x: position.x - App.World.Width / _pixelRatioX / 2,
      y: position.y - App.World.Height / _pixelRatioY / 2,
    };

    let local_coords = { x: position.x, y: position.y };

    local_coords.x /= -App.World.Width / _pixelRatioX / 2;
    local_coords.y /= -App.World.Height / _pixelRatioY / 2;

    local_coords.x *= this.camera.left;
    local_coords.y *= this.camera.top;

    let vector = new THREE.Vector2();
    vector.set(local_coords.x, local_coords.y);

    return vector;
  }
  pointOverlap(point) {
    let objectsArr = [];

    for (let screen in this.Screens) {
      if (App[screen] && App[screen].showed) {
        for (let i = 0; i < this.Screens[screen].EventsObjects.length; i++) {
          let obj = this.Screens[screen].EventsObjects[i];

          let parent = obj;
          let isVisible = parent.visible;
          let _p = 0;

          while (parent) {
            if (!parent.visible) {
              isVisible = false;
              break;
            }
            parent = parent.parent;

            if (++_p > 10) break;
          }

          if (isVisible) objectsArr.push(obj);
        }
      }
    }

    let result = null;
    let id = 0;

    for (let i = 0; i < objectsArr.length; i++) {
      let obj = objectsArr[i];

      if (!obj.visible) continue;

      let bb = new THREE.Box3(
        { x: this.camera.left, y: this.camera.bottom, z: 0 },
        { x: this.camera.right, y: this.camera.top, z: 0 },
      );

      if (obj.geometry) {
        obj.geometry.computeBoundingBox();
        bb = obj.geometry.boundingBox.applyMatrix4(obj.matrixWorld);
      }

      if (bb.containsPoint({ x: point.x, y: point.y, z: bb.min.z })) {
        // TODO: сделать пересечение точки с набором вершин в points

        // if (!result || bb.min.z < (result.geometry ? result.geometry.boundingBox.min.z : this.camera.far)) {
        // 	result = obj;
        // }
        if (!result || obj.id > id) {
          result = obj;
        }
      }
    }

    return result;
  }

  createContainer(options = {}) {
    let params = {
      name:
        typeof options === "string"
          ? options
          : "" + Math.floor(1000 + Math.random() * 100000),
      type: "three-ui",
      childs: [],

      position: [0, 0, 0],
      rotation: 0,
      scale: [1, 1, 1],

      LTRB: "",
      stickiness: [1, 1],
    };
    if (typeof options !== "string") Object.assign(params, options);

    let container = new THREE.Group();

    container.isContainer = true;
    container.isGUI = true;

    container.params = params;

    container.params.childs = container.children;

    container.name = container.params.name;

    this.Containers[container.name] = container;

    let position = this.getParam(container.params, "position");
    container.position.set(position[0], position[1], 0);

    container.rotation.z = this.getParam(container.params, "rotation");

    let scale = this.getParam(container.params, "scale");
    container.scale.set(scale[0], scale[1], 1);

    // group.LTRB = this.getParam(group.params, 'LTRB');

    // group.stickiness = this.getParam(group.params, 'stickiness');

    this.add(container);

    this.updateOrder();
    this.updateChildPos();

    return container;
  }

  resizeRender() {
    App.calculateAppSize();

    let width = App.Width / App.PixelRatio / 2;
    let height = App.Height / App.PixelRatio / 2;

    let defW = App.IsPortrait ? this.sizePortrait[0] : this.sizeLandscape[0];
    let defH = App.IsPortrait ? this.sizePortrait[1] : this.sizeLandscape[1];

    let resizeScale = width / height / (defW / defH);

    width = resizeScale > 1 ? defW * resizeScale : defW;
    height = resizeScale < 1 ? defH / resizeScale : defH;

    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
  }

  getParam(obj, param, defVal) {
    if (!obj) return defVal;

    let val = null;
    let valPortrait = obj[param + "Portrait"];
    let valLandscape = obj[param + "Landscape"];
    let initX, initY;

    if (App.IsPortrait) {
      if (valPortrait) val = valPortrait;
    } else {
      if (valLandscape) val = valLandscape;
    }
    if (val === null) {
      if (obj[param]) {
        val = obj[param];
      } else if (defVal) {
        val = defVal;
      }
    }

    if (param === "position") {
      if (val[0] > -1 && val[0] < 1)
        val[0] = Math.round(
          ((App.IsPortrait ? this.sizePortrait[0] : this.sizeLandscape[0]) /
            2) *
            val[0],
        );
      if (val[1] > -1 && val[1] < 1)
        val[1] = Math.round(
          ((App.IsPortrait ? this.sizePortrait[1] : this.sizeLandscape[1]) /
            2) *
            val[1],
        );
    } else if (param === "scale" || param === "bodyScale") {
      if (!Array.isArray(val)) val = [val, val];
    }

    return val;
  }

  updateOrder() {
    const orderContainer = (container, min, max) => {
      let length = container.children.length;
      let step = (max - min) / length;

      for (let i = 0; i < length; i++) {
        if (container.children[i].type !== "Scene") {
          container.children[i].position.z = max - step * i;

          if (
            container.children[i].children &&
            container.children[i].children.length
          ) {
            orderContainer(container.children[i], -step, 0);
          }
        }
      }
    };

    orderContainer(
      this,
      this.camera.position.z - this.camera.near,
      this.camera.position.z - this.camera.far,
    );
  }

  updateChildPos() {
    this.resizeRender();
    this._updateChilsdPos(this);
  }

  _updateChilsdPos(childsContainer) {
    for (let i = 0, len = childsContainer.children.length; i < len; i++) {
      if (childsContainer.children[i].isContainer) {
        this._updateChilsdPos(childsContainer.children[i]);
      }

      if (!childsContainer.children[i].params) continue;

      let defSize = App.IsPortrait ? this.sizePortrait : this.sizeLandscape;

      if (childsContainer.children[i].params["scaleStrategy"]) {
        let scale = this.getParam(
          childsContainer.children[i].params,
          "scale",
          [1, 1],
        );
        let size = this.getParam(childsContainer.children[i].params, "size");
        let scaleByStrategy = [
          (this.camera.right - this.camera.left) / defSize[0],
          (this.camera.top - this.camera.bottom) / defSize[1],
        ];

        if (
          childsContainer.children[i].params["scaleStrategy"] === "cover-screen"
        ) {
          scaleByStrategy = Math.max(scaleByStrategy[0], scaleByStrategy[1]);
          childsContainer.children[i].scale.set(
            scaleByStrategy * scale[0],
            scaleByStrategy * scale[1],
            1,
          );
        } else if (
          childsContainer.children[i].params["scaleStrategy"] === "fit-screen"
        ) {
          let sizeScale = size
            ? [defSize[0] / size[0], defSize[1] / size[1]]
            : [1, 1];
          childsContainer.children[i].scale.set(
            scaleByStrategy[0] * sizeScale[0] * scale[0],
            scaleByStrategy[1] * sizeScale[1] * scale[1],
            1,
          );
        }
      }

      if (!childsContainer.children[i].params["LTRB"]) continue;

      let position = this.getParam(
        childsContainer.children[i].params,
        "position",
        [0, 0],
      );

      let initX = defSize[0] / 2 + position[0];
      let initY = defSize[1] / 2 - position[1];
      let posX = position[0];
      let posY = position[1];

      let rotation = this.getParam(
        childsContainer.children[i].params,
        "rotation",
        [0, 0, 0],
      );

      let LTRB = this.getParam(childsContainer.children[i].params, "LTRB", "");

      let stickiness = this.getParam(
        childsContainer.children[i].params,
        "stickiness",
        [0, 0],
      );

      if (LTRB) {
        if (/L/i.test(LTRB)) {
          posX = THREE.MathUtils.lerp(
            position[0],
            this.camera.left + initX,
            stickiness[0],
          );
        }
        if (/T/i.test(LTRB)) {
          posY = THREE.MathUtils.lerp(
            position[1],
            this.camera.top - initY,
            stickiness[1],
          );
        }
        if (/R/i.test(LTRB)) {
          posX = THREE.MathUtils.lerp(
            position[0],
            this.camera.right - (defSize[0] - initX),
            stickiness[0],
          );
        }
        if (/B/i.test(LTRB)) {
          posY = THREE.MathUtils.lerp(
            position[1],
            this.camera.bottom + (defSize[1] - initY),
            stickiness[1],
          );
        }
      }

      childsContainer.children[i].position.x = posX;
      childsContainer.children[i].position.y = posY;

      childsContainer.children[i].rotation.set(...rotation);
    }
  }
}

export default ThreeGUI;
