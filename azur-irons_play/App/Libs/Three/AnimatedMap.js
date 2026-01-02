/**
 * Класс для создания анимированной текстуры в THREE из кадров анимации, запакованных в обычный атлас как для Pixi.
 * (в атласе могут быть и повёрнутые изображени.
 * Размеры атласов желательно делать кратными двум.
 * Парсин атласов производится в Game.Three.js в функции parseThreeSpritesheet)
 *
 * Может принимает один или два параметра:
 *
 * - Если параметр один, то это:
 *      Объект с настройками одной анимации ({frameTemplate: 'ostin_idle00??.png', frameStart: 1, frameEnd: 12, speed: 0.25, scale: 1, loop: true})
 *          или
 *      Объект с именами анимаций, каждая из которых содержит вышеописанные настройки (пример ниже)
 *
 * -- Если параметров два, то это:
 *      1 параметр -    спрайт или меш с одним полигоном (Plane), у которых внутренний метод данного класса будет менять scale каждый фрейм
 *                      для того, чтобы текстуры не была вытянутой или сжатой, т.к. иначе она будет просто растягиваться под размер объекта,
 *                      как и обычная текстура.
 *      2 параметр -    вышеописанные настройки анимайий или набор таких настроек (пример ниже)
 *
 *
 * Методы:
 *
 * addAnimation(animationName, options) -   создает новую анимацию.
 *      Пример:
 *      this.meshPlaneObject.material.map.addAnimation('run', {frameTemplate: 'object_anims00??.png', frameStart: 0, frameEnd: 15, speed: 0.5, scale: 1, loop: true});
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
 *      this.meshPlaneObject.material.map.gotoAndStop(1);
 *      this.meshPlaneObject.material.map.gotoAndStop('death');
 *      this.meshPlaneObject.material.map.gotoAndStop('run', 2);
 *
 * gotoAndPlay(animationName || frameNumber, ?frameNumber) -    аналогично вышеописанному методу, но после выполнения запускается анимация
 *
 * currentFrame - (readonly) -    возвращает текущий кадр
 *
 * animatedObject - (sprite || mesh) -      устанавливает или возвращает текущий привязанный объект
 *

 * Варианты использования:

this.spriteObject.material = new THREE.SpriteMaterial({
	map: new THREE.AnimatedMap({frameTemplate: 'ostin_idle00??.png', frameStart: 1, frameEnd: 12, speed: 0.25, scale: 1, loop: true})
});

 * GRID spritesheet:

this.spriteObject.material = new THREE.SpriteMaterial({
	map: new THREE.AnimatedMap({gridTexture: 'FX_Fireball_MedDensity_4x4_E.png', gridSize: [4, 4], frameStart: 1, frameEnd: 12, speed: 0.25, scale: 1, loop: false, anchor: [0.5, 0.5]})
});

this.meshPlaneObject.material = new THREE.MeshBasicMaterial({
	transparent: true,
	map: new THREE.AnimatedMap( this.meshPlaneObject, {
		happy: {frameTemplate: 'ostin_happy00??.png', frameStart: 1, frameEnd: 12, speed: 0.25, scale: 1, loop: true},
		idle: {frameTemplate: 'ostin_happy00??.png', frameStart: 13, frameEnd: 44, speed: 0.25, scale: 1, loop: true},
		sad: {frameTemplate: 'ostin_happy00??.png', frameStart: 45, frameEnd: 65, speed: 0.25, scale: 1, loop: true}
	});
});

 * Более удобней использовать анимированные текстуры с объектами
 * AnimatedSprite и AnimatedPlane
 * которые находятся в AnimatedSpritePlane.js
 */

