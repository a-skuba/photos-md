/**!
 * Material design image gallery (similar to Google Photos)
 * @module photos-md
 * @version v3.0.0-es6
 * @author Anej Skubic <anej@skuba-buba.com>
 * @copyright Anej Skubic 2016
 * @license MIT License
 * @link https://github.com/a_skuba/photos-md photos-md
 */


//
// Variables
//

var settings = {
	'id': '#galerija',	// id for section
	'transition': 500,	// animation and transition duration
	'zoomMethode': 1,	// zoom methode: 1 - position: fixed, 2 - position: absolute
	'debug': 0,
	'touch': {
		enable: true,   // enable touch gestures
		minX: 30,
		maxX: 30,
		minY: 50,
		maxY: 60,
	},
	'create': [],
	'preview': 1,
	// MERGE settings
	'merge': function (userSettings) {
		// first merge debug, so logs can be done properly
		if (userSettings.hasOwnProperty('debug') && userSettings['debug'] == 1) {
			this.debug = 1;
		}
		if (this.debug) console.groupCollapsed('photosMd.settings.merge:');

		// spin through array and merge one by one
		for (var key in userSettings) {

			// test if both has the key property
			if (userSettings.hasOwnProperty(key) && this.hasOwnProperty(key)) {

				// test for id
				if (key == 'id' && userSettings.id.search('#') < 0) {
					console.warn('photos-md: (No # in ID)');
					//break;
				}
				// merge
				this[key] = userSettings[key];

				if (this.debug) console.info(key + ' merged');
			}
			else {

				// invalid key
				try {
					console.warn(`photosMd.settings.merge: (Unvalid user-settings: ${key})`);
				} catch (e) { }
			}
		}

		if (this.debug) {
			console.info(this);
			console.groupEnd();
		}
	}
},
	viewport = {
		'init': function () {
			// set document element
			var doc = document.documentElement;

			// calculate properties
			this.width = Math.max(doc.clientWidth, window.innerWidth || 0);
			this.height = Math.max(doc.clientHeight, window.innerHeight || 0);
			this.scroll = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

			return this;
		},
		'getScroll': function () {
			// set document element
			var doc = document.documentElement;
			// calc actual scroll (cross-browser)
			return ((window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0));
		}
	}.init(),
	fig = [],
	imgsBuffer = {
		'preview': {},
		'full': {},
		'add': function (src) {
			// determine for which array it is
			if (src.search('/preview/') > 0) {
				var size = 'preview';
			}
			if (src.search('/full/') > 0) {
				var size = 'full';
			}

			// get only name of image
			var name = src.slice(src.lastIndexOf('/') + 1, src.length);
			//check if it dosent exists already
			if (!this[size].hasOwnProperty(name)) {
				// create image object and add it to array
				var img = new Image();
				img.src = src;
				this[size][name] = img;
			}

			return this;
		}
	},
	flags = {
		'imgNextTransitionProgress': 0,
		'imgGa': 0,
	},
	pointer = {
		'disable': 0,
		'init': function () {
			this.start = {
				x: 0,
				y: 0
			};
			this.end = {
				x: 0,
				y: 0
			};
			this.target = null;

			return this;
		}
	}.init();


//
// Methods
//

/**
 * Handle video figure (future implementation)
 * @private
 * @param {Element} fig	The element to operate..
 */
function video (fig) {
	// further development
	if (settings.debug) {
		console.groupCollapsed('photosMd.video:');
		console.warn(fig);
		console.groupEnd();
	}
}

/**
 * Open image in full screen
 * @public
 * @param {Event} e	The event to open target from
 */
