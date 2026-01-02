/**
 * Два класса для создания спрайта и полигона совместно с анимированной текстурой из AnimatedMap.js
 *
 * AnimatedSprite - создаёт THREE.Sprite и оборачивает его в THREE.Group для того,
 *                  чтобы была возможность управления скейлом
 *
 *                  (Дело в том,  что анимированная текстура меняет скейл у спрайта на который она повешена дла того,
 *                  чтобы кадры анимации не выглядели растянутыми, потому что спрайт и полигон
 *                  по умолчанию имеют размер 1х1, а кадры анимации всегда различаются друг от друга шириной и высотой.
 *                  Если не скейлить объект, на котором висит анимированная текстура,
 *                  то она будет подстраиваться под размер 1х1, как и любая другая текстура)
 *
 * AnimatedPlane - создаёт THREE.Mesh на базе THREE.PlaneGeometry и оборачивает его в THREE.Group
 *
 * Параметр может быть один - объект с настройками анимаций или набор анимаций с такими настройками
 *
 * Методы:
 *
 * setScale(float) - изменение скейла одним числом
 *
 * addAnimation(animationName, options) -   создает новую анимацию.
 *      Пример:
 *      this.animatedSprite.addAnimation('run', {frameTemplate: 'object_anims00??.png', frameStart: 0, frameEnd: 15, speed: 0.5, scale: 1, loop: true});
 *
 * setAnimation(animationName) -    устанавливает анимацию, которая будет проигрываться в данный момент
 *
 * stop() - останавливает анимацию
 * play() - запускает проигрыш анимаций (удобнее пользоваться gotoAndStop и gotoAndPlay)
 *
 * gotoAndStop(animationName || frameNumber, ?frameNumber) -    принимает один или два параметра.
 *      Если параметр один: это может быть название анимации, на которую нужно переключиться, но запускать проирывание или
 *      это может быть кадр анимации на которые следует перепрыгнуть и остановиться.
 *
 *      Если параметров два:
 *          Первый - это название анимации на которую следует переключиться
 *          Второй - номер кадра на который нужно перепрыгнуть
 *
 *      Пример:
 *      this.animatedSprite.gotoAndStop(1);
 *      this.animatedSprite.gotoAndStop('death');
 *      this.animatedSprite.gotoAndStop('run', 2);
 *
 * gotoAndPlay(animationName || frameNumber, ?frameNumber) -    аналогично вышеописанному методу, но после выполнения запускается анимация
 *
 *
 Пример использования:

this.animatedSprite = new THREE.AnimatedSprite({frameTemplate: 'object_anims00??.png', frameStart: 0, frameEnd: 15, speed: 0.5, scale: 1, loop: true});

this.animatedSprite = new THREE.AnimatedSprite({
	idle: {frameTemplate: 'object_anims00??.png', frameStart: 0, frameEnd: 15, speed: 0.5, scale: 1, loop: true},
	jump: {frameTemplate: 'object_anims00??.png', frameStart: 16, frameEnd: 30, speed: 1, scale: 1}
});


this.animatedPlane = new THREE.AnimatedPlane({
	idle: {frameTemplate: 'object_anims00??.png', frameStart: 0, frameEnd: 15, speed: 0.5, scale: 1, loop: true},
	jump: {frameTemplate: 'object_anims00??.png', frameStart: 16, frameEnd: 30, speed: 1, scale: 1},
	вуфер: {frameTemplate: 'object_anims00??.png', frameStart: 31, frameEnd: 52, speed: 0.6, scale: 1}
});
 */
class AnimatedSprite extends THREE.Group {
	constructor(materialOrAnimationOptions) {
		super();

		this._material = null;
		this._sprite = null;

		this._sprite = new THREE.Sprite();

		this.add(this._sprite);


		if (materialOrAnimationOptions) {
			if (materialOrAnimationOptions.frameTemplate || materialOrAnimationOptions[Object.keys(materialOrAnimationOptions)[0]].frameTemplate) {

				this.material = new THREE.SpriteMaterial();

				this.material.map = new THREE.AnimatedMap(this._sprite, materialOrAnimationOptions);

			} else {
				this.material = material;
			}
		}
	}

	get material() {
		this._material = this._sprite.material;
		return this._material;
	}

	set material(value) {
		this._material = value;
		this._sprite.material = this._material;
	}

	setScale(value) {
		this.scale.set(value, value, value);
	}

	addAnimation() {
		if (this.material.map.addAnimation) this.material.map.addAnimation(...arguments);
	}

	setAnimation() {
		if (this.material.map.setAnimation) this.material.map.setAnimation(...arguments);
	}

	stop() {
		if (this.material.map.stop) this.material.map.stop(...arguments);
	}

	play() {
		if (this.material.map.play) this.material.map.play(...arguments);
	}

	gotoAndStop() {
		if (this.material.map.gotoAndStop) this.material.map.gotoAndStop(...arguments);
	}

	gotoAndPlay() {
		if (this.material.map.gotoAndPlay) this.material.map.gotoAndPlay(...arguments);
	}

}

// class AnimatedSprite extends THREE.Sprite {
// 	constructor(material) {
// 		super(material);
//
// 		// this.material = material;
//
// 		this._scale = new THREE.Vector3(1, 1, 1);
//
// 	}
//
// 	get scale() {
// 		return this._scale;
// 	}
//
// 	set scale(value) {
// 		this._scale = value;
// 		console.log(787887)
// 	}
//
// 	method1() {
//
// 	}
//
//
// }

THREE.AnimatedSprite = AnimatedSprite;


/**
 *
 */
class AnimatedPlane extends THREE.Group {
	constructor(materialOrAnimationOptions) {
		super();

		this._material = null;
		this._plane = null;
		this.anims = null;

		this._plane = new THREE.Mesh(new THREE.PlaneGeometry());

		this.add(this._plane);


		if (materialOrAnimationOptions) {
			if (materialOrAnimationOptions.frameTemplate || materialOrAnimationOptions[Object.keys(materialOrAnimationOptions)[0]].frameTemplate) {

				this.material = new THREE.MeshBasicMaterial();

				this.material.transparent = true;
				this.material.map = new THREE.AnimatedMap(this._plane, materialOrAnimationOptions);

				this.anims = this.material.map._anims;

			} else {
				this.material = material;
			}
		}
	}

	setScale(value) {
		this.scale.set(value, value, value);
	}

	addAnimation() {
		if (this.material.map.addAnimation) this.material.map.addAnimation(...arguments);
	}

	setAnimation() {
		if (this.material.map.setAnimation) this.material.map.setAnimation(...arguments);
	}

	stop() {
		if (this.material.map.stop) this.material.map.stop(...arguments);
	}

	play() {
		if (this.material.map.play) this.material.map.play(...arguments);
	}

	gotoAndStop() {
		if (this.material.map.gotoAndStop) this.material.map.gotoAndStop(...arguments);
	}

	gotoAndPlay() {
		if (this.material.map.gotoAndPlay) this.material.map.gotoAndPlay(...arguments);
	}


	get material() {
		this._material = this._plane.material;
		return this._material;
	}

	set material(value) {
		this._material = value;
		this._plane.material = this._material;

		if (this._material && this._material.map && this._material.map._anims) this.anims = this._material.map._anims;
	}

	get currentAnim() {
		return this._plane.material.map.currentAnim;
	}

}

THREE.AnimatedPlane = AnimatedPlane;