const Service = class {

	constructor(properties) {

		const mixins = properties.Libraries || [];

		delete properties.Libraries;

		let init = function() {};

		if (!this.Actions) this.Actions = {};

		if (!this.Events) this.Events = {};

		if (properties.init) init = properties.init;

		if (!properties.Name) throw new Error("Service must have own Name property! " + this.Name);

		Object.assign(this, properties);

		for (let i = 0; mixins[i]; i++) {

			if (!mixins[i].Name) throw new Error("Library must have own Name property! " + this.Name);

			Object.assign(this, _.omit(mixins[i], ['init', 'Name', 'Actions', 'Routes', 'Events']));

		}

		this.init = () => {

			this.activateActions(properties.Actions, this);

			for (let i=0; mixins[i]; i++) {

				this.activateActions(mixins[i].Actions, mixins[i]);

			}

			Broadcast.call('Service Actions Activated', [this, mixins]);

			this.activateEvents(properties.Events, this);

			for (let i=0; mixins[i]; i++) {

				this.activateEvents(mixins[i].Events, mixins[i]);

			}

			Broadcast.call('Service Events Activated', [this, mixins]);

			init.apply(this, []);

			for (let i=0; mixins[i]; i++) {

				if (mixins[i].init) mixins[i].init.apply(this, []);

			}

		};

		if (!properties["disableAutoInit"]) this.init();

	}

	activateActions(actions, context) {

		Broadcast.on('Server Data Received', (data, size) => {

			_.each(context.Actions, (fn, key) => {

				if (data && key in data) fn.apply(context, [data[key], data, size]);

			});

			if (context.Actions && context.Actions['*']) {

				context.Actions['*'].apply(context, [data, size]);

			}

		}, context);

	}

	activateEvents(events, context) {

		_.each(events, (fn, event_name) => {

			Broadcast.on(event_name, fn, context);

		});

	}

	broadcastChanges(oldObject, newObject, eventPrefixes) {

		if (!_.isArray(eventPrefixes)) eventPrefixes = [eventPrefixes];

		if (oldObject) {

			if (newObject) {

				let changedKeys = [];

				// Уберём объекты и массивы так как они всегда будут показывать якобы изменены
				let primitiveKeys = _.filter(_.keys(newObject), key => {

					return typeof newObject[key] !== 'object';

				});

				_.each(primitiveKeys, key => {

					if (newObject[key] !== oldObject[key]) {

						changedKeys.push(key);

					}

				});

				// Отдельно проверим объекты на один уровень
				let objectKeys = _.without(_.keys(newObject), ...primitiveKeys);

				_.each(objectKeys, objectKey => {

					if (_.isDate(newObject[objectKey])) {

						if (newObject[objectKey].getTime() !== oldObject[objectKey].getTime()) {

							changedKeys.push(objectKey);

						}

					} else {

						let keys = _.keys(newObject[objectKey]);

						_.each(keys, key => {

							if (newObject[objectKey][key] !== oldObject[objectKey]?.[key]) {

								if (!_.includes(changedKeys, objectKey)) {

									changedKeys.push(objectKey);
									if (objectKey === "options") changedKeys.push(`${objectKey}.${key}`); // это нужно как минимум для определения что противник сдался options.cancelled изменился

								}

							}

						});

					}

				});

				if (changedKeys.length > 0) for (let i=0; eventPrefixes[i]; i++) Broadcast.call(`${eventPrefixes[i]} Changed: [${changedKeys.join('|')}]`, [newObject, oldObject, changedKeys]);

			} else {

				for (let i=0; eventPrefixes[i]; i++) Broadcast.call(`${eventPrefixes[i]} Removed`, [oldObject]);

			}

		} else {

			if (newObject) {

				for (let i=0; eventPrefixes[i]; i++) Broadcast.call(`${eventPrefixes[i]} Added`, [newObject]);

			} else {

				// Ничего не было и пришло с сервера опять ничего...

			}

		}

	}

};

export default Service;
