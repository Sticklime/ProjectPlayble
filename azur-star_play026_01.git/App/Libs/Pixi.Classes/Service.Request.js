export const Request = {

	Name: "Service Request",

	init() {

	},

	get(url, next){

		let req = new XMLHttpRequest();

		req.onreadystatechange = function(res) {

			if (this.readyState === 4 && this.status === 200) {

				//TODO: Get correct data, not "res.responseJSON"

				Broadcast.call("Server Data Received", [res.responseJSON]);

				next(res.responseJSON);

			}

		};

		req.open("GET", url, true);

		req.send();

	},

	post(url, object, next){

		let req = new XMLHttpRequest();

		req.onreadystatechange = function(event) {

			if (this.readyState === 4 && this.status === 200) {

				let result = null;

				if (req.responseJSON) result = req.responseJSON;

				else if (req.responseText && req.responseText.charAt(0) === '{') {

					try {

						result = JSON.parse(req.responseText);

					} catch(e) {

						result = null;

					}

				}

				Broadcast.call("Server Data Received", [result, req, event]);

				next(result, req, event);

			}

		};

		req.open("POST", url, true);

		req.setRequestHeader("Content-type", "application/json");

		if (_.isString(object)) {

			let o = {};

			o[object] = true;

			object = o;

		}

		req.send(JSON.stringify(object));

	}

};

export default Request;
