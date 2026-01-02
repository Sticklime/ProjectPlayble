import MRAID 			from 'Mraid';

let Loader = {

	loadingProgressCodePercent: 0.25,

	start() {

		if (MraidSDK.isLocal) MraidSDK.processSettings();

		MRAID.start();

		if (Settings["loading-code-progress-percent"]) Loader.loadingProgressCodePercent = Settings["loading-code-progress-percent"];

		this.setup();

		this.showLoadProgress();

		if (Settings["load-on"] === "immediately" || typeof Settings["load-on"] === "undefined") {

			this.load();

		} else {

			//Use Loader.load() to start load ad manually

		}

	},

	load() {

		if (!document.body || typeof App === 'undefined') return setTimeout(() => Loader.load(), 5);

		Loader.updateLoadProgress(Loader.loadingProgressCodePercent);

		Broadcast.on("Assets Preload Progress", function(loader) {

			Loader.updateLoadProgress(Loader.calculateLoadProgress(loader));

		}, this);

		Broadcast.on("Assets Loaded", function() {

			Loader.updateLoadProgress(1);

			Broadcast.off(["Assets Preload Progress", "Assets Loaded"], this);

		}, this);

		App.start();

	},

	showLoadProgress() {

		// Экран загрузки можно показать заранее - в этом случае не нужно создавать его заново
		if (Loader.loadOverlayEl) return;

		if (!document.body) return setTimeout(() => Loader.showLoadProgress(), 5);

		let container = Loader.loadOverlayEl = document.createElement('div');
		container.className = "mraid-loading";
		container.style.opacity = "0";
		document.body.appendChild(container);

		let background = Loader.backgroundEl = document.createElement("div");
		background.className = "background";
		container.appendChild(background);

		let svg = Loader.svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.innerHTML = "<defs><filter id=\"blur\"><feComponentTransfer result=\"blur\"><feFuncA type=\"linear\" slope=\"10\"/></feComponentTransfer></filter></defs>";
		container.appendChild(svg);

		let logo = Loader.logoEl = document.createElement("div");
		logo.className = "logo";
		container.appendChild(logo);

		let text = Loader.textEl = document.createElement("div");
		text.className = "text";
		text.innerHTML = Settings["loading-text"];
		container.appendChild(text);

		let progress = Loader.loadProgressEl = document.createElement('div');
		progress.className = 'progress';
		container.appendChild(progress);

		let complete = Loader.loadProgressFillEl = document.createElement('div');
		complete.className = 'complete';
		progress.appendChild(complete);

		let logo_publisher = Loader.logoPublisher = document.createElement('div');
		logo_publisher.className = 'logo-publisher';
		container.appendChild(logo_publisher);

		let startButtonOverlay = Loader.startButtonOverlayEl = document.createElement('div');
		startButtonOverlay.className = 'start-button-overlay';
		startButtonOverlay.setAttribute("id", "start-button");
		startButtonOverlay.hidden = true;
		container.appendChild(startButtonOverlay);

		let startButton = Loader.startButtonEl = document.createElement('div');
		startButton.className = 'start-button';
		startButtonOverlay.appendChild(startButton);

		if (Settings['load-on'] === "interaction") {

			startButtonOverlay.hidden = false;
			startButton.onclick =  function (e) {
				e.stopPropagation();
				startButtonOverlay.hidden = true;
				Loader.load();
			};

		}

		Loader.loadOverlayEl.onclick = function() {

			 if (Loader.showed && Settings['loading-click-out']) {

				MraidSDK.open('loading screen');

			}

		};

		Loader.extendStyles();

		window.addEventListener("resize", Loader.resize);

		Loader.resize();

		clearInterval(Loader.updateSizeInterval);
		Loader.updateSizeInterval = setInterval(Loader.resize, 500);

		Loader.loadOverlayEl.style.transition = "opacity " + Settings["loading-overlay-show-time"] + "ms";

		setTimeout(function() {

			Loader.loadOverlayEl.style.opacity = "1";

		}, 20);

		Loader.showed = true;

	},

	resize() {

		let size = MraidSDK.getSize(true);

		let width = size.width,
			height = size.height,
			left = size.left,
			top = size.top;

		Loader.loadOverlayEl.style.width = width + 'px';
		Loader.loadOverlayEl.style.height = height + 'px';
		Loader.loadOverlayEl.style.left = left + 'px';
		Loader.loadOverlayEl.style.top = top + 'px';

		Loader.logoPublisher.style.right = (width + height) / 2 * 0.03 + 'px';
		Loader.logoPublisher.style.bottom = (width + height) / 2 * 0.03 + 'px';

		Loader.extendStyles();

	},

	hideLoadProgress() {

		Loader.updateLoadProgress(1);

		if (Loader.loadOverlayEl) {

			Loader.loadOverlayEl.style.transition = 'opacity ' + Settings["loading-overlay-hide-time"] * 0.9 + 'ms';

			setTimeout(() => {

				Loader.loadOverlayEl.style.opacity = '0';
				Loader.loadOverlayEl.style.pointerEvents = 'none';

			}, Settings["loading-overlay-hide-time"] * 0.1);

			setTimeout(() => {

				Loader.loadOverlayEl.style.display = 'none';

			}, Settings["loading-overlay-hide-time"]);

		}

		clearInterval(this.updateSizeInterval);

		Loader.showed = false;

	},

	updateLoadProgress(percent) {

		if (this.loadProgressFillEl) this.loadProgressFillEl.style.width = Math.round(percent*100) + '%';

		Broadcast.call("Update Load Progress Hook", [percent]);

	},

	calculateLoadProgress(loader) {

		if (!loader) return 0;

		const pixi_loader_percent = loader.pixiLoader ? loader.pixiLoader.progress / 100 : 0;

		let count = 0, progress = 0;

		const other_assets = ['web-font', 'dom-image', 'text', 'video'];

		if (!loader.pixiLoader) other_assets.push('image', 'fbx', 'glb');

		_.each(loader.sources, function(assets, name) {

			if (other_assets.includes(name)) {

				_.each(assets, function(asset) {

					count++;

					if (asset.state !== "loaded") {

						progress += asset.progress || 0;

					} else {

						progress += 1;

					}

				});

			}

		});

		const other_assets_percent = progress / count;

		const assets_percent = (pixi_loader_percent + other_assets_percent) / 2;

		const total = Loader.loadingProgressCodePercent + assets_percent * (1 - Loader.loadingProgressCodePercent);

		//console.log("pixi: " + pixi_loader_percent + " other: " + pixi_loader_percent + " all: " + assets_percent + " TOTAL: " + total);

		return total;

	},

	setup() {

		this.setupViewport();

		this.setupCharset();

		this.setupCss();

	},

	setupViewport() {

		let element = document.querySelector("meta[name=viewport]");

		if (!element) {

			element = document.createElement("meta");

			element.name = "viewport";
			element.content = "width=device-width,initial-scale=1,maximum-scale=1";

			document.getElementsByTagName('head')[0].appendChild(element);

		} else {

			element.content = "width=device-width,initial-scale=1,maximum-scale=1";

		}

	},

	setupCharset() {

		let element = document.querySelector("meta[charset]");

		if (!element) {

			element = document.createElement("meta");

			element.setAttribute("charset", "UTF-8");

			document.getElementsByTagName('head')[0].appendChild(element);

		} else {

			element.charset = "UTF-8";

		}

	},

	setupCss() {

		let style = document.createElement("style");

		style.appendChild(document.createTextNode(
			"html, body {" +
				"width: 100%;" +
				"height: 100%;" +
				"padding: 0;" +
				"margin: 0;" +
				"overflow: hidden;" +
				"font-family: \"Verdana\", \"Droid Sans\";" +
				"font-size: 0px;" +
			"}" +
			".mraid-loading {" +
				"position: fixed;" +
				"left: 0px;" +
				"top: 0px;" +
				"background-color: #ffffff;" +
				"z-index: 100;" +
			"}" +
			".mraid-loading .background {" +
				"position: absolute;" +
				"left: 0px;" +
				"top: 0px;" +
				"width: 100%;" +
				"height: 100%;" +
			"}" +
			".mraid-loading .logo {" +
				"position: absolute;" +
				"left: 30%;" +
				"right: 30%;" +
				"top: 25%;" +
				"bottom: 35%;" +
				"margin: auto;" +
				"background-size: 100% auto;" +
			"}" +
			".mraid-loading .text {" +
				"position: absolute;" +
			"}" +
			".mraid-loading .text {" +
				"position: absolute;" +
			"}" +
			".mraid-loading .logo-publisher {" +
				"position: absolute;" +
				"right: 5%;" +
				"bottom: 5%;" +
				"width: 20%;" +
				"height: 20%;" +
				"backgroundSize: 100% auto;" +
			"}" +
			".mraid-loading .progress {" +
				"position: absolute;" +
				"left: 30%;" +
				"right: 30%;" +
				"top: 25%;" +
				"bottom: 35%;" +
				"height: 2px;" +
			"}" +
			".mraid-loading .start-button-overlay {" +
				"position: absolute;" +
				"left: 0px;" +
				"top: 0px;" +
				"width: 100%;" +
				"height: 100%;" +
				"background-color: rgba(0,0,0,0.8);" +
			"}" +
			".mraid-loading .start-button {" +
				"position: absolute;" +
				"left: 30%;" +
				"right: 30%;" +
				"top: 25%;" +
				"bottom: 35%;" +
				"margin: auto;" +
				"background-size: 100% auto;" +
				"width: 0;" +
				"height: 0;" +
				"border-style: solid;" +
				"border-width: 40px 0 40px 80px;" +
				"border-color: transparent transparent transparent #ffffff;" +
			"}" +
			".mraid-loading .complete {" +
				"height: 2px;" +
				"width: 0%;" +
				"transition: width 1s;" +
			"}"
		));

		document.head.appendChild(style);

	},

	extendStyles() {

		if (Settings["loading-overlay-styles"]) MRAID.extendStyles(Loader.loadOverlayEl, Settings["loading-overlay-styles"]);
		if (Settings["loading-background-styles"]) MRAID.extendStyles(Loader.backgroundEl, Settings["loading-background-styles"]);
		if (Settings["loading-icon-styles"]) MRAID.extendStyles(Loader.logoEl, Settings["loading-icon-styles"]);
		if (Settings["loading-text-styles"]) MRAID.extendStyles(Loader.textEl, Settings["loading-text-styles"]);
		if (Settings["loading-progress-styles"]) MRAID.extendStyles(Loader.loadProgressEl, Settings["loading-progress-styles"]);
		if (Settings["loading-progress-fill-styles"]) MRAID.extendStyles(Loader.loadProgressFillEl, Settings["loading-progress-fill-styles"]);
		if (Settings["loading-icon-publisher-styles"]) MRAID.extendStyles(Loader.logoPublisher, Settings["loading-icon-publisher-styles"]);

	}

};

window.Loader = Loader;
export default Loader;