THREE.AnimatedMap = function () {

	THREE.Texture.call(this);

	let options = {}, animatedObject = null;

	if (arguments.length === 1) {
		options = arguments[0];
	} else {
		animatedObject = arguments[0];
		options = arguments[1];
	}

	this._animatedObject = animatedObject;
	this._textures = null;
	this._durations = null;
	// this.textures = [];

	{
		this.defaultOptions = {
			frameTemplate: '',
			frameStart: 0,
			frameEnd: 1,
			animationSpeed: 1,
			_scale: 1,
			loop: false,
			_autoUpdate: true,
		};

		this._autoUpdate = true;
		this.animationSpeed = 1;
		this._scale = 1;
		this.loop = false;
		this.updateAnchor = false;
	}

	this.onComplete = null;
	this.onFrameChange = null;
	this.onLoop = null;
	this._currentTime = 0;

	this.playing = false;

	this._anims = {};
	this.currentAnim = 'default';


	const create = () => {

		if (options.frameTemplate || options.gridTexture) {

			this.addAnimation(this.currentAnim, options);

		} else {

			let firstAnimName = '';

			for (let key in options) {
				if (!firstAnimName) firstAnimName = key;

				this.addAnimation(key, options[key]);
			}

			this.currentAnim = firstAnimName;

		}

		this.setAnimation(this.currentAnim);

		this.animatedObject = this._animatedObject;

		this.image = this.textures[0].image;

		setTimeout(() => {
			this._previousFrame = this.currentFrame + 1;
			this.updateTexture();
		}, 0);

		this.needsUpdate = true;
	};

	create();

};

THREE.AnimatedMap.prototype = Object.create(THREE.Texture.prototype);
THREE.AnimatedMap.prototype.constructor = THREE.AnimatedMap;

// {frameTemplate: 'ostin_idle00??.png', frameStart: 1, frameEnd: 12, speed: 0.25, scale: 1, loop: true}
// {gridTexture: 'FX_Fireball_MedDensity_4x4_E.png', gridSize: [4, 4], frameStart: 1, frameEnd: 12, speed: 0.25, scale: 1, loop: false}
THREE.AnimatedMap.prototype.addAnimation = function (animationName, options) {

	let frames = [];
	options.frameNames = [];

	const correctFrameTemplate = (frameTemplate, i) => {
		return frameTemplate.replace('???', i < 100 ? (i < 10 ? '00' + i : '0' + i) : i).replace('??', i < 10 ? '0' + i : i).replace('?', i)
	};

	if (options.frameTemplate) {

		if ("frameStart" in options) {

			if (options.frameStart <= options.frameEnd && options.reverse) {

				for (let i = options.frameStart; i <= options.frameEnd; i++) {

					if (!options.frameFilter || options.frameFilter(i)) options.frameNames.push(correctFrameTemplate(options.frameTemplate, i));

				}

				for (let i = options.frameEnd - 1; i >= options.frameStart; i--) {

					if (!options.frameFilter || options.frameFilter(i)) options.frameNames.push(correctFrameTemplate(options.frameTemplate, i));

				}

			} else if (options.frameStart <= options.frameEnd) {

				for (let i = options.frameStart; i <= options.frameEnd; i++) {

					if (!options.frameFilter || options.frameFilter(i)) options.frameNames.push(correctFrameTemplate(options.frameTemplate, i));

				}

			} else if (options.frameStart >= options.frameEnd) {

				for (let i = options.frameStart; i >= options.frameEnd; i--) {

					if (!options.frameFilter || options.frameFilter(i)) options.frameNames.push(correctFrameTemplate(options.frameTemplate, i));

				}

			}

		} else if ("frameNumbers" in options) {

			for (let i = 0; i <= options.frameNumbers.length; i++) {

				let c = options.frameNumbers[i];

				if (!options.frameFilter || options.frameFilter(c)) options.frameNames.push(correctFrameTemplate(options.frameTemplate, c));

			}

		}

		for (let i = 0; i < options.frameNames.length; i++) {
			frames[i] = App.Screens[0].getThreeTexture(options.frameNames[i]);
		}

	} else if (options.gridTexture) {

		let baseTexture = App.Screens[0].getThreeTexture(options.gridTexture);
		let gridX = options.gridSize[0];
		let gridY = options.gridSize[1];

		let basetextureWidth = baseTexture.orig ? baseTexture.orig.width : baseTexture.image.width;
		let basetextureHeight = baseTexture.orig ? baseTexture.orig.height : baseTexture.image.height;
		let frameWidth = baseTexture.image.width / gridX;
		let frameHeight = baseTexture.image.height / gridY;
		let frameX, frameY;

		options.frameStart = options.frameStart || 0;
		options.frameEnd = options.frameEnd || (gridX * gridY - 1);
		let frameNum = 0;

		const orig = {
			x: 0,
			y: 0,
			width: frameWidth,
			height: frameHeight
		};
		let anchorPosOffset = null;
		if (!options.anchor) {
			options.anchor = {x: 0.5, y: 0.5};
		}
		let isAddFrame = false;

		for (let r = 0; r < gridY; r++) {

			frameY = frameHeight * r;

			for (let c = 0; c < gridX; c++) {

				isAddFrame = frameNum >= options.frameStart && frameNum <= options.frameEnd;

				if ("frameNumbers" in options) {
					isAddFrame = options.frameNumbers.indexOf(frameNum) >= 0;
				}

				if (isAddFrame) {
					let texture = baseTexture.clone();

					frameX = frameWidth * c;

					texture.repeat.set(frameWidth / basetextureWidth, frameHeight / basetextureHeight);
					texture.offset.x = frameX / basetextureWidth;
					texture.offset.y = 1 - frameHeight / basetextureHeight - frameY / basetextureHeight;
					texture.rotation = 0;

					anchorPosOffset = {
						x: (frameX + frameWidth / 2) - frameWidth * options.anchor.x,
						y: frameHeight * options.anchor.y - (frameY + frameHeight / 2)
					};

					texture.orig = orig;
					texture.trim = null;
					texture.anchor = options.anchor;
					texture.anchorPosOffset = anchorPosOffset;

					texture.needsUpdate = true;

					frames.push(texture);
				}

				frameNum++;
				isAddFrame = false;
			}
		}

	}

	options = Object.assign({}, this.defaultOptions, options);

	this._anims[animationName] = {
		frameTemplate: options.frameTemplate,
		frameStart: options.frameStart,
		frameEnd: options.frameEnd,
		speed: options.speed,
		scale: options.scale,
		loop: options.loop,
		autoUpdate: options.autoUpdate,

		textures: frames
	};
};

