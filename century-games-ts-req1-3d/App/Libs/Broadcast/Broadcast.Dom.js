Broadcast.isTouchDevice = (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

if (Broadcast.isTouchDevice) {

	document.addEventListener('touchstart', function(e) {

		Broadcast.call('Document Press Down', [e]);

	});

	document.addEventListener('touchend', function(e) {

		Broadcast.call('Document Press Up', [e]);

	});

	document.addEventListener('touchmove', function(e) {

		Broadcast.call('Document Move', [e]);

	});

} else {

	document.addEventListener('mousedown', function(e) {

		Broadcast.call('Document Press Down', [e]);

	});

	document.addEventListener('mouseup', function(e) {

		Broadcast.call('Document Press Up', [e]);

	});

	document.addEventListener('mousemove', function(e) {

		Broadcast.call('Document Move', [e]);

	});

	document.addEventListener('wheel', function(e) {

		Broadcast.call('Document Wheel', [e]);

	}, {passive: false});

}

document.addEventListener('keydown', function(e) {

	if (e.repeat) return;

	Broadcast.call('Document Key Down', [e]);

	let keys = [];

	if (e.ctrlKey) keys.push('ctrl');
	if (e.shiftKey) keys.push('shift');
	if (e.altKey) keys.push('alt');

	keys.push(e.key);

	Broadcast.call(keys.join(' + ') + ' Down', [e]);

	keys[keys.length - 1] = '<' + e.keyCode + '>';

	Broadcast.call(keys.join(' + ') + ' Down', [e]);

});

document.addEventListener('keyup', function(e) {

	Broadcast.call('Document Key Up', [e]);

	let keys = [];

	if (e.ctrlKey) keys.push('ctrl');
	if (e.shiftKey) keys.push('shift');
	if (e.altKey) keys.push('alt');

	keys.push(e.key);

	Broadcast.call(keys.join(' + ') + ' Up', [e]);

	keys[keys.length - 1] = '<' + e.keyCode + '>';

	Broadcast.call(keys.join(' + ') + ' Up', [e]);

});

document.addEventListener('keypress', function(e) {

	Broadcast.call('Document Key Press', [e]);

	let keys = [];

	if (e.ctrlKey) keys.push('ctrl');
	if (e.shiftKey) keys.push('shift');
	if (e.altKey) keys.push('alt');

	keys.push(e.key);

	Broadcast.call(keys.join(' + ') + ' Press', [e]);

	keys[keys.length - 1] = '<' + e.keyCode + '>';

	Broadcast.call(keys.join(' + ') + ' Press', [e]);

});