function open (e) {
	if (settings.debug) console.groupCollapsed('photosMd.open:');

	if (settings.debug) { console.info('Open target:', e.currentTarget); }
	var element = e.currentTarget;
	for (var i = 0; i < fig.length; i++) {
		if (element == fig[i].element) element = fig[i];
	}
	//console.log(element);

	element.element.style.width = element.size.width + 'px';

	var div = element.element.querySelector('div'),
		img = element.element.querySelector('img'),
		section = document.querySelector(settings.id),
		dimmer = section.querySelector('.galerija-dimmer'),
		controler = section.querySelector('.galerija-controler');

	var transform = `scale(${element.scale.min}) translate(${element.translate.x}px, ${(element.translate.y + (viewport.getScroll() - viewport.scroll) / element.scale.min)}px)`;
	if (settings.debug) {
		console.log(transform);
		console.log(element.translate.y, viewport.scroll, window.pageYOffset, element.scale.min);
	}

	dimmer.style.transition = `opacity ${settings.transition * 1.5}ms ease-out`;
	dimmer.style.opacity = 0;

	div.style.transition = `transform ${settings.transition}ms ease-out, opacity ${settings.transition}ms ease-out`;
	div.style.zIndex = 30;
	div.style.backgroundColor = 'rgba(0,0,0,.7)';

	if (settings.zoomMethode) {
		div.style.position = 'fixed';
		div.style.top = (element.position.top - viewport.getScroll() + viewport.scroll) + 'px';
		div.style.left = element.position.left + 'px';
	}
	else {
		element.element.style.position = 'relative';
		element.element.style.overflow = 'visible';
		div.style.position = 'absolute';
		div.style.top = 0;
		div.style.left = 0;
	}

	div.style.height = element.size.height + 'px';
	div.style.width = element.size.width + 'px';
	div.offsetHeight;
	div.style.transform = transform;
	//div.offsetHeight;

	if (!element.element.classList.contains('video'))
		img.setAttribute('src', src(img));

	dimmer.classList.remove('close');
	dimmer.classList.add('open');
	dimmer.offsetHeight;
	dimmer.style.opacity = 1;
	controler.classList.remove('close');
	controler.classList.add('open');

	if (element.element.classList.contains('video'))
		video(element);

	element.element.classList.add('zoom');
	document.querySelector('html').classList.add('lock');
	document.querySelector('body').classList.add('lock');

	// url history
	var url = element.element.querySelector('figcaption > a').getAttribute('href'),
		state = { url: url },
		title = url.substr(url.indexOf('=') + 1, url.indexOf('.'));
	window.history.replaceState(state, title, url);
	//console.log(state, title, url);

	// GAnalytics
	if(typeof ga != 'undefined')
		ga('send', 'event', {
			eventCategory: 'photosMd',
			eventAction: 'Open',
			eventLabel: url,
			eventValue: flags.imgGa
		});

	if (settings.debug) console.groupEnd();
}

/**
 * Transition to next image
 * @public
 * @param {String|Event} e	String or object with class containing Left or Right
 * @returns
 */