THREE.AnimatedMap.prototype.setAnimation = function (animationName) {

	if (this._anims[animationName]) {

		if (this.currentAnim !== animationName || !this.textures) {
			this.currentAnim = animationName;

			let params = this._anims[this.currentAnim];

			this.textures = params.textures;

			if (params.speed !== undefined) this.animationSpeed = params.speed;
			if (params.scale) this._scale = params.scale;
			if (params.loop !== undefined) this.loop = params.loop;
			if (params.autoUpdate) this._autoUpdate = params.autoUpdate;

			this.updateTexture();
		}
	}
};

THREE.AnimatedMap.prototype.stop = function () {
	if (!this.playing) return;

	this.playing = false;

	if (this._autoUpdate && this._isConnectedToTicker) {
		Broadcast.off("Game Update", this);
		this._isConnectedToTicker = false;
	}
};

THREE.AnimatedMap.prototype.play = function () {
	if (this.playing) return;

	this.playing = true;

	if (this._autoUpdate && !this._isConnectedToTicker) {

		Broadcast.on("Game Update", this.update, this);
		this._isConnectedToTicker = true;
	}
};

THREE.AnimatedMap.prototype.gotoAndStop = function () {
	this.stop();

	let animName = this.currentAnim, frameNumber = this.currentFrame;

	if (arguments.length === 1) {
		if (typeof arguments[0] === 'string') animName = arguments[0];
		else frameNumber = arguments[0];
	} else if (arguments.length > 1) {
		animName = arguments[0];
		frameNumber = arguments[1];
	}

	this.setAnimation(animName);


	let previousFrame = this.currentFrame;

	this._currentTime = frameNumber;

	if (previousFrame !== this.currentFrame) {
		this.updateTexture();
	}
};

THREE.AnimatedMap.prototype.gotoAndPlay = function () {

	let animName = this.currentAnim, frameNumber = this.currentFrame;

	if (arguments.length === 1) {
		if (typeof arguments[0] === 'string') animName = arguments[0];
		else frameNumber = arguments[0];
	} else if (arguments.length > 1) {
		animName = arguments[0];
		frameNumber = arguments[1];
	}

	this.setAnimation(animName);


	let previousFrame = this.currentFrame;

	this._currentTime = frameNumber;

	if (previousFrame !== this.currentFrame) {
		this.updateTexture();
	}

	this.play();
};

