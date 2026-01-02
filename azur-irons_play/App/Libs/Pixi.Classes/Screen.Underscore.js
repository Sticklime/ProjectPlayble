import Class 				from 'Class';
import Screen 				from 'Screen';

Class.mixin(Screen, {

	initialize() {

		/**
		 en: This property contains unique ids for the uniqueId() method
		 ru: Свойство хранящее счётчики уникальных индентификаторов для метода uniqueId()

		 @private
		 @property uniqueIds
		 @for Screen
		 */
		this.uniqueIds = {};
		this.ignoringTimeouts = {};

		// Линейная интерполяция. Возвращает значение между value1 и value2 в зависимости от amount, которое может быть 0..1
		Math.lerp = function (value1, value2, amount) { return value1 + (value2 - value1) * amount; };
		// Обратная линейная интерполяция - возвращает значение 0..1
		// Удобно использовать в сочетании с линейной, когда нужно менять один параметр в зависимости от другого. Например:
		// let heroSpeed = Math.lerp( 150, 360, Math.unlerp( this.MIN_GAME_SPEED, this.MAX_GAME_SPEED, this.currentGameSpeed ) )
		Math.unlerp = function (value1, value2, amount) { return (amount - value1) / (value2 - value1); };
		// Квадратичная интерполяция. Возвращает значение между "a" и "c" с учётом веса "b", в зависимости от "x" (0..1)
		// Т.е. график функции выглядит, как кривая безье первого порядка, в которой кривизна определяется "b"
		// Удобно использовать для управляемого движения объекта по "параболической" кривой
		Math.qarp = function (a, b, c, x) { return Math.lerp(Math.lerp(a, b, x), Math.lerp(b, c, x), x); };
		Math.clamp = function(x, b, c) { return Math.max(b, Math.min(c, x)); };
		Math.clamp01 = function(x) { return Math.clamp(x, 0, 1); };

		// возвращает угол в радианах в пределах Math.PI * 2,
		// т.е. например, если а = Math.PI * 2 + 0.523599 (360 + 30 град.), то Math.clampAngle(Math.PI * 2 + 0.523599) вернёт 0.52359 (30 град.)
		Math.clampAngle = (a) => {
			a %= Math.PI * 2;
			if (a < 0) a += Math.PI * 2;
			return a;
		};

		_.chunk = function(arr, len) {

		  var chunks = [],
			  i = 0,
			  n = arr.length;

		  while (i < n) {
			chunks.push(arr.slice(i, i += len));
		  }

		  return chunks;

		};

		_.keysInt = (object) => {

			return _.map(_.keys(object), v => parseInt(v));

		};

		_.mapKeys = function(object, func) {

			let result = {};

			_.each(object, (value, key) => {

				result[func(value, key)] = value;

			});

			return result;

		};

		// возвращает угол в радианах в пределах Math.PI * 2,
		// т.е. например, если а = Math.PI * 2 + 0.523599 (360 + 30 град.), то Math.clampAngle(Math.PI * 2 + 0.523599) вернёт 0.52359 (30 град.)
		Math.clampAngle = (a) => {
			a %= Math.PI * 2;
			if (a < 0) a += Math.PI * 2;
			return a;
		};

		Math.randomFloat = function() {
			return App.Gameplay.randomFloat(...arguments);
		};

		if (window.THREE) {

			// расширение для всех THREE объектов, которые наследуются от Object3D, которое позволяет управлять прозрачностью без залезания в ...material.opacity = ..
			THREE.Object3D.prototype._opacity = 1;

			Object.defineProperty(THREE.Object3D.prototype, 'opacity', {
				get: function() {
					return this._opacity;
				},
				set: function(val){
					this._opacity = val;

					this.traverse(node => {
						if (node.material) {
							node.material.opacity = node.params && node.params.opacity ? val * node.params.opacity : val;
							node.material.transparent = true;
						}
					});
				}
			});

			Object.defineProperty(THREE.Object3D.prototype, 'alpha', {
				get: function() {
					return this._opacity;
				},
				set: function(val){
					this._opacity = val;

					this.traverse(node => {
						if (node.material) {
							node.material.opacity = node.params && node.params.opacity ? val * node.params.opacity : val;
							node.material.transparent = true;
						}
					});
				}
			});

			Object.defineProperty(THREE.Object3D.prototype, 'x', {
				get: function() { return this.position.x; },
				set: function(val){ this.position.x = val; }
			});
			Object.defineProperty(THREE.Object3D.prototype, 'y', {
				get: function() { return this.position.y; },
				set: function(val){ this.position.y = val; }
			});
			Object.defineProperty(THREE.Object3D.prototype, 'z', {
				get: function() { return this.position.z; },
				set: function(val){ this.position.z = val; }
			});

			Object.defineProperty(THREE.Object3D.prototype, 'rotationZ', {
				get: function() { return this.rotation.z; },
				set: function(val){ this.rotation.z = val; }
			});

			Object.defineProperty(THREE.Object3D.prototype, 'scaleX', {
				get: function() { return this.scale.x; },
				set: function(val){ this.scale.x = val; }
			});
			Object.defineProperty(THREE.Object3D.prototype, 'scaleY', {
				get: function() { return this.scale.y; },
				set: function(val){ this.scale.y = val; }
			});
			Object.defineProperty(THREE.Object3D.prototype, 'scaleXY', {
				get: function() { return this.scale.x; },
				set: function(val){ this.scale.x = this.scale.y = val; }
			});
			Object.defineProperty(THREE.Object3D.prototype, 'scaleXYZ', {
				get: function() { return this.scale.x; },
				set: function(val){ this.scale.x = this.scale.y = this.scale.z = val; }
			});

			Object.assign(THREE.BufferGeometry.prototype, {
				getAttribute: function getAttribute(name) {
					return this.attributes[name];
				},
				setAttribute: function setAttribute(name, attribute) {
					this.attributes[name] = attribute;
					return this;
				},
				deleteAttribute: function deleteAttribute(name) {
					delete this.attributes[name];
					return this;
				},
				hasAttribute: function hasAttribute(name) {
					return this.attributes[name] !== undefined;
				}
			});

		}

	},

	bind(fn) {

		if (!fn) return fn;

		var _this = this;

		return function() {

			fn.apply(_this, arguments);

		};

	},

	timeout(fn, time = 0, factor_name = null) {

		if (!fn) return;

		let name = this.Name === 'CallToAction' ? 'end-screen' : this.Name;

		let factor = Settings['tween-factor-' + name.toLowerCase()] || 1;

		if (factor_name) factor = Settings['tween-factor-' + factor_name] || 1;

		if (time) return gsap.delayedCall((time / 1000) * factor, fn.bind(this));

		return fn.apply(this);

	},

	// Запускаем переданную функцию максимум 1 раз в указанное время
	// Все вызовы этой функции в течение указанного времени объединятся в один вызов
	ignoringTimeout(key, time, fn, options = {}) {

		if (!this.ignoringTimeouts[key]) {

			this.ignoringTimeouts[key] = {

				timeout: this.timeout(() => {

				    // Если не указано запускать функцию до таймаута - запускаем её после таймаута
					if (!options.callFirst) this.ignoringTimeouts[key].func();

					this.ignoringTimeouts[key] = null;

				}, time),

				func: fn,
				count: 1

			};

			// Если указано запускать функцию до таймаута - запускаем
			if (options.callFirst) this.ignoringTimeouts[key].func();

		} else {

			this.ignoringTimeouts[key].func = fn;
			this.ignoringTimeouts[key].count++;

		}

	},

	interval(fn, time) {

		return setInterval(this.bind(fn), time);

	},

	clear(timeout) {

		clearTimeout(timeout);
		clearInterval(timeout);

	},

	each(obj, fn, context) {

		if (!obj) return;

		var i;

		if (this.isArray(obj)) {

			for (i = 0; i < obj.length; i++) {

				fn.call(context || this, obj[i], i);

			}

		} else {

			for (i in obj) if (Object.prototype.hasOwnProperty.call(obj, i)) {

				fn.call(context || this, obj[i], i);

			}

		}

	},

	indexBy(array, key) {

		var result = {};

		this.each(array, function(value) {

			result[value[key]] = value;

		});

		return result;

	},

	isObject(obj) {

		return typeof obj === 'object' && obj !== null && !(obj instanceof Array);

	},

	isArray(obj) {

		return obj instanceof Array;

	},

	extend(obj1, obj2) {

		this.each(obj2, function(value, key) {

			obj1[key] = value;

		});

		return obj1;

	},

	merge(out) {

		out = out || {};

		for (var i = 1, len = arguments.length; i < len; ++i) {

			var obj = arguments[i];

			if (!obj) {
				continue;
			}

			for (var key in obj) {

				if (!obj.hasOwnProperty(key)) {
					continue;
				}

				if (this.isObject(obj[key])) {
					out[key] = this.merge(out[key], obj[key]);
					continue;
				}

				out[key] = obj[key];

			}

		}

		return out;

	},

	filter(array, fn) {

		var result = [];

		this.each(array, function(value, key) {

			if (fn.call(this, value, key)) result.push(value);

		});

		return result;

	},

	sample(array) {

		if (!array) return null;

		if (!this.isArray(array)) array = this.values(array);

		return array[Math.floor(Math.random() * array.length)];

	},

	pluck(obj, key) {

		var result = [];

		this.each(obj, function(value) {

			result.push(value[key]);

		});

		return result;

	},

	shuffle(array) {

		array = array.concat([]);

		var j, x, i;

		for (i = array.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = array[i];
			array[i] = array[j];
			array[j] = x;
		}

		return array;

	},

	random(min, max) {

		return Math.floor(Math.random() * (max - min + 1)) + min;

	},

	randomFloat(min, max) {

		return Math.random() * (max - min) + min;

	},

	isEqual(arr1, arr2) {

		var result = arr1 && arr2 && arr1.length === arr2.length;

		if (!result) return false;

		for (var i = arr1.length - 1; i >= 0; i--) {

			if (arr1[i] !== arr2[i]) result = false;

		}

		return result;

	},

	values(obj) {

		var result = [];

		this.each(obj, function(value) {

			result.push(value);

		});

		return result;

	},

	value(obj, args) {

		if (typeof obj === 'function') return obj.apply(this, args);

		else return obj;

	},

	uniqueId(name) {

		if (!this.uniqueIds[name]) this.uniqueIds[name] = 0;

		return (name || '') + this.uniqueIds[name]++;

	},

	clone(object) {

		return JSON.parse(JSON.stringify(object));

	},

	getDistance(point1, point2) {

		if (typeof point1 === 'number' && typeof point2 === 'number') return Math.sqrt(Math.pow(point1, 2) + Math.pow(point2, 2));

		if (Array.isArray(point1) && Array.isArray(point2)) return Math.sqrt(Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2));

		else return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));

	},

	getDistanceSquared(point1, point2) {

		if (typeof point1 === 'number' && typeof point2 === 'number') return point1 * point1 + point2 * point2;

		if (Array.isArray(point1) && Array.isArray(point2)) return Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2);

		else return Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2);

	},

	getAngle(point1, point2) {

		return Math.atan2(point2.y - point1.y, point2.x - point1.x);

	},

	/*
	* Порядок отсчета слева направо, сверху вниз (сначала строка, потом столбец)
	* */
	idToVec(id, dimension) {

		return [id % dimension[0], Math.floor(id / dimension[0])];

	},

	/*
	* Порядок отсчета слева направо, сверху вниз (сначала строка, потом столбец)
	* */
	vecToId(vec, dimension) {

		if (Array.isArray(vec)) return vec[1] * dimension[0] + vec[0];
		else return vec.y * dimension[0] + vec.x;

	},

	/*
	* Порядок отсчета слева направо, сверху вних (сначала строка, потом столбец)
	* */
	isVecInDimension(vec, dimension) {

		return vec[0] >= 0 && vec[0] < dimension[0] && vec[1] >= 0 && vec[1] < dimension[1];

	},

	/*
	* Ищет все связанные между собой точки по направлениям directions (по умолчанию [left, down, right, up])
	* функция проверки связанности isConnectFunc принимает 2 параметра: currentCell - текущая ячейка, parentCell - родительская ячейка
	* функция borderCheck проверяет находится ли ячейка в поле, если нет, то по умолчанию клетка не проверяется в isConnectFunc. Если установить borderCheck = null, то клетки будут передаваться в isConnectFunc
	* возвращает массив векторов. Если нет клеток за краями поля, можно преобразовывать результат в ид с помощью ".map(item => this.vecToId(item, dimension))"
	* */
	getConnectedCells(cellVec, isConnectFunc, dimension, options = {}) {

		let {
			directions = [[0, -1],[1, 0],[0, 1],[-1, 0]],
			borderCheck = this.isVecInDimension
		} = options;

		if (typeof borderCheck !== 'function') borderCheck = () => true;

		const usedCells = {
			[cellVec.toString()]: cellVec
		};

		const stack = [
			{vec: cellVec, directions: directions.slice()}
		];

		stackLoop: while (stack.length) {

			const parentCell = stack[stack.length - 1];

			const parentCellVec = parentCell.vec;

			while (parentCell.directions.length) {

				const direction = parentCell.directions.pop();

				const nextCellVec = [parentCellVec[0] + direction[0], parentCellVec[1] + direction[1]];

				if (!usedCells[nextCellVec.toString()] && borderCheck(nextCellVec, dimension) && isConnectFunc(nextCellVec, parentCellVec)) {

					usedCells[nextCellVec.toString()] = nextCellVec;

					stack.push({vec: nextCellVec, directions: directions.slice()});

					continue stackLoop;

				}

			}

			stack.pop();

		}

		return _.values(usedCells);

	},


	centerContainersByX(containersArr, between = 20, options = {}) {

		if (!containersArr) return;

		containersArr = containersArr.map((container) => {return typeof container === "string" ? this[container] : container});

		if (!Array.isArray(between)) between = containersArr.map(() => { return between });

		let containersWidth = 0;

		_.each(containersArr, (container, ind) => {
			containersWidth += (options.containerWidth || (container.textCharsInstance ? container.textCharsInstance.width : container.width)) + (between[ind] || 0);
			//if (options.debug) console.log(container.params.name, (container.textCharsInstance ? container.textCharsInstance.width : container.width));
		});

		containersWidth -= (between[between.length - 1] || 0);

		let leftX = -containersWidth / 2;

		if (options.align === "left") leftX = 0;
		else if (options.align === "right") leftX = -containersWidth;

		_.each(containersArr, (container, ind) => {

			let x = Math.round(leftX + (options.containerWidth || (container.textCharsInstance ? container.textCharsInstance.width : container.width)) / 2);

			if (options.duration) {

				this.animate(
					0.00, container.position, {x, duration: options.duration, e: "power2.inOut"}
				)

			} else {

				container.x = x;

			}

			if (container.params && container.params.position) container.params.position[0] = x;
			leftX = x + (options.containerWidth || (container.textCharsInstance ? container.textCharsInstance.width : container.width)) / 2 + (between[ind] || 0);

		});

	},

	centerContainersByY(containersArr, between = 20, options = {}) {

		if (!containersArr) return;

		containersArr = containersArr.map((container) => {return typeof container === "string" ? this[container] : container});

		if (!between && options.fitHeight) {

			let contentHeight = 0;

			_.each(containersArr, (container, ind) => {
				contentHeight += (options.containerHeight || container.height);
			});

			between = Math.round((options.fitHeight - contentHeight) / containersArr.length);

		}

		if (!Array.isArray(between)) between = containersArr.map(() => { return between });

		let containersHeight = 0;

		_.each(containersArr, (container, ind) => {
			containersHeight += (options.containerHeight || container.height) + (between[ind] || 0);
		});

		containersHeight -= (between[between.length - 1] || 0);

		let leftY = -containersHeight / 2;

		_.each(containersArr, (container, ind) => {
			container.y = Math.round(leftY + (options.containerHeight || container.height) / 2);
			if (container.params && container.params.position) container.params.position[1] = container.y;
			leftY = container.y + (options.containerHeight || container.height) / 2 + (between[ind] || 0);
		});
	}

}); 
