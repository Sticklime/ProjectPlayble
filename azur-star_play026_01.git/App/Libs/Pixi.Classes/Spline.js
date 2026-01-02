var Spline = function(points, tension = 0.5) {

	this.points = points;

	this.tension = tension;

	// There will be two control points for each "middle" point, 1 ... count-2e
	this.cps = [];

	for (let i = 0; i < points.length - 2; i += 1) {

		this.cps = this.cps.concat(this.ctlpts(points[2 * i], points[2 * i + 1], points[2 * i + 2], points[2 * i + 3], points[2 * i + 4], points[2 * i + 5]));

	}

	// All Bezie curves for current spline
	this.curves = this.getCurves();

	// Full distance (length of the spline)
	this.length = this.getDistance();

};

Spline.prototype = {

	getDistance() {

		let length = 0;

		this.eachCurves(function(curve_object) {

			length += curve_object.length;

		});

		return length;

	},

	//Returns spline point on specified distance from spline start
	getPointByDistance(distance) {

		let distance_curve;

		this.eachCurves(function(curve_object) {

			if (distance < curve_object.endDistance) {

				distance_curve = curve_object;

				return false;

			}

		});

		if (distance_curve) {

			const t = (distance - distance_curve.startDistance) / distance_curve.length;

			const distance_point = distance_curve.curve.compute(t);

			return {
				curve: distance_curve.curve,
				x: distance_point.x,
				y: distance_point.y,
				t: t
			};

		} else {

			return {
				curve: this.curves[this.curves.length-1],
				x: this.points[this.points.length-2],
				y: this.points[this.points.length-1],
				t: 1
			};

		}

	},

	getAngleByDistance(distance) {

		const point = this.getPointByDistance(distance);

		if (!point || !point.curve || !point.curve.derivative) return 0;

		return point.curve.derivative(point.t);

	},

	//Return the list of spline points with specified x coordinate.
	getPointsByX(target_x) {

		let result_points = [];

		this.eachCurves(function(curve_object) {

			//TODO: Why Infinity, NEGATIVE_INFINITY, POSITIVE_INFINITY, MIN_SAFE_INTEGER MAX_SAFE_INTEGER MAX_VALUE not works here?
			let points = curve_object.curve.intersects({p1: {x: target_x, y: -1000000000}, p2: {x: target_x, y: 1000000000}});

			if (points && points.length > 0) result_points = result_points.concat(points.map(function(t) {

				return {
					curve: curve_object,
					point: curve_object.curve.compute(t),
					distance: curve_object.length * t
				}

			}));

		});

		return result_points;

	},

	//Return nearest spline point to specified off-spline point
	getNearestPoint(point) {

		let nearest_curve_object;
		let nearest_point;
		let nearest_point_distance;

		this.eachCurves(function(curve_object) {

			const curve_nearest_point = curve_object.curve.project(point);

			const curve_nearest_point_distance = Math.sqrt(Math.pow(point.x - curve_nearest_point.x, 2) + Math.pow(point.y - curve_nearest_point.y, 2));

			if (!nearest_curve_object || nearest_point_distance > curve_nearest_point_distance) {

				nearest_curve_object = curve_object;
				nearest_point = curve_nearest_point;
				nearest_point_distance = curve_nearest_point_distance;

			}

		});

		return {
			curve: nearest_curve_object,
			x: nearest_point.x,
			y: nearest_point.y,
			t: nearest_point.t
		};

	},

	//Returns list of all curves used in this spline
	getCurves() {

		const pts = this.points;
		const cps = this.cps;

		let count = pts.length / 2;

		let distance = 0;

		let last_position = [pts[0], pts[1]];

		const curves = [];

		for (let i=0; i<count; i++) {

			let curve;

			if (i === 0) {

				curve = new Bezier(last_position[0], last_position[1], cps[0], cps[1], pts[2], pts[3]);

				last_position = [pts[2], pts[3]];

				i++;

			} else if (i === count - 1) {

				curve = new Bezier(last_position[0], last_position[1], cps[(2 * (i - 1) - 1) * 2], cps[(2 * (i - 1) - 1) * 2 + 1], pts[i * 2], pts[i * 2 + 1]);

				last_position = [pts[2], pts[3]];

			} else {

				curve = new Bezier(last_position[0], last_position[1], cps[(2 * (i - 1) - 1) * 2], cps[(2 * (i - 1) - 1) * 2 + 1], cps[(2 * (i - 1)) * 2], cps[(2 * (i - 1)) * 2 + 1], pts[i * 2], pts[i * 2 + 1]);

				last_position = [pts[i * 2], pts[i * 2 + 1]];

			}

			const curve_length = curve.length();

			curves.push({
				curve: curve,
				startDistance: distance,
				endDistance: distance + curve_length,
				length: curve_length
			});

			distance += curve_length;

		}

		return curves;

	},

	eachCurves(fn) {

		for (let i=0; this.curves[i]; i++) {

			const result = fn.apply(this, [this.curves[i]]);

			if (result === false) break;

		}

	},

	ctlpts(x1, y1, x2, y2, x3, y3) {

		let t = this.tension;
		let v = this.va(arguments, 0, 2);
		let d01 = this.dista(arguments, 0, 1);
		let d12 = this.dista(arguments, 1, 2);
		let d012 = d01 + d12;

		return [x2 - v[0] * t * d01 / d012, y2 - v[1] * t * d01 / d012, x2 + v[0] * t * d12 / d012, y2 + v[1] * t * d12 / d012];

	},

	dista(arr, i, j) {

		return Math.sqrt(Math.pow(arr[2 * i] - arr[2 * j], 2) + Math.pow(arr[2 * i + 1] - arr[2 * j + 1], 2));

	},

	va(arr, i, j) {

		return [arr[2 * j] - arr[2 * i], arr[2 * j + 1] - arr[2 * i + 1]];

	}

};