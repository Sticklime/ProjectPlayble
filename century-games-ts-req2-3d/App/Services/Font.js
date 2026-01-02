import Service 		from 'Service';

// Этот сервис рассчитан на подгрузку и использование bitmap шрифтов созданных через утилиту Littera-bitmap-font-generator

let Font = new Service({

	Name: "Font",

	Events: {

		// Создаём Bitmap шрифты для TextChars
		"Pixi Game Created Hook": function() {

			// this.parseKerlings(App.Assets["bitmap-fonts-kerling"].data);

			this.createFonts();

		}

	},

	init() {

		// Bitmap шрифты основанные на спрайтах
		this.bitmapFonts = {};

		// Информация по отступам для каждого символа bitmap шрифтов
		this.kerlings = {};

		// Изображения используемые среди текста
		this.inlineDisplayObjects = {
			// 'coin': 	{ type: "sprite", 	image: "coin-inline.png", 			fontSize: 45, 	xoffset: 7,	yoffset: 0,  xadvance: 60}
		};

	},

	createFonts() {

		// Создаём bitmap шрифты из спрайтов:

		this.registerBitmapFont("RobotoBlack", {
			charSpriteTemplateName: "roboto-black-{size}-{code}.png",
			fixedFontSizes: [48],
			shadowTemplateName: "roboto-black-shadow-48-{code}.png",
			shadowFontSizes: [48], // Это нельзя менять - тут мы указываем как была сгенерирована тень для этого шрифта, чтобы правильно её отрисовать.
			strokeTemplateName: "roboto-black-stroke-48-{code}.png",
			strokeFontSizes: [48], // Это нельзя менять - тут мы указываем как была сгенерирована обводка для этого шрифта, чтобы правильно её отрисовать.
			additionalCacheSpace: 0.05
		});

		// ОЧЕНЬ ЖИРНЫЙ БЕЛЫЙ С ОБВОДКОЙ
		this.registerBitmapFont("RobotoBlackStroke", {
			baseFont: "RobotoBlack",
			stroke: true,
			strokeAlpha: 0.3
		});

	},

	parseKerlings(text) {

		let lines = text.split('\n');

		let fontKerlings = null;

		_.each(lines, line => {

			let pairs = line.split(' ');

			if (pairs[0] === "info") {

				pairs = this.pairsToObject(pairs.slice(1));

				pairs["padding"] = parseInt(pairs["padding"]) || 0;
				pairs["lineHeight"] = parseInt(pairs["lineHeight"]) || 0;

				if (!this.kerlings[pairs["face"]]) this.kerlings[pairs["face"]] = {};
				fontKerlings = this.kerlings[pairs["face"]][pairs["size"]] = pairs;
				fontKerlings.chars = {};

			} else if (pairs[0] === "char") {

				pairs = this.pairsToObject(pairs.slice(1), ["id", "width", "height", "xoffset", "yoffset", "xadvance"]);

				pairs["id"] = parseInt(pairs["id"]);
				pairs["width"] = parseInt(pairs["width"]);
				pairs["height"] = parseInt(pairs["height"]);
				pairs["xoffset"] = parseInt(pairs["xoffset"]);
				pairs["yoffset"] = parseInt(pairs["yoffset"]);
				pairs["xadvance"] = parseInt(pairs["xadvance"]);

				fontKerlings.chars[pairs["id"]] = pairs;
				fontKerlings.chars[pairs["id"]].padding = fontKerlings.padding;
				fontKerlings.chars[pairs["id"]].lineHeight = fontKerlings.lineHeight;

			}

		});

		// console.log('this.kerlings', this.kerlings);

	},

	registerBitmapFont(name, options) {

		if (options.baseFont) {

			let parentFont = this.bitmapFonts[options.baseFont];

			options = _.extend(_.cloneDeep(parentFont), options);

		}

		this.bitmapFonts[name] = options;

		options.fontName = name;

	},

	// Возвращаем ближайший существующий размер шрифта к переданному
	// Учитываем возможные размеры обводки и тени если они нужны
	getNearestFontSize(font, fontSize, isStroke = false, isShadow = false) {

		let fontProps = this.bitmapFonts[font],
			fontSizes = fontProps.fixedFontSizes;

		if (isStroke) fontSizes = _.intersection(fontSizes, fontProps.strokeFontSizes);
		if (isShadow) fontSizes = _.intersection(fontSizes, fontProps.shadowFontSizes);

		// Если есть шрифт ровно в 2 раза больше чем запрашиваемый - используем его.
		// Результат будет лучше как на WEBGL, так и на CANVAS рендерере, даже если есть сам запрашиваемый размер.
		// 2024.04.09 На подписях кнопок главного меню удвоение размеров ухудшает результат
		if (_.includes(fontSizes, fontSize * 2))  return fontSize * 2;

		let nearestDist = 1000,
			// По-умолчанию берём самый большой из возможных
			nearestFontSize = _.max(fontSizes);

		for (let i=0, l=fontSizes.length; i<l; i++) {

			let dist = fontSizes[i] - fontSize;

			// Берём только шрифты большего размера чем искомый (иначе используется самый большой из возможных)
			if (dist > 0 && dist < nearestDist) {

				nearestDist = dist;
				nearestFontSize = fontSizes[i];

			}

		}

		return nearestFontSize;

	},

	getCharProps(font, fontSize, charCode) {

		return this.kerlings[font]?.[fontSize]?.chars?.[charCode];

	},

	pairsToObject(pairs, fields = null) {

		let obj = {};

		_.each(pairs, pair => {

			let spl = pair.split('=');

			if (!fields || _.includes(fields, spl[0])) obj[spl[0]] = spl[1];

		});

		return obj;

	}

});

// Только для наблюдения за состоянием через консоль браузера
window.FontService = Font;

export default Font;