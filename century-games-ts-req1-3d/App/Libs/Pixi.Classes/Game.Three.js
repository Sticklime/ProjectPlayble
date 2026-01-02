import { EmbeddedDRACOLoader } from 'EmbeddedDRACOLoader';
import Class from 'Class';
import Game from 'Game';

Class.mixin(Game, {

	IsCreateGame: true,
	MaximumThreeRenderSize: 2048 * 2048,

	/*
	//Add this section to game where you want to use 3d
	World: {
		antialias: true,
		alpha: true,
		events: true,
		camera: {
			type: 'PerspectiveCamera',
			params: {near: 10, far: 5000, position: [400, 500, 2000]}
		},
		camera: {
			type: 'OrthographicCamera',
			params: {left: -500, right: 500, top: 500, bottom: -500, near: 0.1, far: 5000, position: [400, 500, 2000]}
		},
		controls: {
			type: 'OrbitControls',
			params: {rotateSpeed: 0.15, enableZoom: false, enableDamping: true, dampingFactor: 0.1, enablePan: false, minOperatingState: 15}
		},
		controls: {
			type: 'TrackballControls',
			params: {rotateSpeed: 5.0, zoomSpeed: 1.2, panSpeed: 0.8, noZoom: false, noPan: false, staticMoving: true, dynamicDampingFactor: 0.3}
		}
	},
	*/

	async prepareThreeEngine() {

		THREE.AnimationUtils.subclip = function ( sourceClip, name, startFrame, endFrame, fps ) {

			fps = fps || 24;

			let clip = sourceClip.clone();

			clip.name = name;

			let tracks = [];

			for ( var i = 0; i < clip.tracks.length; ++ i ) {

				var track = clip.tracks[ i ];
				var valueSize = track.getValueSize();

				var times = [];
				var values = [];

				for ( var j = 0; j < track.times.length; ++ j ) {

					var frame = track.times[ j ] * fps;

					if ( frame < startFrame || frame >= endFrame ) continue;

					times.push( track.times[ j ] );

					for ( var k = 0; k < valueSize; ++ k ) {

						values.push( track.values[ j * valueSize + k ] );

					}

				}

				if ( times.length === 0 ) continue;

				track.times = THREE.AnimationUtils.convertArray( times, track.times.constructor );
				track.values = THREE.AnimationUtils.convertArray( values, track.values.constructor );

				tracks.push( track );

			}

			clip.tracks = tracks;

			// find minimum .times value across all tracks in the trimmed clip

			var minStartTime = Infinity;

			for ( var i = 0; i < clip.tracks.length; ++ i ) {

				if ( minStartTime > clip.tracks[ i ].times[ 0 ] ) {

					minStartTime = clip.tracks[ i ].times[ 0 ];

				}

			}

			// shift all tracks such that clip begins at t=0

			for ( var i = 0; i < clip.tracks.length; ++ i ) {

				clip.tracks[ i ].shift( - 1 * minStartTime );

			}

			clip.resetDuration();

			return clip;

		};

		if (gsap) {
			if (typeof PixiPlugin !== "undefined") gsap.registerPlugin(PixiPlugin);
			if (typeof MotionPathPlugin !== "undefined") gsap.registerPlugin(MotionPathPlugin);
			gsap.ticker.fps(60);
		}

	},

	loadThreeSources(loader) {

		loader.check();

	},

	loadThreeImages(loader, assets) {

		this.loadThreeTextures(assets).then(() => {

			loader.states['image'] = 'ready';

			loader.check();

		});

	},

	loadThreeTextures(assets) {

		return new Promise(resolve => {

			App.ThreeAssets = App.ThreeAssets || {};

			App.ThreeLoaders = App.ThreeLoaders || {};

			if (assets && assets.length > 0) {

				const loaders = [];

				this.each(assets, function(asset) {

					if (!window.THREE) throw new Error(`Connect three.js to load "${asset.name}" asset`);

					const three_loader = new THREE.TextureLoader().setCrossOrigin('*');

					let url = asset.url;

					loaders.push(new Promise(resolve => {

						App.ThreeLoaders[asset.name] = three_loader.load(url, object => {
						  object.colorSpace = THREE[asset.colorSpace ?? "SRGBColorSpace"];
							App.ThreeAssets[asset.name] = object;

							resolve();

						}, () => {}, error => {

							console.error(error);

						});

					}));

				});

				Promise.all(loaders)
					.then(() => resolve());

			} else resolve();

		});

	},

	loadThreeAtlases(loader, assets) {

		if (window.THREE) THREE.Cache.enabled = true;

		if (assets && assets.length > 0) {

			new Promise(resolve => {

				App.ThreeAssets = App.ThreeAssets || {};

				App.ThreeLoaders = App.ThreeLoaders || {};

				const loaders = [];

				this.each(assets, function(asset) {

					if (!window.THREE) throw new Error(`Connect three.js to load "${asset.name}" asset`);

					const three_json_loader = new THREE.FileLoader();

					let url = asset.url;

					loaders.push(new Promise(resolve => {

						three_json_loader.setResponseType('json');

						if (asset.json) {

							App.ThreeAssets[asset.name] = {};

							App.ThreeAssets[asset.name].json = asset.json;

							if (asset.image.indexOf('data:') !== 0) {

								url = url.substr(0, url.lastIndexOf('/')) + '/' + asset.image + (Settings["version"] ? "?v=" + Settings["version"] : '');

							} else {

								url = asset.image;

							}

							const three_loader = new THREE.TextureLoader().setCrossOrigin('*');

							if (/(data:)/.test(url)) {

								url = 'data:' + url.split('data:')[1];

							}

							loaders.push(new Promise(resolve => {

								App.ThreeLoaders[asset.name + ' image'] = three_loader.load(url, image => {

									App.ThreeAssets[asset.name].image = image;

									this.parseThreeSpritesheet(App.ThreeAssets[asset.name], () => {
										resolve();
									});

								}, () => {
								}, error => {

									console.error(error);

								});

							}).then(() => resolve()));

						} else {

							App.ThreeLoaders[asset.name + ' json'] = three_json_loader.load(url, object => {

								if (object.meta) {

									App.ThreeAssets[asset.name] = {};

									App.ThreeAssets[asset.name].json = object;

									url = url.replace(/[^/]+$/ig, object.meta.image);

									const three_loader = new THREE.TextureLoader().setCrossOrigin('*');

									if (/(data:)/.test(url)) {

										url = 'data:' + url.split('data:')[1];

									}

									loaders.push(new Promise(resolve => {

										App.ThreeLoaders[asset.name + ' image'] = three_loader.load(url, image => {

											App.ThreeAssets[asset.name].image = image;

											this.parseThreeSpritesheet(App.ThreeAssets[asset.name], () => {
												resolve();
											});

										}, () => {
										}, error => {

											console.error(error);

										});

									}).then(() => resolve()));

								} else {

									throw new Error(`Wrong json in "${asset.name}" asset`);

								}

								// resolve();

							}, () => {
							}, error => {

								console.error(error);

							});

						}

					}));

				});

				Promise.all(loaders)
					.then(() => resolve() );

			}).then(() => {

				loader.states['atlas'] = 'ready';

				loader.check();

			});

		} else {

			loader.states['atlas'] = 'ready';

			loader.check();

		}

	},

	loadThreeModel(assets) {

		return new Promise(resolve => {

			if (!assets || !assets.length) return resolve();

			assets.forEach(asset => asset.order = typeof asset.order === 'number' ? asset.order : Infinity);

			const orderGroups = [];

			assets.forEach(asset => {

				const order = asset.order;

				let group = orderGroups.find(group => group.order === order);

				if (!group) orderGroups.push({order: order, assets: [asset]});
				else group.assets.push(asset);

			});

			orderGroups.sort((a, b) => b.order - a.order);

			function loadModelOrderGroup(group) {

				const loaders = group.map(async (asset) => {

					const manager = new THREE.LoadingManager();

					manager.setURLModifier((url) => {

						if (url.split('.').pop() === 'png' || url.split('.').pop() === 'jpg') {

							const name = url.split('/').pop();

							if (!App.Assets[name]) throw new Error(`FBX file require "${name}" source. Add this asset to settings Assets.`);

							url = App.Assets[name].url;

						}

						return url;

					});

					let three_loader;

					if (asset.type === 'fbx') three_loader = new FBXLoader(manager).setCrossOrigin('*');
					else if (asset.type === 'glb') {
					  three_loader = new GLTFLoader(manager).setCrossOrigin('*')
						three_loader.setDRACOLoader(new EmbeddedDRACOLoader());
					};


					let url = asset.pako ? pako.inflate(asset.pako, { to: 'string' }) : asset.url;

					return new Promise(resolve => {

						App.ThreeLoaders[asset.name] = three_loader.load(url, (obj) => {

							App.ThreeAssets[asset.name] = obj;

							resolve();

						}, () => {}, error => {

							console.error(error);

						});

					});

				});

				Promise.all(loaders)
					.then(() => {

						if (orderGroups.length) loadModelOrderGroup(orderGroups.pop().assets);
						else resolve();

					});

			}

			loadModelOrderGroup(orderGroups.pop().assets);

		});

	},

	createThree() {

		if (Settings["force-canvas-renderer"]) throw new Error("Enable WebGL to load three.js (make 'force-canvas-renderer' = false)");

		this.time = 0;

		if (this.IsCreateGame) {

			this.createThreeWorld(this.World);

			this.addThreeRendererEvents();

			this.addThreeVisibilityEvents();

			this.initialMute = Settings['sounds-mute'];

		}

	},

	createThreeWorld: function(config) {

		config.EventsObjects = [];

		const options = {
			antialias: ('antialias' in config) ? config.antialias : App.antialias,
			alpha: config.alpha
		};

		if (!this.isWebGLAvailable()) throw new Error(`WebGL is not available`);

		config.Renderer = new THREE.WebGLRenderer(options);

		if (config.Renderer.domElement.parent) config.Renderer.domElement.parent.removeChild(config.Renderer.domElement);

		if (config.shadow) _.extend(config.Renderer.shadowMap, config.shadow);

		config.Scene = new THREE.Scene();

		if (config.background) config.Scene.background = new THREE.Color(config.background);

		config.Camera = new THREE[config.camera.type]();

		// if (config.camera.params.fov) console.warn(`Camera fov is 45deg by default. It used in scaleStrategy. Please don't change it`);
		// else config.camera.params.fov = 45;

		const cameraParams = _.clone(config.camera.params);

		if (cameraParams.position) {

			config.Camera.position.set(cameraParams.position[0], cameraParams.position[1], cameraParams.position[2]);

			delete cameraParams.position;

		}

		config.Camera.lookAt(0, 0, 0);

		_.extend(config.Camera, cameraParams);

		// ========================================== ThreeGUI =======================================
		if (window.ThreeGUI) {
			const optionsThreeGUI = {
				sizeLandscape: config.threeGUI && config.threeGUI.sizeLandscape ? config.threeGUI.sizeLandscape : [1920, 1080],
				sizePortrait: config.threeGUI && config.threeGUI.sizePortrait ? config.threeGUI.sizePortrait : [1080, 1920]
			};

			this.World.ThreeGUI = new ThreeGUI(this, optionsThreeGUI);
		}

		// ========================================== EVENTS =======================================
		if (this.World.events) {

			this.ThreeRaycaster = new THREE.Raycaster();

			this.each(['Down', 'Up', /*'Move'*/], (event_type) => {

				Broadcast.on('Stage Press ' + event_type, (e, position) => {

					// Если есть three gui, значит оно находится перед всеми объектами и нужно сперва проверять на тач его.
					// Если тач касается интерактивного объекта в гуи - выходим из функции и не ищем тач с остальными обектами 3d сцены.
					if (this.World.ThreeGUI) {

						if (this.World.ThreeGUI.eventHandler(event_type, e, position)) return;

					}

					position = {x: position.x - this.World.Width / this.PixelRatio / 2, y: position.y - this.World.Height / this.PixelRatio / 2};

					let local_coords = {x: position.x, y: position.y};

					local_coords.x /= this.World.Width / this.PixelRatio / 2;
					local_coords.y /= - this.World.Height / this.PixelRatio / 2;

					let vector = new THREE.Vector2();
					vector.set(local_coords.x, local_coords.y);

					this.ThreeRaycaster.setFromCamera(vector, this.World.Camera);

					let intersects = this.ThreeRaycaster.intersectObjects(this.World.EventsObjects, true);

					//if (intersects.length > 0) console.log(local_coords, _.map(intersects, (o) => {return o.object.name}));

					if (intersects[0]) {

						let obj = intersects[0].object;
						let event = obj.params && obj.params.event;

						while (true) {

							if (event || !obj.parent) break;

							obj = obj.parent;

							event = obj.params && obj.params.event;

						}

						if (event) Broadcast.call(obj._screen_name + ' ' + event + ' ' + event_type, [obj, e]);

					}

				}, this);

			});

		}

		if (config.controls) {

			config.Controls = new THREE[config.controls.type](config.Camera);

			_.extend(config.Controls, config.controls.params);

		}

		return config;

	},

	injectThreeRenderer() {

		document.body.appendChild(this.World.Renderer.domElement);

	},

	startThreeTicker() {

		gsap.ticker.add((time, deltaTime, frame) => {

			this.update(time, deltaTime, frame);

		});

	},

	updateThree() {

		if (this.World.Controls) this.World.Controls.update();

		if (this.World.Renderer) {

			if (!this.World.ThreeGUI) {

				this.World.Renderer.render(this.World.Scene, this.World.Camera);

			} else {

				this.World.Renderer.clear();
				this.World.Renderer.render(this.World.Scene, this.World.Camera);
				this.World.Renderer.clearDepth();
				this.World.Renderer.render( this.World.ThreeGUI, this.World.ThreeGUI.camera );

			}
		}

	},

	calculateAppSize() {

		let width = window.innerWidth,
			height = window.innerHeight,
			left = 0,
			top = 0;

		if (window.MraidSDK) {

			let size = MraidSDK.getSize();

			width = size.width;
			height = size.height;
			left = size.left;
			top = size.top;

		}

		this.IsLandscape = width > height;

		this.IsPortrait = !this.IsLandscape;

		this.Width = width * this.PixelRatio;
		this.Height = height * this.PixelRatio;

		if (this.Width * this.Height > this.MaximumThreeRenderSize) {

			let scale = this.MaximumThreeRenderSize / (this.Width * this.Height);

			this.Width *= scale;
			this.Height *= scale;

		}

		this._screenWidth = width;
		this._screenHeight = height;
		this._screenLeft = left;
		this._screenTop = top;
	},

	resizeThree() {

		this.calculateAppSize();

		Broadcast.call("Game Resize", []);

		if (this.World.Renderer) this.resizeThreeRenderer(this.Width, this.Height, this._screenWidth, this._screenHeight, this._screenLeft, this._screenTop);


	},

	resizeThreeRenderer(resolution_width, resolution_height, screen_width, screen_height, screen_left, screen_top) {

		if (this.World.camera.type === 'OrthographicCamera') {

			this.World.Camera.left = -resolution_width / 2;
			this.World.Camera.right = resolution_width / 2;
			this.World.Camera.top = resolution_height / 2;
			this.World.Camera.bottom = -resolution_height / 2;

		} else if (this.World.camera.type === 'PerspectiveCamera') {

			this.World.Camera.aspect = resolution_width / resolution_height;

		}

		//Оставляем поддержку Three встроенного в Pixi.js
		this.World.Width = resolution_width;
		this.World.Height = resolution_height;

		this.World.Camera.updateProjectionMatrix();

		console.log('this.World.Renderer.setSize', resolution_width, resolution_height, this.World.size, this.Engine);

		this.World.Renderer.setSize(resolution_width, resolution_height, false);

		this.World.Renderer.domElement.style.position = 'fixed';
		this.World.Renderer.domElement.style.width = screen_width + 'px';
		this.World.Renderer.domElement.style.height = screen_height + 'px';
		this.World.Renderer.domElement.style.left = screen_left + 'px';
		this.World.Renderer.domElement.style.top = screen_top + 'px';

		// this.World.Renderer.render(this.World.Scene, this.World.Camera);
		this.updateThree();

	},

	addThreeRendererEvents() {

		if (App.IsTouchDevice) {

			this.World.Renderer.domElement.addEventListener("touchstart", function(e) {

				Broadcast.call("Stage Press Down", [e, {x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY}]);

				e.preventDefault();

			}, false);

			this.World.Renderer.domElement.addEventListener("touchend", function(e) {

				Broadcast.call("Stage Press Up", [e, {x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY}]);

				e.preventDefault();

			}, false);

			this.World.Renderer.domElement.addEventListener("touchmove", function(e) {

				Broadcast.call("Stage Press Move", [e, {x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY}]);

				e.preventDefault();

			}, false);

		} else {

			this.World.Renderer.domElement.addEventListener("mousedown", function(e) {

				Broadcast.call("Stage Press Down", [e, {x: e.clientX, y: e.clientY}]);

			}, false);

			this.World.Renderer.domElement.addEventListener("mouseup", function(e) {

				Broadcast.call("Stage Press Up", [e, {x: e.clientX, y: e.clientY}]);

			}, false);

			this.World.Renderer.domElement.addEventListener("mousemove", function(e) {

				Broadcast.call("Stage Press Move", [e, {x: e.clientX, y: e.clientY}]);

			}, false);

		}

	},

	addThreeVisibilityEvents() {

		Broadcast.on("MRAID Resumed", () => {

			this.paused = false;

			this.Screens.forEach(screen => screen.resume());

		}, "Three sounds mute check");

		Broadcast.on("MRAID Paused", () => {

			this.paused = true;

			this.Screens.forEach(screen => screen.pause());

		}, "Three sounds mute check");

	},

	isWebGLAvailable() {

		try {

			const canvas = document.createElement('canvas');
			return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));

		} catch (e) {

			return false;

		}

	},

	/**
	 * Парсер атласов.
	 * Атласы могут иметь перевёрнутые спрайты, trimmed спрайты и иметь скейл.
	 *
	 * Создает объект из объектов, которые имеют ключи из названий фреймов из атласа
	 * и помещает внутрь каждого информацию о offset, repeat, rotation и смешения для AnimatedSprite и AnimatedPlane
	 *
	 * App.ThreeTextureCache
	 *
	 */
	parseThreeSpritesheet(asset, callback) {

		if (!App.ThreeTextureCache) App.ThreeTextureCache = {};

		const BATCH_SIZE = 1000;

		let baseTexture = asset.image;

		let _frames = asset.json.frames;
		let _frameKeys = Object.keys(_frames);

		const scale = asset.json.meta.scale;
		let resolution = scale !== undefined ? parseFloat(scale) : 1;
		let _batchIndex = 0;

		const _processFrames = (initialFrameIndex) => {

			let frameIndex = initialFrameIndex;

			while (frameIndex - initialFrameIndex < BATCH_SIZE && frameIndex < _frameKeys.length) {
				const i = _frameKeys[frameIndex];
				const data = _frames[i];
				const rect = data.frame;

				if (rect) {
					let frame = null;
					let trim = null;
					// let anchorPosOffset = { x: 0, y: 0 };
					let anchorPosOffset = null;
					const sourceSize = data.trimmed !== false && data.sourceSize
						? data.sourceSize : data.frame;

					const orig = {
						x: 0,
						y: 0,
						width: Math.floor(sourceSize.w) / resolution,
						height: Math.floor(sourceSize.h) / resolution
					};

					if (data.rotated) {
						frame = {
							x: Math.floor(rect.x) / resolution,
							y: Math.floor(rect.y) / resolution,
							width: Math.floor(rect.h) / resolution,
							height: Math.floor(rect.w) / resolution
						};
					} else {
						frame = {
							x: Math.floor(rect.x) / resolution,
							y: Math.floor(rect.y) / resolution,
							width: Math.floor(rect.w) / resolution,
							height: Math.floor(rect.h) / resolution
						};
					}

					if (data.pivot) {
						data.anchor = data.pivot;
					}

					if (!data.anchor) {
						data.anchor = {x: 0.5, y: 0.5};
					}

					if (data.trimmed !== false && data.spriteSourceSize) {
						trim = {
							x: Math.floor(data.spriteSourceSize.x) / resolution,
							y: Math.floor(data.spriteSourceSize.y) / resolution,
							width: Math.floor(rect.w) / resolution,
							height: Math.floor(rect.h) / resolution
						};

						anchorPosOffset = {
							x: (trim.x + trim.width / 2) - orig.width * data.anchor.x,
							y: orig.height * data.anchor.y - (trim.y + trim.height / 2)
						};
					}

					let texture = baseTexture.clone();

					texture.repeat.set(frame.width / baseTexture.image.width * resolution, frame.height / baseTexture.image.height * resolution);
					texture.offset.x = frame.x / baseTexture.image.width * resolution;

					if (data.rotated) {
						texture.offset.y = 1 - frame.y / baseTexture.image.height * resolution;
						texture.rotation =  Math.PI / 2;
					} else {
						texture.offset.y = 1 - frame.height / baseTexture.image.height - frame.y / baseTexture.image.height * resolution;
						texture.rotation = 0;
					}

					texture.orig = orig;
					texture.trim = trim;
					texture.anchor = data.anchor;
					texture.anchorPosOffset = anchorPosOffset;

					texture.needsUpdate = true;

					App.ThreeTextureCache[i] = texture;

				}

				frameIndex++;
			}

		};

		const _processAnimations = () => {

		};

		const _parseComplete = () => {
			callback();
		};

		const _nextBatch = () => {
			_processFrames(_batchIndex * BATCH_SIZE);
			_batchIndex++;
			setTimeout(() => {
				if (_batchIndex * BATCH_SIZE < _frameKeys.length) {
					this._nextBatch();
				}
				else {
					this._processAnimations();
					this._parseComplete();
				}
			}, 0);
		};


		if (_frameKeys.length <= BATCH_SIZE) {
			_processFrames(0);
			_processAnimations();
			_parseComplete();
		} else {
			_nextBatch();
		}

		// console.log('App.ThreeTextureCache', App.ThreeTextureCache)
	}

});