function next (e) {
	if (settings.debug) console.groupCollapsed('photosMd.next:');

	if (pointer.disable) {
		if (settings.debug) console.groupEnd();
		return;
	}
	pointer.disable = 1;
	// determine direction
	var direction = 0;
	//console.log(e, this);
	if (settings.debug) console.info('Type of event/argument: [' + typeof e + ']', e);

	if ((typeof e === 'string' && e.toLowerCase() == 'left') || (typeof e === 'object' && e.currentTarget.classList.contains('left'))) {
		if (settings.debug) console.info('Direction: Left');
		direction = -1;
	}
	else if ((typeof e === 'string' && e.toLowerCase() == 'right') || (typeof e === 'object' && e.currentTarget.classList.contains('right'))) {
		if (settings.debug) console.info('Direction: Right');
		direction = 1;
	}
	else {
		console.warn('Direction: Something went wrong here');
		pointer.disable = 0;
		if (settings.debug) console.groupEnd();
		return;
	}

	// start searching for next div
	var section = document.querySelector(settings.id),
		figs = section.querySelector('.zoom').parentNode.querySelectorAll('figure');

	// get all visible figures (filter can hidde them)
	var visibleFigs = [];
	for (var i = 0; i < figs.length; i++) {
		if (fig[i].element.getAttribute('hidden') == null) {
			visibleFigs.push(figs[i]);
		}
	}

	// check if its possible to get further running
	if (figs.length < 2 || visibleFigs.length < 2) {
		if (settings.debug) console.info('No. of figs: Only one fig');
		pointer.disable = 0;
		if (settings.debug) console.groupEnd();
		return;
	}
	else {
		if (settings.debug) console.info(`No. of figs: (Figs: ${figs.length}, visible Figs:${visibleFigs.length})`);
	}

	// get current and next div serial number
	for (var i = 0; i < figs.length; i++) {
		if (figs[i].classList.contains('zoom')) {
			var next = i + direction;
			var curr = i;

			if (next >= figs.length) { next = 0; }
			else if (next < 0) { next = figs.length - 1; }
		}
	}

	// check if next div is vissible and shift next till visible div
	while (fig[next].element.getAttribute('hidden') != null) {
		next += direction;
		if (next >= figs.length) { next = 0; }
		else if (next < 0) { next = figs.length - 1; }
	}

	if (settings.debug) {
		console.info(`Current fig: ${curr}`);
		console.info(`Next fig: ${next}, ${fig[next].element}`);
	}

	// fix figure width size
	fig[next].element.style.width = fig[next].size.width + 'px';

	// set some variables
	var nextDiv = fig[next].element.querySelector('div'),
		nextImg = fig[next].element.querySelector('img'),
		currDiv = fig[curr].element.querySelector('div'),
		currImg = fig[curr].element.querySelector('img');

	// calc translate path size
	var translateAnimation = (direction * viewport.width / 2 * 0.3);

	// calc first & final position
	var transformFirst = `scale(${fig[next].scale.min}) translate(${(fig[next].translate.x + translateAnimation)}px, ${(fig[next].translate.y + (window.pageYOffset - viewport.scroll) / fig[next].scale.min)}px)`,
		transform = `scale(${fig[next].scale.min}) translate(${fig[next].translate.x}px, ${(fig[next].translate.y + (window.pageYOffset - viewport.scroll) / fig[next].scale.min)}px)`;

	if (settings.debug) {
		console.info(`1st transform: ${transformFirst}`);
		console.info(`2nd transform: ${transform}`);
	}

	// prepare next div for transition, 0s tranistion
	nextDiv.style.transition = 'none !important';
	nextDiv.style.opacity = 0;
	nextDiv.style.position = 'fixed';
	nextDiv.style.zIndex = 30;
	nextDiv.style.backgroundColor = 'rgba(0,0,0,.7)';
	nextDiv.style.top = (fig[next].position.top - window.pageYOffset + viewport.scroll) + 'px';
	nextDiv.style.left = fig[next].position.left + 'px';
	nextDiv.style.height = fig[next].size.height + 'px';
	nextDiv.style.width = fig[next].size.width + 'px';
	nextDiv.style.transform = transformFirst;
	// Trigger a reflow, flushing the CSS changes, hack for transition
	nextDiv.offsetHeight;

	// change transition timing for animation
	nextDiv.style.transition = `transform ${settings.transition}ms ease-out, opacity ${settings.transition}ms ease-out`;

	if (!fig[next].element.classList.contains('video'))
		nextImg.setAttribute('src', src(nextImg));

	// replace transform->translateX value
	var currTranslateX = parseFloat((currDiv.style.transform).match(/[\s\S]+.translate\(([-\d.]+)px[\s\S]+/)[1]) - (translateAnimation),
		currTranslate = (currDiv.style.transform).replace(/translate\(([-\d.]+)px/g, `translate(${currTranslateX}px`);
	// apply exit to current div
	currDiv.style.transform = currTranslate;
	currDiv.style.opacity = 0;

	// apply arrive to next div
	nextDiv.style.transform = transform;
	nextDiv.style.opacity = 1;

	// wait for animation and clean up
	var timer = setTimeout(function () {
		clearTimeout(timer);
		//currDiv.style.position = '';
		//currDiv.style.zIndex = '';
		//currDiv.style.top = '';
		//currDiv.style.left = '';
		if (!fig[curr].element.classList.contains('video'))
			currImg.setAttribute('src', src(currImg));
		currDiv.removeAttribute('style');
		fig[curr].element.removeAttribute('style');

		fig[curr].element.classList.remove('zoom');
		fig[next].element.classList.add('zoom');

		pointer.disable = 0;

		if (settings.debug) console.groupEnd();
	}, settings.transition);

	// url history change
	var url = fig[next].element.querySelector('figcaption > a').getAttribute('href'),
		state = { url: url },
		title = url.substr(url.indexOf('=') + 1, url.indexOf('.'));
	window.history.pushState(state, title, url);

	// GAnalytics
	if(typeof ga != 'undefined')
		ga('send', 'event', {
			eventCategory: 'photosMd',
			eventAction: 'Next',
			eventLabel: url.replace('?p=', ''),
			eventValue: flags.imgGa
		});
}

/**
 * Close fullscreen gallery
 * @public
 */
function close () {
	if (settings.debug) console.groupCollapsed('photosMd.close:');

	if (pointer.disable) {
		if (settings.debug) console.groupEnd();
		return;
	}
	pointer.disable = 1;

	var element = document.querySelector('.zoom'),
		img = element.querySelector('img'),
		section = document.querySelector(settings.id),
		dimmer = section.querySelector('.galerija-dimmer'),
		controler = section.querySelector('.galerija-controler'),
		div = document.querySelector('.zoom > div'),
		figcaption = document.querySelector('.zoom figcaption');

	dimmer.classList.remove('open');
	dimmer.classList.add('close');
	controler.classList.remove('open');
	controler.classList.add('close');

	div.style.transform = '';
	div.style.zIndex = '10';
	figcaption.style.opacity = 0;
	//div.style.transition = 'transform '+settings.transition+'ms ease-out, opacity '+settings.transition+'ms ease-out';

	var timer = setTimeout(function () {
		clearTimeout(timer);
		div.style.position = '';
		div.style.zIndex = '';
		div.style.top = '';
		div.style.left = '';

		div.removeAttribute('style');
		element.classList.remove('zoom');
		element.removeAttribute('style');
		figcaption.removeAttribute('style');
		if (!element.classList.contains('video'))
			img.setAttribute('src', src(img));
		dimmer.removeAttribute('style');
		pointer.disable = 0;
	}, settings.transition);

	document.querySelector('html').classList.remove('lock');
	document.querySelector('body').classList.remove('lock');

	// url history
	var href = element.querySelector('figcaption > a').getAttribute('href'),
		url = (decodeURIComponent(window.location.pathname + window.location.search + window.location.hash)).replace(href, '');
	window.history.replaceState('', '', url);

	// GAnalytics
	if(typeof ga != 'undefined')
		ga('send', 'event', {
			eventCategory: 'photosMd',
			eventAction: 'Close',
			eventLabel: href,
			eventValue: flags.imgGa
		});

	if (settings.debug) console.groupEnd();
}

/**
 * Function to filter images
 * @private
 * @param {Event} e	Event with target object to filter
 * @returns
 */
function filter (e) {
	if (settings.debug) console.groupCollapsed('photosMd.filter:');
	// dont execute on same filter
	if (e.currentTarget.classList.contains('active') && !e.currentTarget.classList.contains('more')) {
		if (settings.debug) console.groupEnd();
		return;
	}

	if (settings.debug) console.log(e.currentTarget);

	// get filter tag
	var filter = e.currentTarget.getAttribute('data-filter'),
		galerija = document.querySelector(settings.id),
		more = galerija.querySelector('button.more');

	// more button handling
	if (e.currentTarget.classList.contains('more') || more.getAttribute('hidden') === null) {
		if (settings.debug) console.log('More button hidden');
		more.setAttribute('hidden', true);
	}

	// set active filter button
	var active = e.currentTarget.parentNode.querySelector('button[name="filter"].active');
	if (active === null) {
		active = e.currentTarget.parentNode.querySelector('button[data-filter="all"]');
	}
	active.classList.remove('active');
	e.currentTarget.classList.add('active');

	// hide or show images
	var figs = galerija.querySelectorAll('figure');
	if (settings.debug) console.groupCollapsed('filter loop:');
	for (var i = 0; i < figs.length; i++) {
		// copy data-filter atribute to variable
		var set = figs[i].querySelector('img').getAttribute('data-filter');
		if (settings.debug) console.info(`Data filter: ${set}`);

		// check if filter name is in given varirable & set show/hide class
		if (set.indexOf(filter) === -1) {
			figs[i].classList.add('hide');
			figs[i].classList.remove('show');
		}
		else {
			figs[i].classList.add('show');
			figs[i].classList.remove('hide');
		}

		// wait animation, than add attribute hidden
		var timer = setTimeout(function () {
			clearTimeout(timer);
			var galerija = document.querySelector(settings.id),
				figs = galerija.querySelectorAll('figure'),
				i = 0;

			for (i = 0; i < figs.length; i++) {
				if (figs[i].classList.contains('hide')) {
					figs[i].setAttribute('hidden', true);
					figs[i].classList.remove('hide');
				}
				else if (figs[i].classList.contains('show')) {
					figs[i].removeAttribute('hidden');
					figs[i].clientHeight;
					figs[i].classList.remove('show');
				}
			}
		}, settings.transition / 2);
	}
	if (settings.debug) console.groupEnd();

	var timer2 = setTimeout(function () {
		clearTimeout(timer2);

		document.querySelector(settings.id).offsetHeight;
		resize();
	}, settings.transition / 2);

	// GAnalytics
	if(typeof ga != 'undefined')
		ga('send', 'event', {
			eventCategory: 'photosMd',
			eventAction: 'Filter',
			eventLabel: filter
		});

	if (settings.debug) console.groupEnd();
}

/**
 * Recalculate objects on window resize/orientation change
 * @private
 */
function resize () {
	if (settings.debug) {
		console.groupCollapsed('photosMd.resize:');
		//console.profile('photoMd.resize');
		//var start = new Date().getTime();
	}

	var section = document.querySelector(settings.id),
		figure = section.querySelectorAll('figure'),
		zoomed = section.querySelector('.zoom'),
		i = 0;

	viewport.init();

	for (i = 0; figure.length > i; i++) {
		// skip hidden elements
		if (!(figure[i].getAttribute('hidden') == null)) continue;

		var tmpFig = position(figure[i]);

		tmpFig.scale = {
			'x': viewport.width / (tmpFig.size.width),
			'y': viewport.height / (tmpFig.size.height),
			'init': function () {
				this.min = this.x > this.y ? this.y : this.x;
				delete this.init;
				return this;
			}
		}.init();

		tmpFig.translate = translate(tmpFig);
		tmpFig.element = figure[i];

		if (settings.debug) console.info(tmpFig.translate);
		fig[i] = tmpFig;
	}

	if (zoomed) {
		if (settings.debug) console.groupCollapsed('Zoomed:');

		for (var i = 0; fig.length > i; i++) {
			if (fig[i].element.classList.contains('zoom')) {

				var obj = fig[i];
				if (settings.debug) console.info(obj);

				break;
			}
		}

		var div = obj.element.querySelector('div');

		var transform = `scale(${obj.scale.min}) translate(${obj.translate.x}px, ${(obj.translate.y + (window.pageYOffset - viewport.scroll) / obj.scale.min)}px)`;
		if (settings.debug) {
			console.info(transform);
			console.info(obj.translate.y, viewport.scroll, window.pageYOffset, obj.scale.min);
		}

		div.style.position = 'fixed';
		div.style.zIndex = 30;
		div.style.backgroundColor = 'rgba(0,0,0,.7)';
		div.style.top = (obj.position.top - window.pageYOffset + viewport.scroll) + 'px';
		div.style.left = obj.position.left + 'px';
		div.style.height = obj.size.height + 'px';
		div.style.width = obj.size.width + 'px';
		div.style.transform = transform;

		if (settings.debug) console.groupEnd();
	}

	if (settings.debug) {
		console.groupEnd();
		//console.profileEnd();
		//var end = new Date().getTime();
		//var time = end - start;
		//console.warn('Execution time: ' + time);
	}
}

/**
 * Keyevent handler
 * @private
 * @param {Event} e	Event with target
 */
function keyevent(e) {
	if (settings.debug) console.groupCollapsed('photosMd.keyevent:');
	// disable multiple trigers
	if (pointer.disable) {
		if (settings.debug) console.groupEnd();
		return;
	}
	//pointer.disable = 1;

	// pass and test event object
	e = e || window.event;
	if (settings.debug) console.info('KEY: ', e.keyCode, e.key);
	if (e.keyCode != 27 && e.keyCode != 37 && e.keyCode != 39 && e.keyCode != 40) {
		if (settings.debug) console.groupEnd();
		return;
	}

	// gallery buttons
	if (document.querySelector('.zoom') && !flags.imgNextTransitionProgress) {

		if (settings.debug) console.info('Working on keyevent');

		flags.imgNextTransitionProgress = 1;
		var timer = setTimeout(function () {
			clearTimeout(timer);
			flags.imgNextTransitionProgress = 0;
			if (settings.debug) console.info('Clear "imgNextTransitionProgress" flag');
			if (settings.debug) console.groupEnd();
		}, settings.transition);

		// ESCAPE:	27
		// LEFT: 	37
		// RIGHT:	39
		if (e.keyCode == 27 || e.keyCode == 40) {
			close();
			//if (settings.debug) console.groupEnd(); // ni potreben ker je timer zgoraj
			return;
		}
		else if (e.keyCode == 37) {
			next('left');
		}
		else if (e.keyCode == 39) {
			next('right');
		}
	}
	else {
		if (settings.debug) console.groupEnd();
	}
}

/**
 * init start position on touch
 * @private
 * @param {Event} e	Touch event object
 */
function touchStart (e) {
	if (pointer.disable) {
		if (settings.debug) console.groupEnd();
		return;
	}
	//pointer.disable = 1;
	e.currentTarget.classList.add('active');
	e.currentTarget.offsetHeight;

	pointer.start.x = e.clientX;
	pointer.start.y = e.clientY;

	fig.forEach(figure => {
		if (figure.element.classList.contains('zoom')) {
			console.log(figure);
			pointer.target = figure;
		}
	});
}

function touchMove(e) {
	if (pointer.start.x == 0 && pointer.start.y == 0) {
		return;
	}

	let move = {
		x: pointer.start.x - e.clientX,
		y: pointer.start.y - e.clientY
	};

	pointer.target.element.querySelector('div').style.transform = `scale(${pointer.target.scale.min}) translate(${pointer.target.translate.x - move.x / pointer.target.scale.min}px, ${(pointer.target.translate.y - (move.y / pointer.target.scale.min) + (viewport.getScroll() - viewport.scroll) / pointer.target.scale.min)}px)`;
}

/**
 * Execute action on touch
 * @private
 * @param {Event} e Touch event object
 */
function touchEnd (e) {
	if (pointer.disable) {
		if (settings.debug) console.groupEnd();
		return;
	}
	e.currentTarget.classList.remove('active');
	//pointer.disable = 1;
	console.log('Pointer end:', e);
	e.preventDefault();

	pointer.end.x = e.clientX;
	pointer.end.y = e.clientY;

	//pointer.disable = 0;

	var startX = pointer.start.x,
		endX = pointer.end.x,
		startY = pointer.start.y,
		endY = pointer.end.y,
		tMinX = settings.touch.minX,
		tMaxX = settings.touch.maxX,
		tMinY = settings.touch.minY,
		tMaxY = settings.touch.maxY,
		direction = '';

	//horizontal detection
	if ((((endX - tMinX > startX) || (endX + tMinX < startX)) && ((endY < startY + tMaxY) && (startY > endY - tMaxY) && (endX > 0)))) {
		if (endX > startX) direction = 'left';
		else direction = 'right';
	}
	//vertical detection
	else if ((((endY - tMinY > startY) || (endY + tMinY < startY)) && ((endX < startX + tMaxX) && (startX > endX - tMaxX) && (endY > 0)))) {
		if (endY > startY) direction = 'down';
		else direction = 'up';
	}

	if (direction == 'left' || direction == 'right') {
		next(direction);
	}
	else if (direction == 'down' /*|| direction == 'up'*/) {
		close();
	} else {
		console.log(pointer.target.element);
		pointer.target.element.querySelector('div').style.transform = `scale(${pointer.target.scale.min}) translate(${pointer.target.translate.x}px, ${(pointer.target.translate.y + (viewport.getScroll() - viewport.scroll) / pointer.target.scale.min)}px)`;
	}

	direction = '';
	pointer.init();
	//pointer.disable = 0;
	return false;
}

/**
 * Calculate position of element
 * @private
 * @param {Element} el	Element to calculate position
 * @returns {Object}	Object with size, position and margin values
 */
function position (el) {
	el.offsetHeight;

	var _x = 0,
		_y = 0,
		_style = el.currentStyle || window.getComputedStyle(el),
		_margin = {
			'top': parseInt(_style.marginTop.replace(/[^-\d\.]/g, '')),
			'left': parseInt(_style.marginLeft.replace(/[^-\d\.]/g, ''))
		},
		_size = {
			height: el.getBoundingClientRect().height,
			width: el.getBoundingClientRect().width
		};

	while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
		_x += el.offsetLeft - el.scrollLeft;
		_y += el.offsetTop - ((window.pageYOffset || el.scrollTop) - (el.clientTop || 0));

		el = el.offsetParent;
	}
	_y += viewport.getScroll();
	//_y -= _margin.top;
	//_x -= _margin.left;

	return {
		size: _size,
		position: {
			top: _y,
			left: _x
		},
		margin: _margin
	};
}

/**
 * Calculate translate
 * @private
 * @param {Element} el	Element to calculate translate for
 * @returns {Object}	Object with translate coordinates
 */
function translate (el) {
	/* izračuna center slike in center viewporta, ter ju odšteje, nato pa doda še preostanek screena da je slika na sredini -- MYSTIC SHIT :P*/
	return {
		'x': (el.scale.y < el.scale.x ? (viewport.width - el.size.width * el.scale.min) / (2 * el.scale.min) : 0) - ((el.position.left + el.margin.left + el.size.width / 2 * (1 - el.scale.min)) / el.scale.min) + 1,
		'y': (el.scale.y > el.scale.x ? (viewport.height - el.size.height * el.scale.min) / (2 * el.scale.min) : 0) - ((el.position.top + el.margin.top + (el.size.height / 2) - (el.size.height / 2 * el.scale.min)) / el.scale.min) + 1
	};
}

/**
 * Change image source (size)
 * @private
 * @param {Element} slika	Image element
 * @returns {String}	Url path of new image
 */
function src (slika) {
	if (settings.debug) console.groupCollapsed('photosMd.src:');
	// no preview settings
	if (!settings.preview) {
		if (settings.debug) {
			console.info('No preview images (settings).');
			console.groupEnd();
		}
		return slika.getAttribute('src');
	}

	// get src string
	var src = slika.getAttribute('src');
	if (settings.debug) console.info(`Old: ${src}`);

	// add it to buffer
	imgsBuffer.add(src);

	// change full <-> preview
	if (src.search('/preview/') > 0) {
		src = src.replace('preview', 'full');
	}
	else if (src.search('/full/') > 0) {
		src = src.replace('full', 'preview');
	}
	else {
		return 0;
	}
	if (settings.debug) console.info(`New: ${src}`);

	// add to buffer
	imgsBuffer.add(src);

	if (settings.debug) console.groupEnd();
	return src;
}

/**
 * Initialization function
 * @public
 * @param {Object|JSON} userSettings	Settings for photosMd
 */
function init (userSettings) {
	if (Object.keys(userSettings).length > 0) {
		if (userSettings.debug !== undefined && userSettings.debug) {
			console.group('photosMd.init:');
			//console.profile('photosMd.init');
		}
		settings.merge(userSettings);
	}

	// postpone proces if it is not fully loaded and calculated
	if (document.readyState !== 'complete') {
		if (settings.debug) {
			console.info('Init delayed');
			//console.groupEnd();
		}

		window.addEventListener('load', function () {
			init({});
		}, false);

		return;
	}

	// declare variables
	var section = document.querySelector(settings.id),
		dimmer = section.querySelector('.galerija-dimmer'),
		controler = section.querySelector('.galerija-controler'),
		figure = section.querySelectorAll('figure');

	// spin throug figures
	for (var i = 0; figure.length > i; i++) {
		// get position
		var tmpFig = position(figure[i]);

		// calc scale
		tmpFig.scale = {
			'x': viewport.width / (tmpFig.size.width),
			'y': viewport.height / (tmpFig.size.height),
			'init': function () {
				this.min = this.x > this.y ? this.y : this.x;
				delete this.init;
				return this;
			}
		}.init();

		// get translation values
		tmpFig.translate = translate(tmpFig);

		// add reference to element and url history
		tmpFig.element = figure[i];
		tmpFig.history = figure[i].querySelector('figcaption > a').getAttribute('href');

		// add to array
		fig.push(tmpFig);

		// bind event listner for open
		figure[i].addEventListener('click', open, false);
	}

	// add event listners for control buttons in full view mode
	controler.querySelector('.galerija-controler .back').addEventListener('click', close, false);
	controler.querySelector('.galerija-controler .left').addEventListener('click', next, false);
	controler.querySelector('.galerija-controler .right').addEventListener('click', next, false);

	// add event listners for filter buttons
	var filterBtns = section.querySelectorAll('.filter button[name="filter"], footer button[name="filter"][data-filter="all"]');
	for (var i = 0; i < filterBtns.length; i++) {
		filterBtns[i].addEventListener('click', filter, false);
	}
	// add event listner for keyboard
	document.addEventListener('keydown', keyevent, false);
	if (document.attachEvent)
		document.attachEvent('keydown', keyevent);

	// add event listner for resize or orientation change
	window.addEventListener('resize', resize, false);
	window.addEventListener('orientationchange', resize, false);

	// add touch event listner
	if (settings.touch.enable) {
		if ('pointerEvents' in document.documentElement.style) {
			document.querySelector('.galerija-arrows').addEventListener('pointerdown', touchStart, false);
			document.querySelector('.galerija-arrows').addEventListener('pointermove', touchMove, false);
			document.querySelector('.galerija-arrows').addEventListener('pointerup pointerout', touchEnd, false);
			if (settings.debug) console.log('Pointer event support.');
		}
		else {
			document.querySelector('.galerija-arrows').addEventListener('touchstart', touchStart, false);
			document.querySelector('.galerija-arrows').addEventListener('touchmove', touchMove, false);
			document.querySelector('.galerija-arrows').addEventListener('touchend', touchEnd, false);
		}
	}

	// link blocker on figcaption>a clicks (SEO)
	var links = document.querySelectorAll('#galerija figcaption > a');
	for (var i = 0; i < links.length; ++i) {
		links[i].addEventListener('click', function (e) {
			e.preventDefault();
			return false;
		}, false);
	}

	// open image from url
	if (window.location.search.search("(?:/\?|&)p=.+") > 0) {
		var search = window.location.search,
			src = decodeURIComponent('?' + search.slice(search.indexOf('p='), search.indexOf('.jpg') + 4));

		for (var j = 0; j < fig.length; j++) {
			if (fig[j].history == src) {
				if (settings.debug) console.info('Url search match: ', fig[j].history);

				// SAFE: Dont open hidden image - dont show empty viewer!
				if (!(fig[j].element.getAttribute('hidden') == null)) {
					fig[j].element.removeAttribute('hidden');
					fig[j].element.offsetHeight;
					resize();
				}

				if (settings.id.search('#') >= 0)
					window.location.hash = settings.id;

				open({ 'currentTarget': fig[j].element });
				break;
			}
		}
	}

	if (settings.debug) {
		//console.info('Object photosMd: ', this);
		//console.profileEnd();
		console.groupEnd();
	}
}

export { settings, open, next, close, init }
