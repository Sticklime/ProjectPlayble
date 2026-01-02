import { gsap } 			from "gsap";
import { EasePack } 		from "gsap/EasePack.js";
import { MotionPathPlugin } from "gsap/MotionPathPlugin.js";

import Class 	from 'Class';
import Screen 	from 'Screen';

gsap.registerPlugin(EasePack, MotionPathPlugin);
gsap.defaults({overwrite: "auto"});

window.gsap = gsap;

Class.mixin(Screen, {

	initialize() {

		// Свойства-объекты (PIXI.ObservablePoint), которые не смогут просто так анимироваться через gsap
		this.observablePointProperties = ["position", "scale", "pivot", "skew", "anchor"];
		this.expandedObservablePointProperties = ["positionX", "positionY", "scaleX", "scaleY", "pivotX", "pivotY", "skewX", "skewY", "anchorX", "anchorY"];

	},

	//Изменение volume для звуков и видео
	//Первый параметр имя ассета или объект ассета или массив имён или объектов ассетов
	//Если speed = false то без плавности - моментальное изменение звука в указанное значение
	//Если speed = 1 то 200ms время по умолчанию, если speed 2 то 100ms время изменения и т. д.
	//volume может быть 'default' - это значение из Assets
	volumeTo(medias, volume, speed = 1, delay = 0, options = {}, next) {

		/*options.media = true;

		return this.tweenOrSet(medias, speed, delay, options, next, asset => {

			if (volume === 'default') volume = asset.volume;

			let media = asset.sound || asset.video;

			media.volume = volume;

		}, (asset, time, ease) => {

			if (volume === 'default') volume = App.Assets[asset.name].volume;

			let media = asset.sound || asset.video;
            media = !media ? asset : media;

			this.stopTween(media._volumeTween);
			media._volumeTween = this.tween({
				to: ['volume', volume, time, 0, ease]
			}, media);

		});*/

	},
	//Смещение спрайта в позицию другого спрайта
	//Если speed = false то без анимации - моментальное изменение позиции
	//Если speed = 1 то 200ms время по умолчанию, если speed 2 то 100ms время анимации и т. д.
	//Если options.absolute === true toLocal toGlobal не будут применены,
	//иначе координаты будут высчитаны так, чтобы спрайты совместились на экране
	moveToSprite(containers, target_sprite, speed = false, delay = 0, options = {}, next) {

		//TODO:

		/*return this.tweenOrSet(containers, speed, delay, options, next, container => {

			target_sprite = this.getContainers([target_sprite])[0];

			let new_coords = target_sprite.position;
			if (!options.absolute) new_coords = container.parent.toLocal(target_sprite.toGlobal(new PIXI.Point()));

			container.position.set(new_coords.x, new_coords.y);

		}, (container, time, ease) => {

			target_sprite = this.getContainers([target_sprite])[0];

			let new_coords = target_sprite.position;
			if (!options.absolute) new_coords = container.parent.toLocal(target_sprite.toGlobal(new PIXI.Point()));

			this.tween({
				to: ['position', [new_coords.x, new_coords.y], time, 0, ease]
			}, container);

		});*/

	},

	//Изменение скейла спрайта в значение скейла другого спрайта
	//Если speed = false то без анимации - моментальное изменение скейла
	//Если speed = 1 то 200ms время по умолчанию, если speed 2 то 100ms время анимации и т. д.
	scaleToSprite(containers, target_sprite, speed = false, delay = 0, options = {}, next) {

		//TODO:

		/*return this.tweenOrSet(containers, speed, delay, options, next, container => {

			target_sprite = this.getContainers([target_sprite])[0];

			container.scale.set(target_sprite.scale.x, target_sprite.scale.y);

		}, (container, time, ease) => {

			target_sprite = this.getContainers([target_sprite])[0];

			this.tween({
				to: ['scale', [target_sprite.scale.x, target_sprite.scale.y], time, 0, ease]
			}, container);

		});*/

	},

	//Изменение alpha в указанное значение
	fadeTo(containers, alpha, speed, delay = 0, options = {}, next) {

		containers = this.getContainers(containers);

		//Предусматриваем сокращённое указание next вместо delay или options параметра если они не нужны
		if (typeof delay === 'function') {

			next = delay;
			delay = 0

		} else if (typeof options === 'function') {

			next = options;
			options = {};

		}

		options.ease = options.ease || "Linear.none";

		if (!speed) {

			_.each(containers, container => {

				if (typeof container === 'string') container = this[container];

				if (delay === 0) {
					container.alpha = alpha;
					container.visible = !!alpha;
				} else {
					setTimeout(() => {
						container.alpha = alpha;
						container.visible = !!alpha;
					}, delay);
				}

			});

		} else {

			this.animate(delay / 1000, containers, {alpha, duration: 0.2 / speed, ease: options.ease}, next);

		}
	},

	// Короткое трясение
	// Часто используется для начисления очков или для привлечения внимания на изменение какого-либо значения
	pulse(container, scale = 0.8, intensity = 3, time = 0.8, delay = 0, next) {

		if (typeof container === 'string') container = this[container];

		let scale_x = 1;
		let scale_y = 1;

		if (typeof container === 'object' && container.scale) {

			scale_x = container.scale.x;
			scale_y = container.scale.y;

		}

		// Берём дефолтный scale из params если он там указан, чтобы множественные нажатия не изменяли постоянно scale в меньшую сторону
		if (typeof container === 'object' && container.params && container.params.scale) {

			let scl = container.params.scale;
			if (!this.isArray(scl)) scl = [scl, scl];

			scale_x = scl[0];
			scale_y = scl[1];

		}

		// Для кнопок с не указанным scale считаем scale = 1, чтобы множественные нажатия не изменяли постоянно scale в меньшую сторону
		else if (typeof container === 'object' && container.params && container.params.button) {

			scale_x = 1;
			scale_y = 1;

		}

		return this.animate(
			delay, container, {scale: [scale_x * (1 + ((scale - 1) / 4)), scale_y * (1 + ((scale - 1) / 4))], duration: 0.1 * time, ease: "power2.inOut"},
			'>', container, {scale: [scale_x, scale_y], duration: 0.9 * time, ease: `elastic.out(${scale}, ${1 / intensity})`},
			next
		);

	},

	// Постоянное изменение скейла туда-сюда
	// Используется для кнопок на которые нужно нажать пользователю сейчас, в том числе и для CTA
	pulsation(container, scale = 1.05, speed = 1, delay = 0) {

		if (typeof container === 'string') container = this[container];

		let start_scale_x = 1;
		let start_scale_y = 1;

		if (container.scale) {

			start_scale_x = container.scale.x;
			start_scale_y = container.scale.y;

		}

		let scale_x_to = () => {

			let scale_x = 1;
			if (container.params && 'scale' in container.params) scale_x = container.params.scale[0] === undefined ? container.params.scale : container.params.scale[0];
			else scale_x = start_scale_x;

			return scale_x * scale

		};

		let scale_y_to = () => {

			let scale_y = 1;
			if (container.params && 'scale' in container.params) scale_y = container.params.scale[1] === undefined ? container.params.scale : container.params.scale[1];
			else scale_y = start_scale_y;

			return scale_y * scale

		};

		let scale_x_next = () => {

			let scale_x = 1;
			if (container.params && 'scale' in container.params) scale_x = container.params.scale[0] === undefined ? container.params.scale : container.params.scale[0];
			else scale_x = start_scale_x;

			return scale_x

		};

		let scale_y_next = () => {

			let scale_y = 1;
			if (container.params && 'scale' in container.params) scale_y = container.params.scale[1] === undefined ? container.params.scale : container.params.scale[1];
			else scale_y = start_scale_y;

			return scale_y

		};

		let animation = this.animate(
			delay, container, {scale: [scale_x_to, scale_y_to], d: 0.3 / speed, ease: "sine.inOut"},
			">", container, {scale: [scale_x_next, scale_y_next], d: 0.3 / speed, ease: "sine.inOut"}
		);

		animation.repeat(-1);

		return animation;

	},

	// Тряска влево - вправо как бы показывая НЕТ
	wrongPulsation(container, scale = 1, time = 0.5, delay = 0, next) {

		if (typeof container === 'string') container = this[container];

		let x = container.position.x;
		let y = container.position.y;

		this.animate(
			delay, container, {position: [x + 15 * scale, y], d: time / 7, ease: "power2.inOut"},
			">", container, {position: [x - 25 * scale, y], d: time / 7, ease: "power2.inOut"},
			">", container, {position: [x + 20 * scale, y], d: time / 7, ease: "power2.inOut"},
			">", container, {position: [x - 15 * scale, y], d: time / 7, ease: "power2.inOut"},
			">", container, {position: [x + 10 * scale, y], d: time / 7, ease: "power2.inOut"},
			">", container, {position: [x - 5 * scale, y], d: time / 7, ease: "power2.inOut"},
			">", container, {position: [x, y], d: time / 7, ease: "power2.inOut"},
			next
		);

	},

	// Хаотическое смещение положения вокруг одного места
	// Может использоваться для создания помех / неровностей для других анимаций создававя более реалистичные движения или как необычная альтернатива pulsation для кнопок
	chaoticMotion(container, scale = 1, speed = 1, repeat = -1, next) {

		if (!this.isArray(scale)) scale = [scale, scale];

		if (typeof container === 'string') container = this[container];

		let pos_x = 0;
		let pos_y = 0;

		if (typeof container === 'object' && container.position) {

			pos_x = container.position.x;
			pos_y = container.position.y;

		}

		let animate = this.animate(
			0.00, container, {x: () => pos_x + this.random(-10, 10) * scale[0], y: () => pos_y + this.random(-10, 10) * scale[1], d: 0.2 / speed, ease: "sine.inOut"},
			{repeat: repeat, repeatRefresh: true},
			next
        );

		return animate;

	},

	//Хаотическое мигание alpha
	chaoticAlphaMotion(container, min_alpha = 0, max_alpha = 1, speed = 1) {

		let animation = this.animate(
			0.00, container, {alpha: () => { return this.randomFloat(min_alpha, max_alpha); }, d: 0.2 / speed, ease: "power1.inOut"}
        );

		animation.repeat(-1);

		return animation;

	},

	tweenSine(obj, param, period = 2, magnitude = 50, periodOffset = 0) {
		if (!obj) return;
		if (!(param in obj)) return;

		let i = (periodOffset / period) * 2 * Math.PI;
		let init_val = obj[param];
		let last_val = init_val;

		let animation = this.animate(
			0.00, {p: 0}, {p: 1, d: 1, onUpdate: () => {

				let dt = this.updateTimeOffset / 1000;

				if (dt) {
					i += (dt / period) * 2 * Math.PI;
					i = i % (2 * Math.PI);

					if (obj[param] !== last_val) init_val += obj[param] - last_val;

					obj[param] = init_val + Math.sin(i) * magnitude;
					last_val = obj[param];
				}
			}}
		);

		animation.repeat(-1);

		return animation;
	},

	//Частицы разлетаются в виде фонтана сначала вверх потом под действием гравитации вниз и в стороны
	fountainEmitter(container, particles, options = {}) {

		if (typeof container === 'string') container = this[container];

		if (!this.isArray(particles)) particles = [particles];

		if (options['count'] === undefined) options['count'] = 10;
		if (options['interval'] === undefined) options['interval'] = 100;
		if (options['limit'] === undefined) options['limit'] = false;
		if (options['particleSpeed'] === undefined) options['particleSpeed'] = [[-300, 300], [-500, -500]];
		if (options['particleAcceleration'] === undefined) options['particleAcceleration'] = [0, 500];
		if (options['lifetime'] === undefined) options['lifetime'] = 3500;

		let emitter = this.buildChild(container, {type: 'emitter', count: options.count, interval: options.interval, limit: options.limit, particleSpeed: options.particleSpeed, particleAcceleration: options.particleAcceleration, images: function(emitter) {

			if (typeof particles[0] === 'string') {

				return this.buildChild(emitter, {type: 'sprite', image: this.sample(particles), position: [0, 0], scale: this.randomFloat(0.5, 1.5), blendMode: PIXI.BLEND_MODES.SCREEN});

			} else if (typeof particles[0] === 'object') {

				return this.sample(particles);

			} else if (typeof particles[0] === 'function') {

				return particles[0].call(this, emitter);

			}

		}, particleTween: function() {

			return {
				set: ['alpha', 0],
				to: ['alpha', 1, 100],
				next: ['alpha', 0, 100, options['lifetime']]
			};

		}});

		emitter.emit();

		emitter.skipUpdate = false;

		return emitter;

	},

	// Частицы разлетаются из одной точки в разные стороны в виде сферы и быстро гаснут
	sphereBurstEmitter(container, particles, options = {}) {

		if (typeof container === 'string') container = this[container];

		if (!this.isArray(particles)) particles = [particles];

		if (options['count'] === undefined) options['count'] = 200;
		if (options['interval'] === undefined) options['interval'] = 100;
		if (options['limit'] === undefined) options['limit'] = false;
		if (options['lifetime'] === undefined) options['lifetime'] = 3500;
		if (options['endScale'] === undefined) options['endScale'] = 0;
		if (options['endAlpha'] === undefined) options['endAlpha'] = 0;
		if (options['endPositionOffset'] === undefined) options['endPositionOffset'] = [0, 0];
		if (options['targetDistance'] === undefined) options['targetDistance'] = [300, 300];

		let emitter = this.buildChild(container, {type: 'emitter', count: options.count, limit: options.limit, images: function() {

			if (typeof particles[0] === 'string') {

				return this.buildChild(emitter, {type: 'sprite', image: this.sample(particles), rotation: Math.random() * Math.PI * 2, alpha: 0.8 +  Math.random() * 0.2});

			} else if (typeof particles[0] === 'object') {

				return this.sample(particles);

			} else if (typeof particles[0] === 'function') {

				return particles[0].call(this, emitter);

			}

		}, particleTween: function(sprite) {

			let pos = this.getPointInsideEllipse(options['targetDistance'][0], options['targetDistance'][1]);

			pos[0] += options['endPositionOffset'][0];
			pos[1] += options['endPositionOffset'][1];

			let dist = 5 * Math.sqrt(Math.pow(pos[0], 2) + Math.pow(pos[1], 2));

			let angle = Math.atan2(pos[1], pos[0]);

			let time = _.random(1000, 2000);

			let scale = 0.5 +  Math.random() * 0.5;

			let rotation = Math.random() * Math.PI * 2;

			return [
				0.00, sprite, {scale: 0},

				0.00, sprite, {scale: scale, d: time * 0.2, ease: "back.out(1.7)"},
				0.00, sprite, {rotation: sprite.rotation + rotation * 0.2, d: time * 0.2},
				0.00, sprite, {position: pos, d: time * 0.2, ease: "power1.in"},

				">", sprite, {scale: options['endScale'], d: time * 0.8},
				"<", sprite, {rotation: sprite.rotation + rotation * 0.8, d: time * 0.8},
				"<", sprite, {position: [dist * Math.cos(angle), dist * Math.sin(angle)], d: time * 0.8, ease: "power1.out"},
				`<+${time*0.7}`, sprite, {alpha: options['endAlpha'], d: time * 0.1}
			];

		}});

		emitter.emit();

		emitter.skipUpdate = false;

		return emitter;

	},

	// Эффект землетрясения
	earthquake(containers, scale = 1, quake_time = 0.05, total_time = 1, delay = 0, next) {

		if (!this.isArray(containers)) containers = [containers];

		const offsets = [-3 * App.PixelRatio, -1.5 * App.PixelRatio, 0, 1.5 * App.PixelRatio, 3 * App.PixelRatio];

		const positions = [];

		this.each(containers, (container) => {
			if (typeof container === 'string') container = this[container];
			positions.push({x: container.position.x, y: container.position.y});
		});

		let count = 0;

		const f = () => {

			const offset_x = _.sample(offsets);
			const offset_y = _.sample(offsets);

			this.each(containers, (container, i) => {

				this.animate(
					0.00, container, {position: [positions[i].x + offset_x * scale, positions[i].y + offset_y * scale], d: quake_time, ease: "bounce.in"},
					() => {
						if (count * quake_time >= total_time) c();
						else f();
					}
				);

			});

			count++;

		};

		const c = () => {

			this.each(containers, (container, i) => {

				this.animate(
					0.00, container, {position: [positions[i].x, positions[i].y], d: quake_time, ease: "bounce.in"},
					() => {
						if (next) {
							next.call(this);
							next = null;
						}
					}
				);

			});

		};

		this.timeout(f, delay || 0);

	},

	// Анимация руки для туториала указывающей что нужно нажать на кнопку
	// Спрайт руки нужно положить так, чтобы 0 0 позиция указывала на кнопку
	titorialHandPressAnimation(containers, speed = 1, delay = 0) {

		containers = this.getContainers(containers);

		this.animate(0.00, containers, {alpha: 0});

		let animation = this.animate(
			delay, containers, {position: [50, 50], scale: 1, alpha: 0},
			">", containers, {position: [0, 0], scale: 0.8, d: 0.5 / speed, ease: "power2.inOut"},
			"<", containers, {alpha: 1, d: 0.2 / speed},
			">", containers, {scale: 0.7, d: 0.3 / speed, ease: "power2.inOut"},
			">+=0.2", containers, {alpha: 0, d: 0.4 / speed}
		);

		animation.repeat(-1);

		return animation;

	},

	// Возвращает массив объектов спрайтов раскрывая записи указывающие на спрайты (строковые имена, ссылки на дочерние элементы и т.д.)
	// Пример: ["sprite 1", this["sprite 2"], "sprite 3:children", "sprite 4:chars", "sound asset name:sound", "video asset name:video"]
	// Вернёт: [this["sprite 1"], this["sprite 2"], ...this["sprite 3"].children, ...this["sprite 4"].chars, App.Assets["sound asset name"].sound, App.Assets["video asset name"].video]
	getContainers(containers, options = {}) {

		if (!this.isArray(containers)) containers = [containers];

		let result = [];

		for (let i=0, l=containers.length; i<l; i++) {

			if (typeof containers[i] === 'string') {

				if (containers[i].indexOf(":") !== -1) {

					let split = containers[i].split(':');

					let name = split[0];
					let modifier = split[1];

					if (modifier === 'sound') {

						if (App.Assets[name] && App.Assets[name].sound) result.push(App.Assets[name].sound);
						else console.error(`VisualEffects: sound asset '${name}' not available.`);

					} else if (modifier === 'video') {

						if (App.Assets[name] && App.Assets[name].video) result.push(App.Assets[name].video);
						else console.error(`VisualEffects: video asset '${name}' not available.`);

					} else {

						if (this[name]) {

							if (this[name][modifier]) result = result.concat(this[name][modifier]);
							else console.error(`VisualEffects: modifier '${modifier}' not found in container '${name}'.`);

						} else {

							console.error(`VisualEffects: container '${name}' not found.`);

						}

					}

				} else {

					if (this[containers[i]]) result.push(this[containers[i]]);
					else console.error(`VisualEffects: container '${containers[i]}' not found.`);

				}

			} else {

				result.push(containers[i]);

			}

		}

		if (options.randomize) result = _.shuffle(result);

		return result;

	},

	/*
	*   Этот метод вернёт gsap Timeline экземпляр,
	*   который можно отменить целиком,
	*   поставить каллбэк по завершении
	*   или запустить в обратном направлении
	*
	*	this.animate(
	*		0.00, "sprite name", {positionPortrait: [0, 300], d: 2, needSaveInParams: true}, // needSaveInParams для сохранения позиции при ресайзе(если указано несколько контейнеров например с :children не тестил как это работает, да и эта настпройка не предусмотрела для кучи контейнеров)
	*		0.00, "sprite name", {alpha: 0, scale: 2, position: [100, 200]}, //без duration это будет работать через gsap .set метод
	*		0.00, "sprite name", {alpha: 1, position: [0, 0], duration: 0.2}, //с duration это будет анимироваться 200мс
	*		0.30, "sprite name", {alpha: 1}, //это будет запущено через 300мс с момента вызова метода this.animate
	*		0.00, "sprite name", {alpha: 0, d: 0.2}, //d - это сокращение для duration
	*		0.00, ["sprite name 1", "sprite name 2:children", "text chars sprite:words"], {alpha: 1}, //Спрайты можно указывать массивом, а также ссылаться на их потомков (включая lines, words, chars для TextChars спрайтов)
	*		0.00, "sprite name", {scale: 0, d: 0.2}, //в этом случае scale.x и scale.y установятся в 0
	*		0.00, "sprite name", {scale: [1, 0.5], d: 0.2}, //в этом случае scale.x установится в 1, а scale.y в 0.5
	*		0.00, "sprite name", {scale: {x: 1, y: 0.5}, d: 0.2}, //можно указать и объектом
	*		0.00, "sprite name", {position: ["+=100", "-=100"], scale: "*=0.5", d: 0.2}, //можно использовать '+=', '-=' и '*=' для указания относительных изменений от текущего значения (position: ["*=0.5", "*=0.5"] работать не будет, а просто position: "*=0.5" будет)
	*		0.00, "sprite name", {scale: "default", d: 0.2}, //можно указать значение по умолчанию указанное в sprite.params.scale (то что написано в Containers секции объекта Screen)
	*		0.00, "text sprite", {text: 1000, d: 1}, //так можно анимировать увеличение числа от текущего значения до 1000 в течение одной секунды
	*		0.00, "text sprite", {text: 1000, format: (number) => {...}, d: 1}, //можно добавить свойство format, чтобы форматировать особым образом числа в текст
	*		0.00, "sprite name", {position: [100, 100], d: 0.2, ease: "power1.inOut"}, //так можно указать ease функцию и любые другие параметры для gsap
	*		0.00, "sprite name:children", {alpha: 0, d: 0.2, stagger: 0.5}, //так можно анимировать последовательно каждый спрайт из списка через 0.5 сек один за другим
	*		0.00, "sprite name", {positionPortrait: [100, 100], positionLandscape: [200, 200], d: 0.2}, //так можно указать разные данные для landscape и portrait ориентации (также можно дописывать iPhone, iPhoneX, iPad для разных пропорций экрана, IOS, Android и другое)
	*		0.00, "sprite name", {position: [100, 100], d: 0.2, onUpdate: () => {...}}, //так можно указать каллбэк на каждый шаг анимации
	*		">", "sprite name", {position: [100, 100], d: 0.2}, //так можно указать что эта анимация должна начаться сразу после предыдущей
	*	  	">1.00", "sprite name", {position: [100, 100], d: 0.2}, //эта анимация начнётся через секунду после завершения предыдущей анимации
	*	   	">-1.00", "sprite name", {position: [100, 100], d: 0.2}, //эта анимация начнётся за одну секунду до завершения предыдущей анимации
	*	   	"<", "sprite name", {position: [100, 100], d: 0.2}, //эта анимация начнётся одновременно с предыдущей анимацией
	*	   	"<1.00", "sprite name", {position: [100, 100], d: 0.2}, //эта анимация начнётся через секунду после начала предыдущей анимациии
	*		() => {...} //последним аргументом можно указать функцию-каллбэк, которая будет запущена по завершении всех анимаций
	*	);
	*
	* */
	animate(...args) {

		// overwrite: "auto" удаляет внутренние твины из сохранённых таймлайнов
		// причем незаметно и тихо. Появляются пропуски и глюки в анимациях
		// Нужно использовать

		// Опции таймлайна по умолчанию
		const timelineOptions = {
			delay: 0,
			paused: false,
			defaults: {duration: 0.2, ease: "power1.inOut", overwrite: "auto"},
			onUpdate: () => {},
			onComplete: () => {},
			callbackScope: this,
			autoRemoveChildren: false
		};

		const propsShortening = {
			"t": "type",
			"d": "duration",
			"e": "ease"
		};

		//Свойства-настройки, которые не нужно анимировать
		//Здесь отсутсвуют параметры связанные с callback функциями, так как мы всё время используем timeline и можно назначать каллбэки на сам таймлайн.
		const specialProperties = ["duration", "ease", "delay", "yoyo", "repeat", "stagger", "overwrite", "data", "id", "immediateRender", "inherit", "lazy", "repeatDelay", "repeatRefresh", "reversed", "runBackwards", "startAt", "yoyoEase", "keyframes", "onUpdate", "onRepeat"];

		//Свойства анимирующиеся через методы целевого объекта
		const functionProperties = {
			text: {
				get: (target) => {return target.getText ? target.getText() : target.text},
				set: (target, value) => {target.setText ? target.setText(value) : target.text = value}
			}
		};

		//Значения по умолчанию для свойств при отсутствии значения в .params и указании анимировать в "default"
		const propsDefaults = {
			"position": [0, 0], //Не указывать тут объекты так как они не будут склонированы
			"scale": [1, 1],
			"pivot": [0, 0],
			"skew": [0, 0],
			"alpha": 1,
			"rotation": 0,
			"angle": 0
		};

		//Если первый параметр не число и не строка (либо строка начинающаяся с буквы = имя спрайта) и количество параметров меньше или равно трём - считаем что использован упрощённый синтаксис для одной простой анимации
		if (args.length <= 3 && typeof args[0] !== "number" && (typeof args[1] !== "string" || /^[a-zA-Z]+$/.test(args[1].charAt(0)))) {

			//Вставим в начало пропущенный параметр времени начала первой анимации
			args.splice(0, 0, 0.00);

		}

		//Если количество параметров не делится на три и последний параметр undefined - удалим его (на случай если на месте callback функции передаётся undefined)
		if (args.length % 3 !== 0 && !args[args.length - 1]) {

			args.length--;

		}

		//Если количество параметров не делится на три и последний параметр функция - считаем эту функцию каллбэком по завершении всех анимаций
		if (args.length % 3 !== 0 && typeof args[args.length - 1] === "function") {

			timelineOptions.onComplete = args[args.length - 1];
			args.length--;

		}

		//Если количество параметров не делится на три и последний параметр объект - считаем этот объект параметрами таймлайна
		if (args.length % 3 !== 0 && typeof args[args.length - 1] === "object") {

			_.merge(timelineOptions, args[args.length - 1]);
			args.length--;

		}

		if (timelineOptions.screen) timelineOptions.callbackScope = timelineOptions.screen;

		let timeline = gsap.timeline(timelineOptions);

		//Определяем ускорение анимаций
		let timeScale = timelineOptions.timeScale || 1;

		if (Settings[`tween-factor-${this.Name}`]) timeScale = 1 / Settings[`tween-factor-${this.Name}`];
		else if (Settings[`tween-factor-other`]) timeScale = 1 / Settings[`tween-factor-other`];

		timeline.timeScale(timeScale);

		let animations = _.chunk(args, 3);


		_.each(animations, animation => {

			let timeOffset = animation[0];
			let targets = animation[1];
			let values = animation[2];

			let timeOffsetNumber = parseFloat(timeOffset);

			if (!isNaN(timeOffsetNumber)) timeOffset = timeOffsetNumber;

			MRAID.processDynamicProperties(values, {orientation: this.orientation});

			//Переименовываем сокращения (d в duration, t в type и т.д.)
			values = _.mapKeys(values, (value, key) => propsShortening[key] || key);

			//Получаем ссылки на объекты спрайтов
			targets = this.getContainers(targets, {randomize: !!values.randomize});

			//Если нет duration и не указан type считаем что тип set
			if (!("duration" in values) && !values["type"]) values["type"] = "set";
			if (!("overwrite" in values)) values["overwrite"] = ("overwrite" in timelineOptions?.defaults) ? timelineOptions.defaults.overwrite : "auto";

			if ("randomize" in values) delete values.randomize;

			let spriteValues = _.omit(values, ["save", "type"]);

			_.each(_.keys(_.omit(spriteValues, specialProperties)), propertyName => {

				if (typeof spriteValues[propertyName] === "string") {

					if (spriteValues[propertyName] === "default") {

						spriteValues[propertyName] = (i, target, targets, xy = null) => {

							let value = propsDefaults[propertyName];

							if (target.params && propertyName in target.params) value = target.params[propertyName];

							//Если свойство принадлежит observable point - xy параметр будет указывать на 'x' или 'y'
							if (xy) {

								if (_.isArray(value)) value = value[xy === 'x' ? 0 : 1];
								else if (_.isObject(value)) value = value[xy];

							} else if (_.includes(this.observablePointProperties, propertyName)) {

								value = value.clone();

							}

							return value;

						};

					} else if (spriteValues[propertyName].indexOf("*=") === 0) {

						let multiplier = parseFloat(spriteValues[propertyName].substr(2));

						spriteValues[propertyName] = (i, target, targets, xy = null) => {

							let value = propsDefaults[propertyName];

							if (propertyName in target) value = target[propertyName];

							//Если свойство принадлежит observable point - xy параметр будет указывать на 'x' или 'y'
							if (xy) {

								if (_.isArray(value)) value = value[xy === 'x' ? 0 : 1] * multiplier;
								else if (_.isObject(value)) value = value[xy] * multiplier;

							} else {

								if (_.includes(this.observablePointProperties, propertyName)) {

									value = [value.x * multiplier, value.y * multiplier];

								} else {

									value *= multiplier;

								}

							}

							return value;

						};

					}

				}

				let functionProperty = functionProperties[propertyName];

				if (functionProperty) {

					// Если в анимируемых свойствах есть format, то запоминаем его и удаляем,
					// чтобы не было ошибки в gsap
					let format = _.identity;

					if (spriteValues.hasOwnProperty('format')) {

						format = spriteValues['format'];

						delete  spriteValues['format'];
					}

					let parse = Number.parseFloat;

					if (spriteValues.hasOwnProperty('parse')) {

						parse = spriteValues['parse'];

						delete  spriteValues['parse'];
					}

					//Создаём временное свойство целевого объекта
					let temporaryPropertyName = `_animate_value_${propertyName}`;

					//Устанавливаем первоначальное значение во временное свойство целевого объекта
					_.each(targets, target => target[temporaryPropertyName] = parse(functionProperty.get(target)) || 0.00);

					// Если в анимируемых свойствах есть метод onUpdate,
					// то запомним его и вызовем внутри нашего кастомного апдейта ниже
					let _onUpdate = spriteValues.onUpdate;

					spriteValues.onUpdate = () => {

						_.each(targets, target => functionProperty.set(target, format(target[temporaryPropertyName])));

						if (_onUpdate) _onUpdate();

					};

					spriteValues[temporaryPropertyName] = parse(spriteValues[propertyName]);

					delete spriteValues[propertyName];

				}

			});

			this.animateTimelineProperties(timeline, targets, spriteValues, timeOffset, values);

		});

		return timeline;

	},

	animateTimelineProperties(timeline, targets, props, timeOffset, options = {}) {

		// Ниже по коду будет нужен уникальный идентификатор каждого шага анимации
		let stepUniqueId =_.uniqueId('timeline-');

		// Разворачиваем position scale и подобное в positionXgsap scaleYgsap и т. д. так как gsap не умеет анимировать вложенные свойства
		props = this.expandObservablePointProperties(timeline, targets, props);

		// Определяем наличие закэшированных объектов (например Pixi.TextChars)
		// нужно отключить кэширование на время анимации
		let cachedTargetsExist = _.find(targets, target => target.cacheManager);

		if (options.type === "set") {

			props.immediateRender = true;

			timeline.set(targets, props, timeOffset);

			// Добавим манипуляции с visible если анимируем alpha
			if ("alpha" in props) {

				if (props.alpha > 0) _.each(targets, target => target.visible = true);
				if (props.alpha === 0) _.each(targets, target => target.visible = false);

			}

			// Если меняем что-то в закешированной цели нужно обновить кэш
			// 2022.08.08 В СЛУЧАЕ АНИМАЦИИ БУКВ НАДПИСИ ТУТОРИАЛА ТАКОЕ ПОВЕДЕНИЕ СОВЕРШЕННО НЕ ПОДХОДИТ
			// на set стадии скрывается что-то и это попадает в кэш, а по окончании анимации возвращается кэш с этими изменениями, которые были сделаны в set
			// возможно где-то так и нужно, но не везде и не стоит сюда писать такое поведение,
			// если нужно применить результат анимации в кэш то нужно использовать для этого onComplete каллбэк
			/*if (cachedTargetsExist) {

				let bitmapCacheManagers = _.uniq(_.map(_.filter(targets, target => target.cacheManager), 'cacheManager'));

				_.each(bitmapCacheManagers, cacheManager => {
					cacheManager.updateCache(stepUniqueId);
				});

			}*/

		} else {

			timeline.to(targets, props, timeOffset);

			let onStart = [],
				onComplete = [];

			//Добавим манипуляции с visible если анимируем alpha
			if ("alpha" in props) {

				onStart.push(() => {
					if (props.alpha > 0) _.each(targets, target => target.visible = true);
				});

				onComplete.push(() => {
					if (props.alpha === 0) _.each(targets, target => target.visible = false);
				})

			}

			//Если анимируем что-то в закешированной цели нужно отключить кэш на время анимации
			if (cachedTargetsExist) {

				let bitmapCacheManagers = _.uniq(_.map(_.filter(targets, target => target.cacheManager), 'cacheManager'));

				onStart.push(() => {
					_.each(bitmapCacheManagers, cacheManager => cacheManager.disableCacheByUId(stepUniqueId));
				});

				onComplete.push(() => {
					_.each(bitmapCacheManagers, cacheManager => cacheManager.enableCacheByUId(stepUniqueId));
				});

			}

			//Эти каллбэки нужно выполнить в конце так как в них может быть вызван destroy анимируемых объектов что приведёт к ошибкам включения кэша после анимации
			if (props.onStart) onStart.push(props.onStart);
			if (props.onComplete) onComplete.push(props.onComplete);

			if (onStart.length > 0) props.onStart = () => _.each(onStart, fn => fn());
			if (onComplete.length > 0) props.onComplete = () => _.each(onComplete, fn => fn());

		}

	},

	expandObservablePointProperties(timeline, targets, props) {

		//Убираем свойства которые нельзя просто так анимировать через gsap
		let observablePointProps = _.pick(props, this.observablePointProperties);
		let expandedObservablePointProps = _.pick(props, this.expandedObservablePointProperties);

		if (_.size(observablePointProps) > 0) {

			props = _.omit(props, this.observablePointProperties);
			props = _.omit(props, this.expandedObservablePointProperties);

			let newProps = {};

			newProps.startAt = {};

			//Преобразуем анимацмм свойств position scale и подобного в анимации .positionXgsap .positionYgsap .scaleXgsap .scaleYgsap
			_.each(observablePointProps, (value, propertyName) => {

				if (_.isArray(value)) {

					newProps[propertyName + 'Xgsap'] = value[0];
					newProps[propertyName + 'Ygsap'] = value[1];

				} else if (_.isFunction(value)) {

					newProps[propertyName + 'Xgsap'] = (i, target, targets) => value(i, target, targets, 'x');
					newProps[propertyName + 'Ygsap'] = (i, target, targets) => value(i, target, targets, 'y');

				} else if (_.isNumber(value)) {

					newProps[propertyName + 'Xgsap'] = value;
					newProps[propertyName + 'Ygsap'] = value;

				} else if (_.isString(value)) { //Строковые значения вида '+=50%' или '-=200'

					newProps[propertyName + 'Xgsap'] = value;
					newProps[propertyName + 'Ygsap'] = value;

				} else if (_.isObject(value)) { //Функция тоже является объектом поэтому проверка на объект должна идти последней

					newProps[propertyName + 'Xgsap'] = value.x;
					newProps[propertyName + 'Ygsap'] = value.y;

				}

				newProps.startAt[propertyName + 'Xgsap'] = (i, target) => target[propertyName].x;
				newProps.startAt[propertyName + 'Ygsap'] = (i, target) => target[propertyName].y;

				//Избавляемся от варнингов gsap
				_.each(targets, target => {

					if (!((propertyName + 'Xgsap') in target)) target[propertyName + 'Xgsap'] = 0;
					if (!((propertyName + 'Ygsap') in target)) target[propertyName + 'Ygsap'] = 0;

				});

			});

			//Преобразуем анимации свойств positionX scaleY и подобного в анимации .positionXgsap .scaleYgsap
			_.each(expandedObservablePointProps, (value, propertyName) => {

				newProps[propertyName + 'gsap'] = value;
				newProps.startAt[propertyName + 'gsap'] = (i, target) => propertyName.substr(-1) === 'X' ? target[propertyName.substr(0, propertyName.length - 1)].x : target[propertyName.substr(0, propertyName.length - 1)].y;

			});

			let oldUpdate = props.onUpdate;

			//Преобразуем назад .positionXgsap и подобное в .position.x и подобное
			let newUpdate = () => {

				_.each(targets, target => {

					_.each(observablePointProps, (value, propertyName) => {

						target[propertyName].set(target[propertyName + 'Xgsap'], target[propertyName + 'Ygsap']);

					});

					_.each(expandedObservablePointProps, (value, propertyName) => {

						newProps[propertyName + 'gsap'] = value;
						newProps.startAt[propertyName + 'gsap'] = (i, target) => propertyName.substr(-1) === 'X' ? target[propertyName.substr(0, propertyName.length - 1)].x : target[propertyName.substr(0, propertyName.length - 1)].y;

					});

				});

			};

			props.onUpdate = (...args) => {
				newUpdate(...args);
				if (oldUpdate) oldUpdate(...args);
			};

			_.extend(props, newProps);

		}

		return props;

	},

	stopAnimation(gsapTimeline) {

		if (gsapTimeline) gsapTimeline.kill();

	},

	buttonElasticPulsation(button, strength = 1, speed = 1, delay = 0) {

		if (typeof button === 'string') button = this[button];

		if (!button) return;

		let scaleX = Math.lerp(0.9, 0.5, Math.unlerp(1, 2, Math.abs(strength)));
		let scaleY = Math.lerp(1.1, 1.8, Math.unlerp(1, 2, Math.abs(strength)));
		let sign = Math.sign(strength);
		let scale = [
			sign >= 0 ? scaleX : scaleY,
			sign >= 0 ? scaleY : scaleX,
		];

		let initScale = button?.params?.scale ? !Array.isArray(button.params.scale) ? [button.params.scale, button.params.scale] : button.params.scale : [1, 1];
		initScale = [initScale[0] * scale[0], initScale[1] * scale[1]];
		let targetScale = button?.params?.scale ?? [1, 1];

		let power1Speed = 2000 / speed * 0.05;
		let elasticSpeed = 2000 / speed * 0.95;

		if (button.animateTouchPulsation) button.animateTouchPulsation.kill();
		button.animateTouchPulsation = this.animate(
			delay/ 1000, button, {scale: initScale, d: power1Speed / 1000, ease: "power1.out", onComplete: () => {
				button.animateTouchPulsation = this.animate(
					0, button, {scale: targetScale, d: elasticSpeed / 1000, ease: "elastic.out"}
				);
			}}
		);

	}

});