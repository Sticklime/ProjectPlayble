let Class = function(props_1) {

	let cl = function(props_2) {

		let instance = this,
			props, i, m;

		for (let i in props_1) if (props_1.hasOwnProperty(i) && i !== 'initialize') {

			instance[i] = props_1[i];

		}

		for (m = 0; cl._mixins[m]; m++) {

			props = cl._mixins[m];

			for (i in props) if (props.hasOwnProperty(i) && i !== 'initialize') {

				instance[i] = props[i];

			}

		}

		for (i in props_2) if (props_2.hasOwnProperty(i) && i !== 'initialize') {

			instance[i] = props_2[i];

		}

		if (props_1.initialize) props_1.initialize.apply(instance, arguments);

		if (props_2.initialize) props_2.initialize.apply(instance, arguments);

		for (m = 0; cl._mixins[m]; m++) {

			props = cl._mixins[m];

			if (props.initialize) props.initialize.apply(instance, []);

		}

	};

	cl._mixins = [];

	return cl;

};

Class.mixin = function(target, properties) {

	target._mixins.push(properties);

	return properties;

};


export default Class;