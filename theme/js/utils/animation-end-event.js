/*
	Returns the browser prefixed
	string for the animation end event
*/
export default (() => {
	let t = undefined;
	let eventName;
	const el = document.createElement('div');
	const animationNames = {
		'WebkitAnimation': 'webkitAnimationEnd',
		'MozAnimation': 'animationend',
		'OAnimation': 'oAnimationEnd oanimationend',
		'animation': 'animationend'
	};
	Object.keys(animationNames).forEach( (t) => {
		if (el.style[t] !== undefined) {
			eventName = animationNames[t];
		}
	});
	return eventName;
})();
