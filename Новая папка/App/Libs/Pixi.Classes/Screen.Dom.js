import Class 	from 'Class';
import Screen 	from 'Screen';

Screen.DOM = Class.mixin(Screen, {

	initialize() {

		this.on('before build', () => {

			//'this' here == instance of Screen class

			_.each(this.Containers, (container_params) => {

				if (container_params.type === 'dom-container') this.buildDOMContainer(container_params);

			});

		}, this, {index: 'Dom'});

		this.on('resize', () => {

			//'this' here == instance of Screen class

			this.resizeDOM();

		}, this, {index: 'Dom'});

		this.on('show', () => {

			_.each(this._dom_containers, dom_container => {

				document.body.appendChild(dom_container.el);

			});

			//this.resizeDOM();

		}, this, {index: 'Dom'});

		this.on('hide', () => {

			_.each(this._dom_containers, dom_container => {

				if (dom_container.el.parentNode) dom_container.el.parentNode.removeChild(dom_container.el);

			});

		}, this, {index: 'Dom'});

	},

	resizeDOM() {

		_.each(this._dom_containers, container => {

			let scale;

			MRAID.processDynamicProperties(container.params, {orientation: this.orientation});

			if (container.params.scaleStrategy) scale = container.scale = this.getDOMScaleByStrategy(container.params.scaleStrategy);

			let size = MraidSDK.getSize(true);

			if (container.params.position) {

				container.x = this.calculate(container.params.position[0], {width: size.width + size.left*2, height: size.height + size.top*2});
				container.y = this.calculate(container.params.position[1], {width: size.width + size.left*2, height: size.height + size.top*2});

			} else {

				container.x = size.width / 2;
				container.y = size.height / 2;

			}

			container.applyTransform();

			let els = [].concat(...container.el.getElementsByTagName('*'));

			container.el.params = container.params;

			els.splice(0, 0, container.el);

			this.scaleStyles(els, scale);

		});

	},

	buildDOMContainer(container_params, z_index) {

		if (!this._dom_containers) this._dom_containers = {};

		const container_name = container_params.name;

		const container = this._dom_containers[container_name] = this[container_name] = {
			params: container_params,
			el: document.createElement('div'),
			els: {},
			x: 0,
			y: 0,
			transformOrigin: container_params.transformOrigin || ['center', 'center'],
			applyTransform: () => {

				container.positionTransform = 'translate('+Math.round(container.x)+'px, '+Math.round(container.y)+'px)';

				const transform_origin = container.transformOrigin.join(' ');
				const transform = container.positionTransform;

				if (transform_origin !== container._transform_origin) {
					container.el.style.transformOrigin = transform_origin;
					container._transform_origin = transform_origin;
				}

				if (transform !== container._transform) {
					container.el.style.WebkitTransform = transform;
					container.el.style.transform = transform;
					container._transform = transform;
				}

			}
		};

		container.el.className = 'dom-container ' + container_name.toLowerCase();

		container.name = container_name;

		container.width = container_params.width;

		container.height = container_params.height;

		container.scale = container_params.scale;

		container.el.style.position = 'fixed';
		container.el.style.left = '0px';
		container.el.style.top = '0px';
		container.el.style.width = '100vw';
		container.el.style.height = '100vh';
		container.el.style.zIndex = 100;

		MRAID.extendStyles(container.el, container_params.styles);

		this.buildDOMChilds(container_name, container_params.childs);

		return container;

	},

	buildDOMChilds(container_name, dom_childs) {

		_.each(dom_childs, params => {

			const dom_structure = this.createDOMStructure(params);

			dom_structure.name = params[1];

			dom_structure.params = params;

			this._dom_containers[container_name].el.appendChild(dom_structure.el);

			_.extend(this._dom_containers[container_name].els, dom_structure.els);

		}, this);

	},

	createDOMStructure(params, els) {

		if (!els) els = {};

		if (_.isString(params)) {

			let text = document.createTextNode(params);

			return {el: text, els: els};

		}

		if (_.isObject(params[2]) && params[2].template) return this.registerDOMObjectPool(params[1], params);

		let el = document.createElement(params[0]);

		el.params = _.extend({}, params[2]);

		if (!el.params.scale) el.params.scale = {};

		el.className = params[1];

		if (!els[el.className]) els[el.className] = el;
		else if (_.isArray(els[el.className])) els[el.className].push(el);
		else els[el.className] = [els[el.className], el];

		if (_.isObject(params[2])) {

			if (params[2].event) this.applyDOMEvents(el, params[2].event, params);

			if (params[2].attr) this.applyDOMAttributes(el, params[2].attr);

		}

		let last_param = params[params.length-1];

		if (_.isString(last_param) && params.length > 2) {

			el.params.text = last_param;

			this.setDOMText(el, last_param, el.params.noWarnings);

		} else if (_.isArray(last_param)) _.each(last_param, params => {

			let inner_dom_structure = this.createDOMStructure(params, els);

			if (inner_dom_structure) el.appendChild(inner_dom_structure.el);

		});

		return {el: el, els: els};

	},

	getDOMScaleByStrategy(scale_strategy) {

		const
			real_width = MraidSDK.getSize().width,
			real_height = MraidSDK.getSize().height;

		let scale = 1,
			width = real_width,
			height = real_height,
			max_scale = 100000;

		if (!_.isArray(scale_strategy)) scale_strategy = [scale_strategy];

		if (scale_strategy[0] === 'fit-to-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.min(real_width / width, real_height / height);

			if (scale_strategy[3] === false) max_scale = 1;
			else if (scale_strategy[3] === 'pixel-ratio') max_scale = App.PixelRatio;

			if (scale > max_scale) scale = max_scale;

		} else if (scale_strategy[0] === 'cover-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.max(real_width / width, real_height / height);

			if (scale_strategy[3] === false) max_scale = 1;
			else if (scale_strategy[3] === 'pixel-ratio') max_scale = App.PixelRatio;

			if (scale > max_scale) scale = max_scale;

		}

		return scale;

	},

	applyDOMEvents(el, event_params, child_params) {

		if (_.isString(event_params)) event_params = {name: event_params};

		let code = event_params.name;

		if (App.IsTouchDevice) {

			el.addEventListener("touchstart", e => {

				let clickPos = Screen.DOM.getMousePositionDistance(e);

				this.setAttribute('clickPos', clickPos);

				this.call(`${code} down`, [e, el]);

			}, false);

			el.addEventListener("touchend", e => {

				let clickPos = Screen.DOM.getMousePositionDistance(e);

				if (Math.abs(parseFloat(this.getAttribute('clickPos')) - clickPos) < 20) this.call(`${code} click`, [e, el]);

			}, false);

			el.addEventListener("touchmove", e => {

				this.call(`${code} move`, [e, el, child_params]);

			}, false);

		} else {

			el.addEventListener("mouseover", e => {

				this.call(`${code} over`, [e, el, child_params]);

			}, false);

			el.addEventListener("mouseout", e => {

				this.call(`${code} out`, [e, el, child_params]);

			}, false);

			el.addEventListener("mousemove", e => {

				this.call(`${code} move`, [e, el, child_params]);

			}, false);

			el.addEventListener("mousedown", e => {

				this.call(`${code} down`, [e, el, child_params]);

			}, false);

			el.addEventListener("mouseup", e => {

				Screen.PressEndEvents.push(code);

				this.call(`${code} up`, [e, el, child_params]);

			}, false);

			el.addEventListener("click", e => {

				this.call(`${code} click`, [e, el, child_params]);

			}, false);

		}

		el.addEventListener("change", e => {

			this.call(`${code} change`, [e, el, child_params]);

		}, false);

		el.addEventListener("keypress", e => {

			this.call(`${code} keypress`, [e, el, child_params]);

		}, false);

		el.addEventListener("keydown", e => {

			this.call(`${code} keydown`, [e, el, child_params]);

		}, false);

		el.addEventListener("keyup", e => {

			this.call(`${code} keyup`, [e, el, child_params]);

		}, false);

	},

	getMousePositionDistance(e) {

		e = e || window.event;

		let pageX, pageY;

		if (e.changedTouches && e.changedTouches[0]) {

			pageX = e.changedTouches[0].pageX;

			pageY = e.changedTouches[0].pageY;

		} else {

			pageX = e.pageX;

			pageY = e.pageY;

		}

		if (pageX === undefined) {

			if ('clientX' in e) {

				pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;

				pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;

			}

		}

		return Math.sqrt(pageX * pageX + pageY * pageY);

	},

	applyDOMAttributes(el, attributes) {

		_.each(attributes, (value, name) => {

			el.setAttribute(name, this.value(value));

		});

	},

	scaleStyles(els, scale) {

		// console.log('scaleStyles', els, scale);

		const custom_params = ['position', 'anchor'];

		_.each(els, inner_els => {

			if (!_.isArray(inner_els)) inner_els = [inner_els];

			_.each(inner_els, el => {

				//User can put any element inside our DOM structure - we must ignore these elements without params
				if (!el.params) return;

				MRAID.processDynamicProperties(el.params, {orientation: this.orientation});
				MRAID.processDynamicProperties(el.params.scale, {orientation: this.orientation});

				MRAID.extendStyles(el, el.params.styles);

				el._scale = scale || el._scale;

				const styles = el.params.scale;

				// Скейлим типичные стили
				_.each(styles, (style_params, style) => {

					if (custom_params.indexOf(style) === -1) this.scaleStyle(el, style, style_params, el._scale);

				});

				setTimeout(() => {

					el.style.userData = {
						position: [0, 0],
						anchor: [0, 0]
					};

					_.each(styles, (style_params, style) => {

						if (custom_params.indexOf(style) === -1) return;

						if (!_.isArray(style_params)) style_params = [style_params];

						if (style === 'position') {

							let size = MraidSDK.getSize();

							let coords = _.map(style_params, coord => {

								return Math.round(this.calculate(coord, {fixedMultiplier: scale, width: size.width, height: size.height}));

							});

							// console.log('position', style_params, coords, scale);

							const anchor = el.style.userData.anchor;
							const position = [parseInt(coords[0]), parseInt(coords[1])];

							el.style.userData.position = position;

							el.style['transform'] = `translate(${-anchor[0] + position[0]}px, ${-anchor[1] + position[1]}px)`;

						} else if (style === 'anchor') {

							const offset_x = el.offsetWidth * style_params[0];
							const offset_y = el.offsetHeight * style_params[1];

							const anchor = [offset_x, offset_y];
							const position = el.style.userData.position;

							el.style.userData.anchor = anchor;

							el.style['transform'] = `translate(${-anchor[0] + position[0]}px, ${-anchor[1] + position[1]}px)`;

						}

					});

				}, 0);

			});

		});

	},

	scaleStyle(el, style, style_params, scale) {

		if (!_.isArray(style_params)) style_params = [style_params];

		let size = MraidSDK.getSize();

		let values = _.map(style_params, (style_param) => {

			return this.calculate(style_param, {fixedMultiplier: scale, width: size.width, height: size.height});

		});

		values = _.map(values, (value) => {

			if (_.isNumber(value)) return ((value > 0) ? Math.ceil(value) : Math.floor(value)) + 'px';

			else return value;

		});

		el.style[style] = values.join(' ');

		//console.log(el, style, style_params, scale, values, values.join(' '));

	},

	setDOMText(el, codename, no_warnings = false) {

		if (!this.getMessage) throw new Error('Screen.Text is needed for the Screen.Dom texts manipulations!');

		let styles = this.getMessage(codename, no_warnings);

		if (_.isString(styles)) styles = {text: styles};

		let sprite_params_styles = el.params.styles;

		styles = _.extend({}, sprite_params_styles, styles);

		this.setDOMTextStyles(el, styles);

	},

	setDOMTextStyles(el, styles) {

		MRAID.processDynamicProperties(styles, {orientation: this.orientation});

		this.transformDOMTextStyles(styles);

		this.setStyles(el, styles);

		if (typeof styles.text === 'string' || typeof styles.text === 'number') el.innerHTML = styles.text;

		//this.applyParams(sprite, _.pick(styles, ["position", "scale", "anchor", "rotation"]));

	},

	transformDOMTextStyles(styles) {

		let stylesInPixels = ['fontSize', 'letterSpacing', 'wordWrapWidth', 'lineHeight', 'padding'];

		stylesInPixels.forEach((style) => {

			if ((styles[style] && styles[style] !== 'normal' && styles[style] !== 'auto') || styles[style] === 0) styles[style] += 'px';

		});

		if (styles.fill) styles.color = styles.fill;

		if (styles['breakWords'] === true) {

			styles['wordBreak'] = 'break-all';

		} else if (styles['breakWords'] === false) {

			styles['wordBreak'] = 'normal';

		}

		if (styles['wordWrap'] === true) {

			styles['wordWrap'] = 'break-all';

		} else if (styles['wordWrap'] === false) {

			styles['wordWrap'] = 'normal';

		}

		if (styles['wordWrapWidth']) {

			styles['width'] = styles['wordWrapWidth'];

		}

		if (styles['dropShadow']) {

			if (!styles.dropShadowAlpha) styles.dropShadowAlpha = 1;
			if (!styles.dropShadowColor) styles.dropShadowColor = "#000000";
			if (!styles.dropShadowAngle) styles.dropShadowAngle = 0.53;
			if (!styles.dropShadowBlur) styles.dropShadowBlur = 0;
			if (!styles.dropShadowDistance) styles.dropShadowDistance = 5;

			let x = styles.dropShadowDistance * Math.cos(styles.dropShadowAngle / (Math.PI / 180));
			let y = styles.dropShadowDistance * Math.sin(styles.dropShadowAngle / (Math.PI / 180));

			if (!styles.filter) {

				styles.filter = '';

			} else {

				styles.filter += ' ';

			}

			styles.filter += 'drop-shadow(' + x + 'px ' + y + 'px ' + styles.dropShadowBlur + 'px ' + styles.dropShadowColor + ')';

		}

	},

	setStyles(el, styles) {

		_.extend(el.params.scale, styles);

		let scale;

		let container = el;

		while (container.parentElement) {

			if (container.params && container.params.scaleStrategy) {

				scale = this.getDOMScaleByStrategy(container.params.scaleStrategy);

				break;

			}

			container = container.parentElement;

		}

		this.scaleStyles([el], scale);

	},

	registerDOMObjectPool(pool_name, dom_objects_props) {

		if (!this._dom_object_pools) this._dom_object_pools = {};

		dom_objects_props = _.clone(dom_objects_props);

		delete dom_objects_props[2].template;

		this._dom_object_pools[pool_name] = {
			name: pool_name,
			domObjectProps: dom_objects_props,
			domObjects: []
		};

	},

	getDOMObjectFromPool(pool_name) {

		let pool = this._dom_object_pools[pool_name];

		let objects = pool.domObjects,
			free_object = null;

		_.each(objects, object => {

			if (!object.el.parentNode) free_object = object;

		});

		if (free_object) {

			return free_object;

		}

		return this.createDOMObjectForPool(pool_name);

	},

	createDOMObjectForPool(pool_name) {

		let pool = this._dom_object_pools[pool_name];

		let dom_object = this.createDOMStructure(pool.domObjectProps);

		pool.domObjects.push(dom_object);

		return dom_object;

	},

	removePoolDOMObjects(pool_name, parent) {

		this.eachPoolDOMObjects(pool_name, parent, object => {

			object.el.parentNode.removeChild(object.el);

		});

	},

	eachPoolDOMObjects(pool_name, parent, next) {

		let pool = this._dom_object_pools[pool_name];

		let pool_objects = pool.domObjects;

		_.each(pool_objects, object => {

			if (object.el.parentNode && (parent === true || object.el.parentNode === parent)) next.apply(this, [object]);

		});

	}

});

Screen.PressEndEvents = [];

Broadcast.on("Document Press Up", e => {

	Broadcast.call("Global Press End", [e, Screen.PressEndEvents]);

	Screen.PressEndEvents = [];

}, "Screen.Dom");