THREE.AnimatedMap.prototype.update = function () {
	let deltaTime = App.timeOffset / 16;

	let elapsed = this.animationSpeed * deltaTime;
	let previousFrame = this.currentFrame;

	if (this._durations !== null) {
		let lag = this._currentTime % 1 * this._durations[this.currentFrame];

		lag += elapsed / 60 * 1000;

		while (lag < 0) {
			this._currentTime--;
			lag += this._durations[this.currentFrame];
		}

		let sign = Math.sign(this.animationSpeed * deltaTime);

		this._currentTime = Math.floor(this._currentTime);

		while (lag >= this._durations[this.currentFrame]) {
			lag -= this._durations[this.currentFrame] * sign;
			this._currentTime += sign;
		}

		this._currentTime += lag / this._durations[this.currentFrame];
	}
	else {
		this._currentTime += elapsed;
	}

	if (this._currentTime < 0 && !this.loop) {
		this.gotoAndStop(0);

		if (this.onComplete) {
			this.onComplete(this.currentAnim);
		}
	}
	else if (this._currentTime >= this._textures.length && !this.loop) {
		this.gotoAndStop(this._textures.length - 1);

		if (this.onComplete) {
			this.onComplete(this.currentAnim);
		}
	}
	else if (previousFrame !== this.currentFrame) {
		if (this.loop && this.onLoop) {
			if (this.animationSpeed > 0 && this.currentFrame < previousFrame) {
				this.onLoop();
			}
			else if (this.animationSpeed < 0 && this.currentFrame > previousFrame) {
				this.onLoop();
			}
		}

		this.updateTexture();
	}
};

THREE.AnimatedMap.prototype.updateTexture = function () {
	const currentFrame = this.currentFrame;

	if (this._previousFrame === currentFrame) return;

	this._previousFrame = currentFrame;

	this._texture = this._textures[this.currentFrame];

	this.rotation = this._texture.rotation;

	this.offset.x = this._texture.offset.x;
	this.offset.y = this._texture.offset.y;

	this.repeat.x = this._texture.repeat.x;
	this.repeat.y = this._texture.repeat.y;

	this.orig = this._texture.orig;
	this.trim = this._texture.trim;
	this.anchor = this._texture.anchor;
	this.anchorPosOffset = this._texture.anchorPosOffset;

	// if (this.updateAnchor) {
	// 	this._anchor.copy(this._texture.defaultAnchor);
	// }

	if (this.onFrameChange) {
		this.onFrameChange(this.currentFrame);
	}

	this.updateAnimatedObject();
};

THREE.AnimatedMap.prototype.updateAnimatedObject = function () {

	if (this._animatedObject) {

		if (this.trim) {
			this._animatedObject.scale.x = this.trim.width * this._scale;
			this._animatedObject.scale.y = this.trim.height * this._scale;
		} else if (this.orig) {
			this._animatedObject.scale.x = this.orig.width * this._scale;
			this._animatedObject.scale.y = this.orig.height * this._scale;
		}

		if (this.anchorPosOffset) {
			this._animatedObject.position.x = this.anchorPosOffset.x * this._scale;
			this._animatedObject.position.y = this.anchorPosOffset.y * this._scale;
		}
	}
};

Object.defineProperty(THREE.AnimatedMap.prototype, 'textures', {
	get() {
		return this._textures;
	},
	set(value) {
		if (value[0].image) {
			this._textures = value;
			this._durations = null;
		}
		else {
			this._textures = [];
			this._durations = [];

			for (let i = 0; i < value.length; i++) {
				this._textures.push(value[i].texture);
				this._durations.push(value[i].time);
			}
		}
		this._previousFrame = null;
		this.gotoAndStop(0);
		this.updateTexture();
	}
});

Object.defineProperty(THREE.AnimatedMap.prototype, 'currentFrame', {
	get() {
		let currentFrame = Math.floor(this._currentTime) % this._textures.length;

		if (currentFrame < 0) {
			currentFrame += this._textures.length;
		}

		return currentFrame;
	}
});

Object.defineProperty(THREE.AnimatedMap.prototype, 'animatedObject', {
	get() {
		return this._animatedObject;
	},
	set(value) {
		if (!this._animatedObject) {
			this._animatedObject = value;


		} else {

		}
	}
});

