import Class 			from 'Class';
import Screen 			from 'Screen';

Screen.TextMixin = Class.mixin(Screen, {

	initialize() {

		this.AnimatedTexts = [];

		// Запишем сюда тексты которые вписаны в Containers вместо Localization чтобы можно было быстро их получить все и перенести в локализацию
		App._not_localizable_texts = {};

		this.on('update', function() {

			this.updateAnimatedTexts();

		}, 'Screen.Text');

	},

	setText(sprite, codename, is_change_params = true) {

		// Иногда удобно передать число не преобразовывая его к строке
		if (!_.isString(codename)) codename += '';

		if (_.isString(sprite)) sprite = this[sprite];

		let styles = this.getMessage(codename, sprite);

		if (_.isString(styles)) styles = {text: styles};

		let sprite_params_styles = sprite.params.styles;

		styles = _.extend({}, sprite_params_styles, styles);

		if (is_change_params) sprite.text = codename;

		this.setTextStyles(sprite, styles, is_change_params);

	},

	setTextStyles(sprite, styles, is_change_params = true) {

		styles = this.translateTextStyles(styles);

		if (_.isString(sprite)) sprite = this[sprite];

		if (sprite.params.type === 'text') {

			MRAID.processDynamicProperties(styles);

			_.extend(sprite.style, styles);

			if (typeof styles.text === 'string' || typeof styles.text === 'number') sprite.text = styles.text;

		} else if (sprite.params.type === 'multistyle-text') {

			this.each(styles, styles => {

				MRAID.processDynamicProperties(styles);

			});

			sprite.style = styles;

			sprite.text = styles.text;

		} else if (sprite.params.type === 'text-chars') {

			if (typeof styles.text === 'string' || typeof styles.text === 'number') sprite.setText(styles.text, [], styles);

		}

		if (is_change_params) _.extend(sprite.params.styles, styles);

		this.applyParams(sprite, _.pick(styles, ["position", "scale", "anchor", "rotation"]));

	},

	translateTextStyles(styles) {

		if (styles['fontSize'] && (typeof(styles['fontSize']) === 'number' || styles['fontSize'].slice(-2) !== 'px')) styles['fontSize'] += 'px';
		if (styles['dropShadowDistance']) styles['dropShadowDistance'] = parseInt(styles['dropShadowDistance']);
		if (styles['strokeThickness']) styles['strokeThickness'] = parseInt(styles['strokeThickness']);
		if (styles['letterSpacing']) styles['letterSpacing'] = parseInt(styles['letterSpacing']);
		if (styles['padding']) styles['padding'] = parseInt(styles['padding']);

		return styles;

	},

	getMessage(codename, sprite = null) {

		const locale = MraidSDK.getLocale(),
			messageObject = Settings.Localization[locale]?.[codename] || Settings.Localization["en"]?.[codename];

		if (messageObject) {

			MRAID.processDynamicProperties(messageObject);

			return messageObject;

		}

		if (codename && !sprite?.params?.noWarnings) {

			console.error('Please move all messages and/or its styles to Settings.Localization to allow editing via Dashboard! Message: ', codename);

			if (sprite) App._not_localizable_texts[sprite.name] = _.extend({text: codename}, sprite.params.styles);

		}

		return codename;

	},

	drawMessage(sprite, message, speed, next, options) {

		if (typeof sprite === 'string') sprite = this[sprite];

		this.AnimatedTexts.push({
			time: App.time,
			sprite: sprite,
			message: message || sprite.params.text || sprite.params.txt || '',
			speed: speed || 1,
			next: next,
			options: options || {}
		});

	},

	drawMessages(params, next) {

		let param = params.splice(0, 1)[0];

		if (!param) return next ? next.call(this) : null;

		if (!this.isArray(param)) param = [param];

		param[3] = () => this.drawMessages(params);

		this.drawMessage.apply(this, param);

	},

	animatedTextSubstr(string, length, options) {

		var res = [],
			count = 0,
			i, j, l;

		for (i = 0, l = string.length; i < l; i++) {

			if (string.charAt(i) === '<') {

				j = i;
				while (string.charAt(j) !== '>') j++;

				count += 0;
				res.push(string.substr(i, j - i + 1));

				i = j;

			} else if (string.charAt(i) === '\n') {

				count += 0;
				res.push(string.substr(i, 1));

			} else {

				count += 1;
				res.push(string.charAt(i));

			}

			if (count >= length) break;

		}

		var result = res.join('');

		var remaining = string.substr(i+1);

		var chars = [result.substr(result.length-1), remaining.substr(0, 1)];

		if (options.separator === 'word') {

			if (chars[0].indexOf(' ') === 0 || chars[0].indexOf('\n') === 0 || chars[1].indexOf(' ') === 0 || chars[1].indexOf('\n') === 0 || result === string) {

				//Do nothing

			} else {

				result = result.substring(0, Math.max(result.lastIndexOf(' '), result.lastIndexOf('\n')));

			}

		} else if (options.separator === 'line') {

			if (chars[0].indexOf('\n') === 0 || chars[1].indexOf('\n') === 0 || result === string) {

				//Do nothing

			} else {

				result = result.substring(0, result.lastIndexOf('\n'));

			}

		}

		return result;

	},

	updateAnimatedTexts() {

		this.each(this.AnimatedTexts, function(animated_text, index) {

			var time = App.time - animated_text.time;

			var chars_count = time / 50 * animated_text.speed;

			var message = this.animatedTextSubstr(animated_text.message, chars_count, animated_text.options);

			animated_text.sprite.text = message;

			if (message.length >= animated_text.message.length) {

				this.AnimatedTexts.splice(index, 1);

				if (animated_text.next) animated_text.next.call(this)

			}

		});

	}

});