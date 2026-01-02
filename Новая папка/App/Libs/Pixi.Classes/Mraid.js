// import GameStats		from 'gamestats.js';
// import MobileDetect 	from "mobile-detect";

// Описываем локальный интерфейс MraidSDK, чтобы игра работала при локальном запуске без постоянных проверок существования MraidSDK,
// этот локальный интерфейс будет заменён на реальный MraidSDK в продакшен билдах и при запуске внутри дашборда
// В этих случаях объект MraidSDK уже будет присутствовать в окружении и создание локального интерфейса здесь не произойдёт
if (!window.MraidSDK) window.MraidSDK = {
	isLocal: true,
	processSettings: () => {Object.keys(Settings).forEach(name => {if (Settings[name]?.type) Settings[name] = Settings[name].value;});},
	subscribers: {},
	open: (type) => alert(`Click Out: ${type}`),
	on: (name, func) => {MraidSDK.subscribers[name] = MraidSDK.subscribers[name] || [];MraidSDK.subscribers[name].push(func);},
	call: (name, params = []) => {(MraidSDK.subscribers[name] || []).forEach(func => func(...params))},
	track: (name) => {
		console.log(`MraidSDK -> track() -> ${name}`);
		if (name === "Assets Loaded") MraidSDK.call("Start Game");
	},
	getSize: () => {return {width: window.innerWidth, height: window.innerHeight, orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'}},
	getLocale: () => Settings["locale"] || "en",
	interaction: () => {console.log("MraidSDK -> interaction()")},
	isReplayAvailable: () => true,
	processReplay: () => {MraidSDK.call("Start Replay")},
	showEndScreen: () => {MraidSDK.call("Show Native End Screen")},
	hideEndScreen: () => {MraidSDK.call("Hide Native End Screen")},
	playSound: (name) => {MraidSDK.call("Play Sound", [App.Assets[name]])},
	stopSound: (name) => {MraidSDK.call("Stop Sound", [App.Assets[name]])},
	isMuted: () => false,
	isAutoplaySupported: () => true,
	log: (...params) => console.log(...params)
};
window.addEventListener('resize', () => {MraidSDK.call("Mraid Resized")});

let MRAID = {

	ios: /mac|ipad|iphone|ipod/i.test(navigator.userAgent) && !window.MSStream,

	android: /android/i.test(navigator.userAgent) && !window.MSStream,

	amazon: /(?:; ([^;)]+) Build\/.*)?\bSilk\/([0-9._-]+)\b(.*\bMobile Safari\b)?/.exec(navigator.userAgent),

	// Пометим что это уже новый CreativeTemplate совместимый с MraidSDK
	MraidSDKSupported: true,

	start() {

		// Восстанавливаем спайн анимации на 0 в момент включения и выключения паузы (этот фикс был изначально в релизе Playrix)
		MraidSDK.on("Paused", () => {

			App.Screens.forEach((screen) => {

				screen._childs.forEach((child) => {

					if (child.params.type === 'spine') child.lastTime = 0;

				});

			});

		}, this);

		// Восстанавливаем спайн анимации на 0 в момент включения и выключения паузы (этот фикс был изначально в релизе Playrix)
		MraidSDK.on("Resumed", () => {

			App.Screens.forEach((screen) => {

				screen._childs.forEach((child) => {

					if (child.params.type === 'spine') child.lastTime = 0;

				});

			});

		}, this);

		MraidSDK.on("Play Sound", (asset) => {

			App._playSound(asset.name || asset.codename);

		}, this);

		MraidSDK.on("Stop Sound", (asset) => {

			App._stopSound(asset.name || asset.codename);

		}, this);

		MraidSDK.on("Muted", () => {

			if (window.Howler?.ctx) Howler.mute(true);

		}, this);

		MraidSDK.on("Unmuted", () => {

			if (window.Howler?.ctx) Howler.mute(false);

		}, this);

		MraidSDK.on("Show Native End Screen", () => {

			App.CallToAction.show();

		});

		MraidSDK.on("Hide Native End Screen", () => {

			App.CallToAction.animateHide();

		});

		MraidSDK.on("Start Game", () => {

			//This is Rovio app fix:
			const rovioFix = () => {
				if (Settings["publisher"] === "rovio") {

					var div = document.createElement('div');

					div.style.position = 'absolute';
					div.style.zIndex = '99';
					div.style.left = '0px';
					div.style.top = '0px';

					var el = document.getElementsByTagName('canvas')[0];

					if (!el) {
						setTimeout(() => {
							rovioFix();
						}, 1000);
						return;
					}

					document.body.appendChild(div);

					el.style.position = 'absolute';
					el.style.zIndex = '99';
					el.style.left = '0px';
					el.style.top = '0px';

					if (App.World) {
						if (App.World.Renderer && App.World.Renderer.domElement) div.appendChild(App.World.Renderer.domElement);
					}

				}
			}

			rovioFix();

		}, this);

		MraidSDK.on("Setting Changed", () => {

			// Тут ничего не делаем так как подписка на это событие происходит в Gameplay и других экранах
			// Код этот нужно оставить чтобы проходили тесты, так как тестовое приложение не отслеживает подписки через Broadcast.on, а только через MraidSDK.on

		}, this);

		MraidSDK.on("Asset Changed", (name, props) => {

			this.updateAsset(name, props);

		}, this);

	},

	updateAsset(old_asset_name, new_asset) {

		let old_asset = App.Assets[old_asset_name];

		// Если ассет нужно отменить / удалить
		if (!new_asset && old_asset) {

			if (old_asset.type === 'sound') {

				App.detachAsset(old_asset);

				delete App.Assets[old_asset_name].sound;

			}

		// Если ассет нужно обновить
		} else if (new_asset) {

			if (new_asset.type === 'image' || new_asset.type === 'atlas') {

				let new_sprite_name = old_asset_name + '-' + Date.now();

				Settings.Assets[new_sprite_name] = new_asset;

				// Url может быть одинаковым - нужно предотвратить кэширование
				Settings["version"] = Date.now();

				// Загружаем новый ассет
				App.loadAssets([new_sprite_name], () => {

					_.each(App.Screens, screen => {

						_.each(screen._childs, child => {

							if (child && child.params && child.params.image === old_asset_name) {

								// TODO: применить в реалтайме изменения ассетов через дашборд

							}

						});

					});

				}, {strategy: new_asset.loadStrategy || 'preload'});

			} else if (new_asset.type === 'sound') {

				App.detachAsset(App.Assets[old_asset_name]);

				let asset = App.Assets[old_asset_name] = Object.assign(App.Assets[old_asset_name] || {name: old_asset_name}, new_asset);

				if (asset.url.indexOf('http') !== 0 && asset.url.indexOf('data:') !== 0 && asset.url.indexOf('file:') !== 0) asset.url = (Settings["assets-path"] || '') + asset.url;

				asset.sound = new Howl({
					src: asset.url + '?v=' + Date.now(),
					html5: false,
					xhr: {
						withCredentials: true
					},
					onload() {

						asset.state = 'loaded';

					}
				});

			}

		}

	},

	processDynamicProperties(object, options = null) {

		if (!object) return;

		let size = MraidSDK.getSize();

		let orientation = size?.orientation || 'portrait',
			proportion_device = '';

		const proportion = size.width > size.height ? (size.width / size.height) : (size.height / size.width);

		if (Math.abs(proportion - (667/375)) / (667/375) < 0.07) proportion_device = 'iPhone';

		else if (Math.abs(proportion - (1024/768)) / (1024/768) < 0.07) proportion_device = 'iPad';

		else if (Math.abs(proportion - (812/375)) / (812/375) < 0.07) proportion_device = 'iPhoneX';

		if (options && options.orientation) orientation = options.orientation.toLowerCase();

		const isSquare = size ? size.width / size.height <= 1.1 && size.width / size.height >= 0.9 : false;

		// Последовательность важна
		let postfixes = [
			{name: 'IPad', active: proportion_device === 'iPad'},
			{name: 'IPhoneX', active: proportion_device === 'iPhoneX'},
			{name: 'IPhone', active: proportion_device === 'iPhone'},
			{name: 'Landscape', active: orientation === 'landscape'},
			{name: 'Portrait', active: orientation === 'portrait'},
			{name: 'Square', active: isSquare}
		];

		function is_postfix_exist(property_name, property_postfix) {

			return property_name.indexOf(property_postfix) > -1 || property_name.indexOf(':' + property_postfix.toLowerCase()) > -1;

		}

		function remove_postfix(property_name, property_postfix) {

			return property_name.replace(property_postfix, '').replace(':' + property_postfix.toLowerCase(), '');

		}

		// Запишем сюда свойства которые появились из динамических
		let dynamic_properties = {},
			result = false;

		// Сначала пройдём и соберём значения всех динамических свойств которые будут применены
		for (let property_name in object) if (object.hasOwnProperty(property_name)) {

			let base_property_name = property_name;
			let is_property_name_dynamic = false;
			let is_property_name_active = true;

			for (let i=0; postfixes[i]; i++) {

				if (is_postfix_exist(base_property_name, postfixes[i].name)) {

					is_property_name_dynamic = true;

					base_property_name = remove_postfix(base_property_name, postfixes[i].name);

					if (!postfixes[i].active) is_property_name_active = false;

				}

			}

			// Свойство не динамическое, поэтому пропускаем
			if (!is_property_name_dynamic) continue;

			// Пометим что в этом объекте есть динамические свойства чтобы вернуть результат
			result = true;

			// Свойство динамическое но не применяется из-за текущего состояния приложения, поэтому пропускаем.
			if (!is_property_name_active) continue;

			// Оригинальное свойство тоже пропускаем - оно обрабатывается после основного цикла
			if (base_property_name.indexOf('#original') > -1) continue;

			dynamic_properties[base_property_name] = object[property_name];

		}

		// Теперь применим динамические свойства
		for (let property_name in dynamic_properties) if (dynamic_properties.hasOwnProperty(property_name)) {

			// Сохраним значение свойства которое было до первой замены (даже если там undefined)
			if (!((property_name + '#original') in object)) object[property_name + '#original'] = object[property_name];

			object[property_name] = dynamic_properties[property_name];

		}

		// Установим оригинальное значение если оно есть а динамического нету (даже если там undefined)
		for (let property_name in object) if (object.hasOwnProperty(property_name)) {

			if (property_name.indexOf('#original') > -1 && !(property_name.replace('#original', '') in dynamic_properties)) object[property_name.replace('#original', '')] = object[property_name];

		}

		return result;

	},

	extendStyles(el, styles) {

		if (!el || !styles) return;

		this.processDynamicProperties(styles);

		for (let key in styles) if (styles.hasOwnProperty(key)) {

			if (key === 'data') continue;

			if (typeof styles[key] !== 'string') continue;

			if (styles[key].indexOf('url(') !== -1) {

				if (styles[key].indexOf("http") === -1 && styles[key].indexOf("//") === -1 && styles[key].indexOf("data:") === -1) {

					styles[key] = styles[key].replace('url(', 'url(' + (Settings["assets-path"] || ''));

				}

				if (styles[key].indexOf('$') !== -1) {

					styles[key] = this.extendStyleAsset(styles[key]);

				}

			}

			el.style[key] = styles[key];

		}

	},

	extendStyleAsset(styleValue) {

		_.each(Settings.Assets, (asset, assetName) => {

			if (styleValue.indexOf(`$${assetName}$`) > -1) {

				styleValue = styleValue.replace(`$${assetName}$`, asset.url);

			}

		});

		return styleValue;

	},

	log(...params) {

		MraidSDK.log(...params);

	}

};

window.MRAID = MRAID;
export default MRAID;