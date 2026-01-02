import Screen 			from 'Screen';

App.Banner = function(screen_name) {

return {

	Name: screen_name,

	Containers: [
		{name: 'MainContainer', type: 'dom-container', scaleStrategy: ['fit-to-screen', 1280, 1920], position: ['width/2', 'height/2'], styles: {width: '0px', height: '0px', zIndex: 'auto'}, childs: [
			['div', 'banner-background', {
				styles: {position: 'absolute', overflow: 'hidden', zIndex: 1},
				scale: {height: 250}
			}],
			['div', 'banner-content', {
				styles: {position: 'absolute', overflow: 'hidden', zIndex: 1},
				scale: {height: 250}
			}, [
				['div', 'banner-icon', {
					styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', position: 'absolute'},
					scale: {}
				}],
				['div', 'banner-title', {
					styles: {position: 'absolute'},
					scale: {}
				}],
				['div', 'banner-description', {
					styles: {position: 'absolute'},
					scale: {}
				}],
				['div', 'banner-stars-container', {
					styles: {position: 'absolute', background: 'rgba(0, 255, 0, 0)'},
					scale: {width: 350, height: 60, left: 240, top: 160}
				},
					[
					['div', 'banner-stars-out-container', {
						styles: {position: 'absolute', display: 'flex', justifyContent: 'space-between', width: '100%', height: '100%'},
						scale: {}
					}, [
						['div', 'banner-star-out', {
							styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', opacity: '0.2', width: '20%'},
							scale: {}
						}],
						['div', 'banner-star-out', {
							styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', opacity: '0.2', width: '20%'},
							scale: {}
						}],
						['div', 'banner-star-out', {
							styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', opacity: '0.2', width: '20%'},
							scale: {}
						}],
						['div', 'banner-star-out', {
							styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', opacity: '0.2', width: '20%'},
							scale: {}
						}],
						['div', 'banner-star-out', {
							styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', opacity: '0.2', width: '20%'},
							scale: {}
						}]
					]],
					['div', 'banner-stars-in-container', {
						styles: {position: 'absolute', display: 'flex', justifyContent: 'space-between', width: '100%', height: '100%'},
						scale: {}
					}, [
						['div', 'banner-star-in', {
							styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', width: '20%'},
							scale: {}
						}],
						['div', 'banner-star-in', {
							styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', width: '20%'},
							scale: {}
						}],
						['div', 'banner-star-in', {
							styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', width: '20%'},
							scale: {}
						}],
						['div', 'banner-star-in', {
							styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', width: '20%'},
							scale: {}
						}],
						['div', 'banner-star-in', {
							styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', width: '20%'},
							scale: {}
						}]
					]]
				]],
				['div', 'banner-cta-text-0', {
					styles: {position: 'absolute'},
					scale: {}
				}],
				['div', 'banner-cta-text-1', {
					styles: {position: 'absolute'},
					scale: {}
				}],
				['div', 'banner-star', {
					styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', position: 'absolute'},
					scale: {}
				}],
				['div', 'banner-comments-container', {
					styles: {position: 'absolute'},
					scale: {}
				}],
				['div', 'banner-button'+screen_name, {
					styles: {textAlign: 'center', position: 'absolute'},
					scale: {},
					event: 'cta'
				}]
			]]
		]}
	],

	Hooks: {

		beforeBuild() {

			this.defaultSettings = {
				'banner-background': {
					styles: {position: 'absolute', overflow: 'hidden', zIndex: 1},
					scale: {height: 250},
				},
				'banner-content': {
					styles: {position: 'absolute', overflow: 'hidden', zIndex: 1},
					scale: {height: 250}
				},
				'banner-icon': {
					styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', position: 'absolute'},
					scale: {}
				},
				'banner-title': {
					styles: {position: 'absolute'},
					scale: {}
				},
				'banner-description': {
					styles: {position: 'absolute'},
					scale: {}
				},
				'banner-stars-container': {
					styles: {position: 'absolute', background: 'rgba(0, 255, 0, 0)'},
					scale: {}
				},
				'banner-stars-out-container': {
					styles: {position: 'absolute', display: 'flex', justifyContent: 'space-between', width: '100%', height: '100%'},
					scale: {}
				},
				'banner-star-out': {
					styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', opacity: '0.2', width: '20%'},
					scale: {}
				},
				'banner-stars-in-container': {
					styles: {position: 'absolute', display: 'flex', justifyContent: 'space-between', width: '100%', height: '100%'},
					scale: {}
				},
				'banner-star-in': {
					styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', width: '20%'},
					scale: {}
				},
				'banner-cta-text-0': {
					styles: {position: 'absolute'},
					scale: {}
				},
				'banner-cta-text-1': {
					styles: {position: 'absolute'},
					scale: {}
				},
				'banner-star': {
					styles: {backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', position: 'absolute'},
					scale: {}
				},
				'banner-comments-container': {
					styles: {position: 'absolute'},
					scale: {}
				},
				['banner-button'+screen_name]: {
					styles: {textAlign: 'center', position: 'absolute'},
					scale: {}
				}
			};

		},

		build() {

			this.init();

		},

		show() {

			this.init();

		}

	},

	Events: {

		'cta click': function(e) {

			e.stopPropagation();

			if (window.MraidSDK) MraidSDK.open('banner');
			else alert('Click Out: banner');

		},

		'global:Setting Changed': function(setting) {

			const prefix = this.Name === 'TopBanner' ? 'top' : 'bottom';

			if (!setting.match(new RegExp(`^${prefix}-banner.*$`))) return;

			const toIntProperties = ['fontSize', 'width', 'height', 'borderRadius', 'lineHeight', 'marginTop', 'marginLeft', 'marginBottom', 'marginRight', 'left', 'right', 'top', 'bottom'];

			if (typeof Settings[setting] === 'object') {

				for (let key in Settings[setting]) {

					if (!Settings[setting].hasOwnProperty(key)) continue;

					if (toIntProperties.indexOf(key) >= 0) {

						const value = +Settings[setting][key];

						Settings[setting][key] = Number.isNaN(value) ? Settings[setting][key] : value;

					}

				}

			}

			if (screen_name === "TopBanner" && Settings["top-banner"]) this.show();
			else if (screen_name === "BottomBanner" && Settings["bottom-banner"]) this.show();
			else this.hide();

		}

	},

	resetElementStyles(name) {

		if (!this['MainContainer'].els[name]) return;

		if (Array.isArray(this['MainContainer'].els[name])) {

			for (let i = 0; i < this['MainContainer'].els[name].length; i++) {

				this['MainContainer'].els[name][i].removeAttribute('style');

				this['MainContainer'].els[name][i].params.styles = {};
				this['MainContainer'].els[name][i].params.scale = {};

			}

		} else {

			this['MainContainer'].els[name].removeAttribute('style');

			this['MainContainer'].els[name].params.styles = {};
			this['MainContainer'].els[name].params.scale = {};

		}

	},

	init() {

		this.timeout(function updateImg() {

			const stars_out = this['MainContainer'].els['banner-star-out'];
			const stars_in = this['MainContainer'].els['banner-star-in'];

			if (stars_out.length + stars_in.length !== 10) return this.timeout(updateImg.bind(this), 100);

			this.updateSettings();

		}.bind(this), 0);

	},

	hexToRgb(hex) {

		const bigint = parseInt(hex.toString().replace('#', ''), 16);

		return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];

	},

	updateSettings() {

		if (!this['MainContainer'] && !this.buildDOMContainer) throw new Error('To use Banner you should inject Screen.Dom.js');

		Object.keys(this.defaultSettings).forEach(name => {

			this.resetElementStyles(name);

			if (Array.isArray(this['MainContainer'].els[name])) {

				for (let i = 0; i < this['MainContainer'].els[name].length; i++) {

					_.extend(this['MainContainer'].els[name][i].params.styles, this.defaultSettings[name].styles);
					_.extend(this['MainContainer'].els[name][i].params.scale, this.defaultSettings[name].scale);
					_.extend(this['MainContainer'].els[name][i].style, this.defaultSettings[name].styles);

				}

			} else {

				_.extend(this['MainContainer'].els[name].params.styles, this.defaultSettings[name].styles);
				_.extend(this['MainContainer'].els[name].params.scale, this.defaultSettings[name].scale);
				_.extend(this['MainContainer'].els[name].style, this.defaultSettings[name].styles);

			}

		});

		let prefix = this.Name === 'TopBanner' ? 'top' : 'bottom';

		this.setBannerPosition();
		this.setBannerRating(Settings[prefix + '-banner-rating']);
		this.toggleCTAButtonAnim(Settings[prefix + '-banner-button-animation']);
		this.setText(this['MainContainer'].els['banner-title'], Settings[prefix + '-banner-title-text']);
		this.setText(this['MainContainer'].els['banner-description'], Settings[prefix + '-banner-description-text']);
		this.setText(this['MainContainer'].els['banner-button'+screen_name], Settings[prefix + '-banner-button-text']);
		this.setText(this['MainContainer'].els['banner-cta-text-0'], Settings[prefix + '-banner-cta-text-0-text']);
		this.setText(this['MainContainer'].els['banner-cta-text-1'], Settings[prefix + '-banner-cta-text-1-text']);

		_.extend(this['MainContainer'].els['banner-background'].params.scale, Settings[prefix + '-banner-background-styles']);
		_.extend(this['MainContainer'].els['banner-content'].params.scale, Settings[prefix + '-banner-content-styles']);
		MRAID.extendStyles(this['MainContainer'].els['banner-icon'], Settings[prefix + '-banner-icon']);
		_.extend(this['MainContainer'].els['banner-icon'].params.scale, Settings[prefix + '-banner-icon-styles']);
		_.extend(this['MainContainer'].els['banner-title'].params.scale, Settings[prefix + '-banner-title-styles']);
		_.extend(this['MainContainer'].els['banner-description'].params.scale, Settings[prefix + '-banner-description-styles']);
		_.extend(this['MainContainer'].els['banner-cta-text-0'].params.scale, Settings[prefix + '-banner-cta-text-0-styles']);
		_.extend(this['MainContainer'].els['banner-cta-text-1'].params.scale, Settings[prefix + '-banner-cta-text-1-styles']);
		_.extend(this['MainContainer'].els['banner-button'+screen_name].params.scale, Settings[prefix + '-banner-button-styles']);
		_.extend(this['MainContainer'].els['banner-stars-container'].params.scale, Settings[prefix + '-banner-rating-styles']);
		[...this['MainContainer'].els['banner-star-out'], ...this['MainContainer'].els['banner-star-in']].forEach(element => MRAID.extendStyles(element, Settings[prefix + "-banner-star"]));
		MRAID.extendStyles(this['MainContainer'].els['banner-star'], Settings[prefix + '-banner-star']);
		_.extend(this['MainContainer'].els['banner-star'].params.scale, Settings[prefix + '-banner-star-styles']);
		_.extend(this['MainContainer'].els['banner-comments-container'].params.scale, Settings[prefix + '-banner-comment-styles']);

		if (this.commentTimeout) this.commentTimeout.kill();

		if (Settings[`${prefix}-banner-comment-styles`] && Settings[`${prefix}-banner-comment-styles`].display !== 'none') this.startCommentAnim();

		this.resizeDOM();

	},

	toggleCTAButtonAnim(state) {

		if (this.CTAButtonAnimStyle && this.CTAButtonAnimStyle.parentNode) this.CTAButtonAnimStyle.parentNode.removeChild(this.CTAButtonAnimStyle);

		if (state) {

			const style = this.CTAButtonAnimStyle = document.createElement('style');
			style.innerHTML = `
				.banner-button${screen_name} {
					animation: bannerButtonAnim 0.35s alternate infinite ease-in-out;
				}
				@keyframes bannerButtonAnim {
					0%   {transform: scale(1.05);}
					100% {transform: scale(1);}
				}
			`;
			document.head.appendChild(style);

		}

	},

	setBannerPosition() {

		if (this.Name === 'TopBanner') this['MainContainer'].params.position[1] = 0;
		else this['MainContainer'].params.position[1] = 'height';

		this.resizeDOM();

	},

	setText(element, text, params = null) {

		element.innerText = text;

		if (!params) return;

		if (params.styles) {

			_.extend(element.params.styles, params.styles);
			_.extend(element.style, params.styles);

		}

		if (params.scale) this.setStyles(element, params.scale);

	},

	setBannerRating(value) {

		const stars_in = this['MainContainer'].els['banner-star-in'];

		let colored_stars = Math.floor(value / 20);
		let last_colored_star = Math.asin(2 * ((value % 20) / 20) - 1) / Math.PI + 0.5;

		stars_in.forEach((star, i) => {

			star.style.opacity = '1';

			if (colored_stars) {

				colored_stars--;

				star.style.clipPath = '';

			} else if (last_colored_star) {

				star.style.clipPath = `inset(0 ${(1 - last_colored_star) * 100}% 0 0)`;

				last_colored_star = null;

			} else {

				star.style.opacity = '0';

			}

		});

	},

	startCommentAnim(id) {

		let tweenDuration = 600;

		if (this.commentTimeout) this.commentTimeout.kill();

		let prefix = this.Name === 'TopBanner' ? 'top' : 'bottom';

		if (id === undefined) {

			id = 0;

			this.setBannerRating(Settings[`${prefix}-banner-comment-${id}-rating`]);
			this.setText(this['MainContainer'].els['banner-title'], Settings[`${prefix}-banner-comment-${id}-name`]);
			this.setText(this['MainContainer'].els['banner-comments-container'], Settings[`${prefix}-banner-comment-${id}-text`]);

			this.commentTimeout = this.timeout(() => {

				this.startCommentAnim((id + 1) % 3);

			}, Settings[`${prefix}-banner-comment-duration`]);

			return;

		}

		this.commentsTweenObj = this.commentsTweenObj || {opacity: 1};

		this.animate(0, this.commentsTweenObj, {opacity: 0, d: tweenDuration / 2 / 1000, onUpdate: () => {

			this['MainContainer'].els['banner-title'].style.opacity = this.commentsTweenObj.opacity;
			this['MainContainer'].els['banner-comments-container'].style.opacity = this.commentsTweenObj.opacity;
			this['MainContainer'].els['banner-stars-container'].style.opacity = this.commentsTweenObj.opacity;

		}}, () => {

			this.setText(this['MainContainer'].els['banner-title'], Settings[`${prefix}-banner-comment-${id}-name`]);

			this.setText(this['MainContainer'].els['banner-comments-container'], Settings[`${prefix}-banner-comment-${id}-text`]);

			this.setBannerRating(Settings[`${prefix}-banner-comment-${id}-rating`]);

			this.animate(0, this.commentsTweenObj, {opacity: 1, d: tweenDuration / 2 / 1000, onUpdate: () => {

				this['MainContainer'].els['banner-title'].style.opacity = this.commentsTweenObj.opacity;
				this['MainContainer'].els['banner-comments-container'].style.opacity = this.commentsTweenObj.opacity;
				this['MainContainer'].els['banner-stars-container'].style.opacity = this.commentsTweenObj.opacity;

			}}, () => {

				this.commentTimeout = this.timeout(() => {

					this.startCommentAnim((id + 1) % 3);

				}, Settings[`${prefix}-banner-comment-duration`]);

			});

		});

	}

};

};

App.TopBanner = new Screen(App.Banner('TopBanner'));
App.BottomBanner = new Screen(App.Banner('BottomBanner'));