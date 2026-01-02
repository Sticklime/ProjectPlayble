import Broadcast 		from 'Broadcast';
import Class 			from 'Class';
import App 				from 'App';

// Этот  класс создаёт дерево отображаемых объектов (спрайтов), которые могут быть легко добавлены и удалены с экрана как один логический объект.
let Screen = new Class({

	initialize() {

		if (!this.Hooks) this.Hooks = {};

		this._containers = [];

		this._childs = [];
		this._dynamicChilds = [];

		this.tick = 0;
		this.orientation = '';

		this._update_ticks = null;

		this.BLOCK_SHOW_IF_SHOWED = false;

		this.state = 'idle';

		Broadcast.make(this);

		if (!this.templateMode) App.registerScreen(this);

	},

	// Внутренний метод где экземпляр класса Screen строит корневые контейнеры его дерева спрайтов.
	// Перед созданием корневых контейнеров вызывается событие before build
	// а после создания всего дерева спрайтов вызывается событие build
	build(...params) {

		this.each(this.Events, (func, name) => {

			if (name.indexOf("permanent:") > -1) {

				name = name.replace('permanent:', '');

				if (name.indexOf("global:") > -1) {

					name = name.replace('global:', '');

					Broadcast.on(name, (...params) => {

						func.apply(this, params);

					}, this);

				} else {

					this.on(name, (...params) => {

						func.apply(this, params);

					}, this);

				}

			}

		});

		this.each(this.Hooks, (func, name) => {

			if (name.indexOf('update tick') === 0) {

				if (!this._update_ticks) this._update_ticks = {};

				let tick = name.replace('update tick ', '');

				this._update_ticks[tick] = {
					tick: parseInt(tick),
					func
				};

			}

		});

		if (this.Hooks["beforeBuild"]) this.Hooks["beforeBuild"].apply(this, [...params]);

		// Вызывается перед созданием спрайтов, поэтому в этом событии можно успеть модифицировать дерево спрайтов класса.
		this.call('before build', [...params]);

		this.updateTime = 0;

		// Вызывается после того как будут созданы все контейнеры и спрайты. В подписчике на это событие
		// можно динамически достроить некоторые элементы игры и задать начальные параметры, например счёт установить в 0.
		this.call('build', [...params]);

		if (this.Hooks["build"]) this.Hooks["build"].apply(this, [...params]);

		this.isBuild = true;

	},

	// Внутренний метод в котором экземпляр Screen создаёт дочерние отображаемые объекты его корневых контейнеров.
	// Этот метод вызывает buildChild для каждого корневого контейнера и рекурсивно buildChilds для дочерних объектов.
	buildChilds(childs, container, options) {

		let result = [];

		childs = _.sortBy(childs, "zIndex");

		this.each(childs, child_params => {

			let child = this.buildChild(container, child_params, options);

			result.push(child);

			if (child_params.childs) this.buildChilds(child_params.childs, child, options);

		});

		return result;

	},

	// Внутренний метод который вызывается из {{#crossLink "Game"}}{{/crossLink}} класса каждый тик (при каждой перерисовке экрана)
	// Этот метод запускает {{#crossLink "Screen/{screen name} update:event"}}{{/crossLink}} и {{#crossLink "Screen/<screen name> update tick <number>:event"}}{{/crossLink}} события
	update() {

		if (!this.isBuild) return;

		this.updateTimeOffset = App.timeOffset;

		if (this.updateTimeOffset > 50) this.updateTimeOffset = 50;

		this.updateTime += this.updateTimeOffset;

		if (this.Hooks["update"]) this.Hooks["update"].apply(this, []);

		if (this._update_ticks) {

			this.each(this._update_ticks, params => {

				if (this.tick % params.tick === 0) {

					if (params.func) {

						try {

							params.func.apply(this, []);

						} catch(e) {

							console.error(e);

						}

					}

				}

			});

		}

		this.tick++;

	},

	// Внутренний метод, который вызывается из {{#crossLink "Game"}}{{/crossLink}} класса каждый раз при изменении размеров экрана или смены ориентации.
	// Этот метод переустанавливает опять все настройки из {{#crossLink "Screen/Containers:property"}}{{/crossLink}} всем спрайтам и другим отображаемым объектам.
	resize(reason = null) {

		this.orientation = this.getOrientation();

		// Вызываем события только если resize вызван не при показе (show) этого экрана (screen)
		if (this.isBuild && reason !== "show") {

			this.call('before resize', []);

			if (this.Hooks["beforeResize"]) this.Hooks["beforeResize"].apply(this, []);

		}

		/*this.each(this._containers, container => {

			const child_params = container.params;

			if (child_params.type === 'container') {

				let child = this[child_params.name];

				if (child) this.applyThreeParams(child, child.params);

				if (child_params.childs) this.resizeChilds(child.children);

			}

		});*/

		// 2024.04.10 - обноружено что итерация по this._childs - значительно медленнее на многих экранах
		//  так как охватывает все созданные объекты, а не только видимые.
		// Хотя итерация по _childs и правильнее нужно видимо как-то оптимизировать этот процесс и делать applyParams
		//  только на тех элементах где есть Portrait / Landscape свойства (на _dynamicChilds)
		_.each(this._dynamicChilds, child => {

			if (!child || !child.params || child._destroyed) return this._childs = _.without(this._childs, child);

			if (child) this.applyParams(child, child.params);

		});

		if (App.World && App.World.ThreeGUI) App.World.ThreeGUI.updateChildPos();

		// Вызываем события только если resize вызван не при покаже (show) этого экрана (screen)
		if (this.isBuild && reason !== "show") {

			this.call('resize', []);

			if (this.Hooks["resize"]) this.Hooks["resize"].apply(this, []);

		}

	},

	// Внутренний метод который вызывается из {{#crossLink "Screen/resize:method"}}{{/crossLink}},
	// но так же может использоваться как публичный.
	/*resizeChilds(childs) {

		this.each(childs, child => {

			if (!child.params) return;

			if (child) this.applyThreeParams(child, child.params);

			this.resizeChilds(child.children);

		});

	},*/

	getOrientation() {

		return this.LOCK_ORIENTATION || App.orientation;

	},

	// Внутренний метод который высчитывает масштаб корневых контейнеров используя свойство scaleStrategy
	getScaleByStrategy(scale_strategy) {

		let scale = 1,
			width = App.Width,
			height = App.Height,
			max_scale = 100000;

		if (!Array.isArray(scale_strategy)) scale_strategy = [scale_strategy];

		if (scale_strategy[0] === 'fit-to-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.min(App.Width / width, App.Height / height);

			if (scale_strategy[3] === false) max_scale = 1;
			else if (scale_strategy[3] === 'pixel-ratio') max_scale = App.PixelRatio;

			if (scale > max_scale) scale = max_scale;

		} else if (scale_strategy[0] === 'fit-to-width') {

			const screen_ratio = App.Width / App.Height;
			const expected_ratio = scale_strategy[1] / scale_strategy[2];

			scale = Math.min(screen_ratio / expected_ratio, 1);

		} else if (scale_strategy[0] === 'cover-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.max(App.Width / width, App.Height / height);

			if (scale_strategy[3] === false) max_scale = 1;
			else if (scale_strategy[3] === 'pixel-ratio') max_scale = App.PixelRatio;

			if (scale > max_scale) scale = max_scale;

		}

		return scale;

	},

	// Внутренний метод который высчитывает значение позиции, масштаба и прочих свойств.
	// Значение свойства может быть указано через функцию или строку, а эта функция преобразует его к числу.
	calculate(value, options = {}) {

		let typeofValue = typeof value;

		if (typeofValue === "number" && "fixedMultiplier" in options) return value * options.fixedMultiplier;

		if (typeofValue !== "string" && typeofValue !== "function" && !Array.isArray(value)) return value;

		if (!value) value = 0;

		if (!Array.isArray(value)) value = [value];

		let result = 0;

		const fixed_multiplier = options.fixedMultiplier || 1;
		const special_multiplier = options.specialMultiplier || 1;
		const initial_value = options.initialValue;
		const width = options.width || App.Width;
		const height = options.height || App.Height;

		_.each(value, part => {

			let typeofPart = typeof part;

			if (typeofPart === 'string') {

				let direction_multiplier = 1;
				let offset_value = false;

				if (part.indexOf('-') === 0) {

					offset_value = true;

					part = part.substr(1);

					direction_multiplier = -1;

				} else if (part.indexOf('+') === 0) {

					offset_value = true;

					part = part.substr(1);

					direction_multiplier = 1;

				}

				if (part === 'width') result += width * special_multiplier * direction_multiplier;

				else if (part === 'height') result += height * special_multiplier * direction_multiplier;

				else if (part.indexOf('width/') === 0) result += width / parseFloat(part.replace('width/', '')) * special_multiplier * direction_multiplier;

				else if (part.indexOf('height/') === 0) result += height / parseFloat(part.replace('height/', '')) * special_multiplier * direction_multiplier;

				else if (part.indexOf('width*') === 0) result += width * parseFloat(part.replace('width*', '')) * special_multiplier * direction_multiplier;

				else if (part.indexOf('height*') === 0) result += height * parseFloat(part.replace('height*', '')) * special_multiplier * direction_multiplier;

				else if (part === 'initial') result += initial_value;

				else if (offset_value) result += initial_value + parseFloat(part) * direction_multiplier;

				else result = part;

			} else if (typeofPart === 'function') {

				const f_result = part.apply(this, []);

				if (typeof f_result === 'string') result = f_result;

				else result += f_result;

			} else if (typeofPart === 'number') {

				result += part * fixed_multiplier;

			} else {

				return part;

			}

		}, this);

		return result;

	},

	valueBySpeed(value_per_second) {

		return value_per_second * (this.updateTimeOffset / 1000);

	},

	// Этот метод показывает все спрайты и контейнеры используя visible свойство корневых контейнеров.
	// Здесь так же происходит подписка на события Game Update и Game Resize, и запуск события showed.
	show(...params) {

		if (!this.isBuild) {

			if (this.buildOnFirstShow) this.build('show');

			else throw new Error(`Screen '${this.Name}' can't be showed before build.`);

		}

		if (this.BLOCK_SHOW_IF_SHOWED && this.showed) return;

		this.showed = true;

		for (let i=0; this._containers[i]; i++) this._containers[i].visible = true;

		this.resize("show");

		Broadcast.on("Game Update", this.update, this);

		Broadcast.on("Game Resize", () => this.resize("game resize"), this);

		this.each(this.Events, (func, name) => {

			if (name.indexOf("permanent:") === -1) {

				if (name.indexOf("global:") > -1) {

					name = name.replace('global:', '');

					Broadcast.on(name, (...params) => {

						func.apply(this, params);

					}, this);

				} else {

					this.on(name, (...params) => {

						func.apply(this, params);

					}, this);

				}

			}

		});

		// Вызывается когда текущий скрин показывается на экране.
		this.call('show', [...params]);

		if (this.Hooks["show"]) this.Hooks["show"].apply(this, [...params]);

		this.checkAssets();

	},

	// Этот метод скрывает все спрайты и контейнеры используя visible свойство корневых контейнеров.
	// Здесь так же происходит отписка от событий Game Update и Game Resize, и запуск события hided.
	hide(...params) {

		this.showed = false;

		for (let i=0; this._containers[i]; i++) this._containers[i].visible = false;

		Broadcast.off("Game Update", this);

		Broadcast.off("Game Resize", this);

		this.each(this.Events, (func, name) => {

			if (name.indexOf("permanent:") === -1) {

				if (name.indexOf("global:") > -1) {

					name = name.replace('global:', '');

					Broadcast.off(name, this);

				} else {

					this.off(name, this);

				}

			}

		});

		// Вызывается когда текущий скрин скрывается.
		this.call('hide', [...params]);

		if (this.Hooks["hide"]) this.Hooks["hide"].apply(this, [...params]);

	},

	resume: function() {

		this.paused = false;

		Broadcast.on("Game Update", this.update, this);

		Broadcast.on("Game Resize", this.resize, this);

		this.call('resume', [...params]);

		if (this.Hooks["resume"]) this.Hooks["resume"].apply(this, [...params]);

	},

	pause: function() {

		this.paused = true;

		Broadcast.off("Game Update", this);

		Broadcast.off("Game Resize", this);

		this.call('pause', [...params]);

		if (this.Hooks["pause"]) this.Hooks["pause"].apply(this, [...params]);

	},

	// Внутренний метод позволяющий загружать ресурсы только когда они покажутся на экране
	checkAssets() {

		if (this.assetsLoadOnShowChecked) return;

		let assets_for_loading = [];

		this.each(this.Assets, asset => {

			if (asset.loadStrategy === 'first show') assets_for_loading.push(asset.name);

		});

		this.assetsLoadOnShowChecked = true;

		let _this = this;

		if (assets_for_loading.length > 0) App.loadAssets(assets_for_loading, () => {

			this.each(_this._childs, child => {

				let child_params = child.params;

				if (child_params.type === 'sprite') {

					if (child.texture === App.emptyTexture) child.texture = this.getTexture(child_params.frame || child_params.image);

				}

			});

		}, {strategy: 'first show'});

	},

	// Возвращает параметры спрайта из дерева контейнеров ({{#crossLink "Screen/Containers:property"}}{{/crossLink}}) по имени.
	getChildParamsByName(name) {

		let child_params = null;

		let iterate = childs_params => {

			for (let i=0, l=childs_params.length; i<l; i++) {

				if (childs_params[i].name === name) child_params = childs_params[i];

				if (child_params) break;

				if (childs_params[i].childs) iterate(childs_params[i].childs);

			}

		};

		iterate(this.Containers);

		return child_params;

	},

	// Устанавливает новые параметры спрайтов в {{#crossLink "Screen/Containers:property"}}{{/crossLink}} секцию по имени объекта, заменяя старые значения
	updateChildParamsByName(new_child_params) {

		if (!new_child_params) return;

		let iterate = exist_childs_params => {

			for (let i=0, l=exist_childs_params.length; i<l; i++) {

				if (new_child_params[exist_childs_params[i].name]) {

					this.merge(exist_childs_params[i], new_child_params[exist_childs_params[i].name]);

				}

				if (exist_childs_params[i].childs) iterate(exist_childs_params[i].childs);

			}

		};

		iterate(this.Containers);

	},

	// Преобразует строковое шестнадцатеричное значение цвета в числовое
	stringColorToDecimal(value) {

		if (typeof value === 'string') {

			if (value.length === 7 && value.indexOf('#') === 0) {

				value = value.replace('#', '');

				value = parseInt(value, 16);

			} else if (value.indexOf('rgba') === 0) {

				value = value.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);

				value = ("0" + parseInt(value[1],10).toString(16)).slice(-2) + ("0" + parseInt(value[2],10).toString(16)).slice(-2) + ("0" + parseInt(value[3],10).toString(16)).slice(-2);

				value = parseInt(value, 16);

			}

		}

		return value;

	},

	decimalColorToHex(decimal) {

		return typeof decimal === 'number' ? ('#' + decimal.toString(16)) : decimal;

	},

	autoplayVideo: function(video_sprite, fn) {

		if (typeof video_sprite === 'string') video_sprite = this[video_sprite];

		MRAID.isAutoplaySupported(this.bind(function(result) {

			if (result === 'muted') {

				video_sprite.video.muted = true;

				video_sprite.play();

			} else if (result) {

				video_sprite.play();

			}

			if (fn) fn.apply(this, [result]);

		}, this));

		return video_sprite;

	},

	getRelativePosition(from_item, for_item) {

		let position = from_item.toGlobal(new PIXI.Point(0, 0));
		position = for_item.parent.toLocal(position);

		return position;

	},

	getDirection(position_start, position_end) {

		const direction = {
			x: position_end.x - position_start.x,
			y: position_end.y - position_start.y
		};

		const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);

		const normalized_direction =  {
			x: direction.x / magnitude,
			y: direction.y / magnitude
		};

		return Math.atan2(normalized_direction.y, normalized_direction.x);

	},

	scaleContainerByMaxWidth(container, max_width) {

		container.scale.set(container.params.scale || 1);

		if (container.width > max_width) {

			const scaleFactor = max_width / container.width;

			container.scale.set(scaleFactor);

		}

	},

	moveContainerByDirection(container, direction, distance) {

		let rotation;

		switch (direction) {

			case 'forward':

				rotation = container.rotation + Math.PI / 2;

				container.x -= Math.cos(rotation) * distance;
				container.y -= Math.sin(rotation) * distance;

				break;

			case 'backward':

				rotation = container.rotation + Math.PI / 2;

				container.x += Math.cos(rotation) * distance;
				container.y += Math.sin(rotation) * distance;

				break;

			case 'right':

				container.x += Math.cos(container.rotation) * distance;
				container.y += Math.sin(container.rotation) * distance;

				break;

			case 'left':

				container.x -= Math.cos(container.rotation) * distance;
				container.y -= Math.sin(container.rotation) * distance;

				break;

		}

	},

	clearAnimation(object) {

		if (object instanceof gsap.core.Animation) {

			object.clear();
			object.kill();
			object = null;

		} else {

			for (let key in object) {

				if (object[key] instanceof gsap.core.Animation) {

					object[key].clear();
					object[key].kill();
					object[key] = null;

				}

			}

		}

	},

	clearTimeout(object) {

		if (object instanceof gsap.core.Tween && typeof object.vars.onComplete === "function") {

			object.kill();
			object = null;

		} else {

			for (let key in object) {

				if (object[key] instanceof gsap.core.Tween && typeof object[key].vars.onComplete === "function") {

					object[key].kill();
					object[key] = null;

				}

			}

		}

	}

}); 

window.ScreenClass = Screen;

export default Screen;