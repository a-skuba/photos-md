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

/**
 * Settings
 * @public
 * Holds global settings for photosMd
 */
var settings = {
	id: '#galerija',	// id for section
	transition: 500,	// animation and transition duration
	debug: 0,
	pointer: {
		enable: true,
		tresholdAxis: {
			horizontal: 100,
			vertical: 30
		},
		treshold: {
			horizontal: 128,
			vertical: 72
		},
		check: function () {
			if (this.tresholdAxis.horizontal > this.treshold.horizontal) {
				this.treshold.horizontal = this.tresholdAxis.horizontal;
			}
			if (this.tresholdAxis.vertical > this.treshold.vertical) {
				this.treshold.vertical = this.tresholdAxis.vertical;
			}

			return this;
		}
	}.check(),
	keys: {
		'27': 'close',		// ESCAPE
		'37': 'previous',	// LEFT ARROW
		'38': 'close',		// UP ARROW
		'39': 'next',		// RIGHT ARROW
		'40': 'close',		// DOWN ARROW
		'valid': function () {
			return {
				'close': 1,		// CLOSE
				'previous': 1,	// PRIVIOUS
				'next': 1,		// NEXT
				'next-left': 1,	// PRIVIOUS
				'next-right': 1	// NEXT
			};
		},
		'check': function () {
			for (let key in this) {
				if (typeof this[key] === 'string' && !(this[key] in this.valid())) {
					if (settings.debug) console.warn(`Removing unvalid keybinding: ${key}: ${this[key]}`);
					delete this[key];
				}
			}
		}
	},
	//create: [],
	preview: 1,
	// MERGE settings
	merge: function (userSettings) {
		// TO DO: recursivly merge; run check function if present
		// first merge debug, so logs can be done properly
		if (userSettings.hasOwnProperty('debug') && userSettings['debug'] == 1) {
			this.debug = 1;
		}
		if (this.debug) console.groupCollapsed('photosMd.settings.merge:');
		if (this.debug) console.warn('photosMd.settings.merge: TO DO: recursivly merge; run check function if present');

		// spin through array and merge one by one
		for (let key in userSettings) {

			// test if both has the key property
			if (userSettings.hasOwnProperty(key) && this.hasOwnProperty(key)) {

				// test for id
				if (key == 'id' && userSettings.id.search('#') < 0) {
					console.warn('photos-md: (No # in ID. ID has to be unique. Only one instance per object.)');
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
		this.keys.check();

		if (this.debug) {
			console.info(this);
			console.groupEnd();
		}
	}
};

/**
 * Viewport
 * @private
 * Holds the information about viewport (screen)
 */
var viewport = {
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
}.init();


/**
 * Figure
 * @private
 * Object of registered figures
 * TO-DO: registration function
 */
var fig = [];

/**
 * Images buffer
 * @private
 * Holds images in buffer once fetched
 */
var imgsBuffer = {
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
};

/**
 * State
 * @private
 * Holds application internal run state
 */
var state = {
	interactionProgress: false,
	transitionProgress: false,
	imgGa: 0,
	history: false
};

/**
 * Pointer
 * @private
 * Holds pointer state
 */
var pointer = {
	init: function () {
		this.start = {
			x: null,
			y: null
		};
		this.end = {
			x: null,
			y: null
		};
		this.started = false;
		this.axis = null;
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

	if (state.transitionProgress || document.querySelector(`${settings.id} .zoom`) !== null) {
		if (settings.debug) console.groupEnd();
		return;
	}
	state.transitionProgress = true;

	if (settings.debug) { console.info('Open target:', e.currentTarget); }
	let element = e.currentTarget;
	element = fig.find(el => el.element == element);
	//console.log(element);

	element.element.style.width = `${element.size.width}px`;

	let div = element.element.querySelector('div'),
		img = element.element.querySelector('img'),
		section = document.querySelector(settings.id),
		dimmer = section.querySelector('.galerija-dimmer'),
		controler = section.querySelector('.galerija-controler'),
		transform = `scale(${element.scale.min}) translate(${element.translate.x}px, ${(element.translate.y + (viewport.getScroll() - viewport.scroll) / element.scale.min)}px)`;

	if (settings.debug) {
		console.log(transform);
		console.log(element.translate.y, viewport.scroll, window.pageYOffset, element.scale.min);
	}

	dimmer.style.cssText += `
		transition: opacity ${settings.transition * 1.5}ms ease-out;
		opacity: 0;`;

	div.style.cssText += `
		z-index: 30;
		transition: transform ${settings.transition}ms ease-out, opacity ${settings.transition}ms ease-out;
		background-color: rgba(0,0,0,.7);
		position: fixed;
		top: ${element.position.top - viewport.getScroll() + viewport.scroll}px;
		left: ${element.position.left}px;
		height: ${element.size.height}px;
		width: ${element.size.width}px;`;

	div.offsetHeight;
	div.style.transform = transform;

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

	// url history (open)
	if (state.history) {
		var title = element.element.querySelector('figcaption > a').innerHTML,
			queryValue = element.element.querySelector('figcaption > a').getAttribute('href').substr(3),
			url = updateQueryString('p', queryValue);

		window.history.replaceState(null, title, url);
	}

	// GAnalytics
	if(typeof ga != 'undefined')
		ga('send', 'event', {
			eventCategory: 'photosMd',
			eventAction: 'Open',
			eventLabel: url,
			eventValue: state.imgGa
		});

	state.transitionProgress = false;
	if (settings.debug) console.groupEnd();
}

/**
 * Manipulate query string
 * Add, update or remove query string by name. Empty value will remove query.
 * @author ellemayo
 * @credits http://stackoverflow.com/a/11654596/3529055
 *
 * @param {String} key Search string name to manipulate
 * @param {String} value Value to update. Empty will remove query string name
 * @param {String} url Url string to perform operation on
 * @returns {String} New url
 */
function updateQueryString(key, value, url) {
    if (!url) url = window.location.href;
    let re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi"),
        hash;

    if (re.test(url)) {
        if (typeof value !== 'undefined' && value !== null)
            return url.replace(re, '$1' + key + "=" + value + '$2$3');
        else {
            hash = url.split('#');
            url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
            if (typeof hash[1] !== 'undefined' && hash[1] !== null)
                url += '#' + hash[1];
            return url;
        }
    }
    else {
        if (typeof value !== 'undefined' && value !== null) {
            var separator = url.indexOf('?') !== -1 ? '&' : '?';
            hash = url.split('#');
            url = hash[0] + separator + key + '=' + value;
            if (typeof hash[1] !== 'undefined' && hash[1] !== null)
                url += '#' + hash[1];
            return url;
        }
        else
            return url;
    }
}

/**
 * Transition to next image
 * @public
 * @param {String|Event} e	String or object with class containing Left or Right
 */
function next (e) {
	if (settings.debug) console.groupCollapsed('photosMd.next:');

	if (state.transitionProgress) {
		if (settings.debug) console.groupEnd();
		return;
	}

	state.transitionProgress = true;

	// determine direction
	let direction = 0;
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
		state.transitionProgress = false;
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
		if (settings.debug) {
			console.info('No. of figs: Only one fig');
			console.groupEnd();
		}

		state.transitionProgress = false;
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
	fig[next].element.style.width = `${fig[next].size.width}px`;

	// set some variables
	let nextDiv = fig[next].element.querySelector('div'),
		nextImg = fig[next].element.querySelector('img'),
		currDiv = fig[curr].element.querySelector('div'),
		currImg = fig[curr].element.querySelector('img');

	// calc translate path size
	let translateAnimation = (direction * viewport.width / 2 * 0.3);

	// calc first & final position
	let transformFirst = `scale(${fig[next].scale.min}) translate(${(fig[next].translate.x + translateAnimation)}px, ${(fig[next].translate.y + (window.pageYOffset - viewport.scroll) / fig[next].scale.min)}px)`,
		transform = `scale(${fig[next].scale.min}) translate(${fig[next].translate.x}px, ${(fig[next].translate.y + (window.pageYOffset - viewport.scroll) / fig[next].scale.min)}px)`;

	if (settings.debug) {
		console.info(`1st transform: ${transformFirst}`);
		console.info(`2nd transform: ${transform}`);
	}

	// prepare next div for transition, 0s tranistion
	nextDiv.style.cssText += `transition: none !important;
		opacity: 0;
		position: fixed;
		z-index: 30;
		background-color: rgba(0,0,0,.7);
		top: ${fig[next].position.top - window.pageYOffset + viewport.scroll}px;
		left: ${fig[next].position.left}px;
		height: ${fig[next].size.height}px;
		width: ${fig[next].size.width}px;
		transform: ${transformFirst};`;

	// Trigger a reflow, flushing the CSS changes, hack for transition
	nextDiv.offsetHeight;

	// change transition timing for animation
	nextDiv.style.transition = `transform ${settings.transition}ms ease-out, opacity ${settings.transition}ms ease-out`;

	if (!fig[next].element.classList.contains('video'))
		nextImg.setAttribute('src', src(nextImg));

	// replace transform->translateX value
	let currTranslateX = parseFloat((currDiv.style.transform).match(/[\s\S]+.translate\(([-\d.]+)px[\s\S]+/)[1]) - (translateAnimation),
		currTranslate = (currDiv.style.transform).replace(/translate\(([-\d.]+)px/g, `translate(${currTranslateX}px`);

	// apply exit to current div
	currDiv.style.cssText += `
		transform: ${currTranslate};
		opacity: 0`;

	// apply arrive to next div
	nextDiv.style.cssText += `
		transform: ${transform};
		opacity: 1`;

	// wait for animation and clean up
	let afterTransition = function () {
		nextDiv.removeEventListener('transitionend', afterTransition, false);

		if (!fig[curr].element.classList.contains('video'))
			currImg.setAttribute('src', src(currImg));

		currDiv.removeAttribute('style');
		fig[curr].element.removeAttribute('style');

		fig[curr].element.classList.remove('zoom');
		fig[next].element.classList.add('zoom');

		state.transitionProgress = false;
		if (settings.debug) console.groupEnd();
	}
	nextDiv.addEventListener('transitionend', afterTransition, false);

	// url history change (next)
	if (state.history) {
		let title = fig[next].element.querySelector('figcaption > a').innerHTML,
			queryValue = fig[next].element.querySelector('figcaption > a').getAttribute('href').substr(3),
			url = updateQueryString('p', queryValue);

		window.history.replaceState(null, title, url);
    }

	// GAnalytics
	if(typeof ga != 'undefined')
		ga('send', 'event', {
			eventCategory: 'photosMd',
			eventAction: 'Next',
			eventLabel: url.replace('?p=', ''),
			eventValue: state.imgGa
		});

	// state.transitionProgress > timer
}

/**
 * Close fullscreen gallery
 * @public
 */
function close () {
	if (settings.debug) console.groupCollapsed('photosMd.close:');

	if (state.transitionProgress) {
		if (settings.debug) console.groupEnd();
		return;
	}
	state.transitionProgress = true;

	let element = document.querySelector('.zoom'),
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

	div.style.cssText += `
		transform: none;
		z-index: 10;`;
	figcaption.style.opacity = 0;

	let afterTransition = function () {
		div.removeEventListener('transitionend', afterTransition, false);

		if (!element.classList.contains('video'))
			img.setAttribute('src', src(img));

		[div, element, figcaption, dimmer].forEach(el => el.removeAttribute('style'));
		element.classList.remove('zoom');

		state.transitionProgress = false;
		if (settings.debug) console.groupEnd();
	}
	div.addEventListener('transitionend', afterTransition, false);

	document.querySelector('html').classList.remove('lock');
	document.querySelector('body').classList.remove('lock');

	// url history (close)
	if (state.history) {
		var title = document.querySelector('title').innerHTML,
			url = updateQueryString('p');

		window.history.replaceState(null, title, url);
	}

	// GAnalytics
	if(typeof ga != 'undefined')
		ga('send', 'event', {
			eventCategory: 'photosMd',
			eventAction: 'Close',
			eventLabel: href,
			eventValue: state.imgGa
		});

	// state.transitionProgress > tranistionend
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
	let target = e.currentTarget;
	if (target.classList.contains('active') && !target.classList.contains('more')) {
		if (settings.debug) console.groupEnd();
		return;
	}

	if (settings.debug) console.log(target);

	// get filter tag, get active button
	let filter = target.getAttribute('data-filter'),
		more = document.querySelector(`${settings.id} button.more`),
		active = target.parentNode.querySelector('button[name="filter"].active');

	// more button handling
	if (target.classList.contains('more') || more.getAttribute('hidden') === null) {
		if (settings.debug) console.log('More button hidden');
		more.setAttribute('hidden', true);
	}

	// active filter button is null, set default 'all'
	if (active === null) {
		active = target.parentNode.querySelector('button[data-filter="all"]');
	}
	// change active filter
	active.classList.remove('active');
	target.classList.add('active');

	// hide or show images
	if (settings.debug) console.groupCollapsed('filter loop:');
	document.querySelectorAll(`${settings.id} figure`).forEach(el => {
			// copy data-filter atribute to variable
			let set = el.querySelector('img').getAttribute('data-filter');
			if (settings.debug) console.info(`Data filter: ${set}`);

			// check if filter name is in given varirable & set show/hide class
			if (set.indexOf(filter) === -1) {
				el.classList.add('hide');
				el.classList.remove('show');
			}
			else {
				el.classList.add('show');
				el.classList.remove('hide');
			}

			// wait animation, than add attribute hidden
			var timer = setTimeout(function () {
				clearTimeout(timer);

				document.querySelectorAll(`${settings.id} figure`).forEach(fig => {
				if (fig.classList.contains('hide')) {
					fig.setAttribute('hidden', true);
					fig.classList.remove('hide');
				} else if (fig.classList.contains('show')) {
					fig.removeAttribute('hidden');
					fig.clientHeight;
					fig.classList.remove('show');
				}
			});
			}, settings.transition / 2);
	});
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

	let section = document.querySelector(settings.id),
		zoom = fig.find(el => el.element.classList.contains('zoom'));

	if (typeof zoom !== 'undefined' && viewport.width <= 720) {
		zoom.element.querySelector('div').removeAttribute('style');
		zoom.element.querySelector('div').style.cssText = `transition: all 1ms;`;
		close();
	}

	viewport.init();

	// register figures
	section.querySelectorAll('figure:not([hidden])').forEach(el => {
		let img = el.querySelector('div img');

		img.style.width = '99.99%';
		img.offsetWidth;
		img.removeAttribute('style');

		register(el);
	});

	if (typeof zoom !== 'undefined') {
		if (settings.debug) {
			console.groupCollapsed('Zoomed:');
			console.info(zoom.translate.y, viewport.scroll, window.pageYOffset, zoom.scale.min);
		}

		zoom.element.querySelector('div').style.cssText += `
			position: fixed;
			z-index: 30;
			background-color: rgba(0,0,0,.7);
			top: ${zoom.position.top - window.pageYOffset + viewport.scroll}px;
			left: ${zoom.position.left}px;
			height: ${zoom.size.height}px;
			width: ${zoom.size.width}px;
			transform:
				scale(${zoom.scale.min})
				translate(${zoom.translate.x}px, ${zoom.translate.y + (window.pageYOffset - viewport.scroll) / zoom.scale.min}px);`;

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

	if (state.interactionProgress || state.transitionProgress) {
		if (settings.debug) console.groupEnd();
		return;
	}
	state.interactionProgress = true;

	// pass and test event object
	e = e || window.event;
	if (settings.debug) console.info('KEY: ', e.keyCode, e.key);
	// exit if key not registered in settings
	if (!(e.keyCode in settings.keys)) {
		state.interactionProgress = false;
		if (settings.debug) console.groupEnd();
		return;
	}

	// gallery key buttons
	if (document.querySelector('.zoom') !== null) {
		if (settings.debug) console.info('Working on keyevent');

		switch (settings.keys[e.keyCode]) {
			case 'close':
				close(); break;
			case 'next-left':
			case 'previous':
				next('left'); break;
			case 'next-right':
			case 'next':
				next('right'); break;
			default:
				console.warn(`key events: ${e.keyCode} is not found in keys (settings.keys).`);
		}
	}

	state.interactionProgress = false;
	if (settings.debug) console.groupEnd();
}

/**
 * init start position on touch
 * @private
 * @param {PointerEvent} e	Pointer event object
 */
function pointerStart(e) {
	if (!(e.pressure > 0) || pointer.started || state.interactionProgress || state.transitionProgress) {
		return;
	}
	if (settings.debug) {
		console.groupCollapsed('pointerStart:');
		console.log(e);
	}
	state.interactionProgress = true;
	pointer.started = true;

	// compression benefits
	let target = e.currentTarget;

	// show 'grabbin' mouse
	target.classList.add('active');
	target.offsetHeight;
	// attach move listner
	target.addEventListener('pointermove', pointerMove, false);

	// set pointer start position
	pointer.start.x = e.clientX;
	pointer.start.y = e.clientY;

	// find target
	pointer.target = fig.find(figure => {
		return figure.element.classList.contains('zoom');
	});

	// disable default selection
	e.preventDefault();
	if (document.selection) {
		document.selection.empty();
	} else if (window.getSelection) {
		window.getSelection().removeAllRanges();
	}

	if (settings.debug) console.groupEnd();
}

/**
 * Observe pointer movement
 * @param {PointerEvent} e Pointer event object
 */
function pointerMove(e) {
	if (pointer.started === false || !(e.pressure > 0) || state.transitionProgress) {
		pointer.init();
		return;
	}
	if (settings.debug) {
		console.groupCollapsed('pointerMove:');
		console.log(e);
	}

	// calc movement (move object)
	let move = {
		x: pointer.start.x - e.clientX,
		y: pointer.start.y - e.clientY,
		calcPath: function () {
			this.xPath = Math.abs(this.x);
			this.yPath = Math.abs(this.y);

			return this;
		}
	}.calcPath();

	// test if move is 0 (dont perform anything on pointer down) --is this really needed?
	if (move.xPath < 1 && move.yPath < 1) {
		if (settings.debug) {
			console.log('Zero move.');
			console.groupEnd();
		}
		return;
	}

	// set axis, only when empty (dont override and do `visually unknown` action)
	if (pointer.axis === null) {
		if (move.xPath > settings.pointer.tresholdAxis.horizontal) {
			pointer.axis = 'horizontal';
		} else if (move.yPath > settings.pointer.tresholdAxis.vertical) {
			pointer.axis = 'vertical';
		}
	}

	let translate = {
		x: pointer.target.translate.x,
		y: pointer.target.translate.y + (viewport.getScroll() - viewport.scroll) / pointer.target.scale.min,
		opacity: 1
	};

	// move image with pointer
	if (pointer.axis == 'horizontal') {
		translate.x -= move.x / pointer.target.scale.min;
	} else if (pointer.axis == 'vertical') {
		translate.x -= move.x / pointer.target.scale.min;
		translate.y -= move.y / pointer.target.scale.min;

		translate.opacity -= Math.max(0, Math.min(1, move.yPath / settings.pointer.treshold.vertical));
		//translate.scale += Math.max(0, Math.min(1, move.yPath / settings.pointer.treshold.vertical));
		//(move.yPath - settings.pointer.tresholdAxis.vertical) / (settings.pointer.treshold.vertical - settings.pointer.tresholdAxis.vertical)

		// fade blackout (use scale)
		document.querySelectorAll('.galerija-dimmer.open, .galerija-controler.open')
			.forEach(el => el.style.opacity = translate.opacity);
	} else {
		translate.x -= move.x / pointer.target.scale.min;
		translate.y -= move.y / pointer.target.scale.min;
	}
	// update image position (translate)
	pointer.target.element.querySelector('div')
		.style.transform = `scale(${pointer.target.scale.min}) translate(${translate.x}px, ${translate.y}px)`;

	if (settings.debug) console.groupEnd();
}

/**
 * Execute action on touch
 * @private
 * @param {Event} e Touch event object
 */
function pointerEnd(e) {
	if (pointer.started === false || state.transitionProgress) {
		return;
	}
	if (settings.debug) {
		console.groupCollapsed('pointerEnd:');
		console.log(e);
	}

	let target = e.currentTarget;
	// hide 'grabbin' mouse
	target.classList.remove('active');
	target.offsetHeight;
	// remove move listner
	target.removeEventListener('pointermove', pointerMove, false);

	// prevent selection on dragging
	e.preventDefault();
	if (document.selection) {
		document.selection.empty();
	} else if (window.getSelection) {
		window.getSelection().removeAllRanges();
	}

	pointer.end.x = e.clientX;
	pointer.end.y = e.clientY;

	let move = {
		x: pointer.end.x - pointer.start.x,
		y: pointer.end.y - pointer.start.y,
		direction: ''
	};

	// determine direction
	if (e.type == 'pointerleave' || pointer.axis === null) {
		move.direction = 'none';
	} else if (pointer.axis == 'horizontal' && Math.abs(move.x) >= settings.pointer.treshold.horizontal) {
		move.direction = move.x > 0 ? 'left' : 'right';
	} else if (pointer.axis == 'vertical' && Math.abs(move.y) >= settings.pointer.treshold.vertical) {
		move.direction = move.y > 0 ? 'down' : 'up';
	}

	//pointer.disable = false;
	// execute direction based action
	switch (move.direction) {
		case 'left':
		case 'right':
			next(move.direction);
			break;
		case 'up':
		case 'down':
			close();
			break;
		default:
			pointer.target.element.querySelector('div').style.transform = `scale(${pointer.target.scale.min}) translate(${pointer.target.translate.x}px, ${pointer.target.translate.y}px)`;
			document.querySelectorAll('.galerija-dimmer.open, .galerija-controler.open')
				.forEach(el => el.style.opacity = 1);
	}

	state.interactionProgress = false;
	pointer.init();
	if (settings.debug) console.groupEnd();
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
		_x += el.offsetLeft - ((window.pageXOffset || el.scrollLeft) - (el.clientLeft || 0));
		_y += el.offsetTop - ((window.pageYOffset || el.scrollTop) - (el.clientTop || 0));

		el = el.offsetParent;
	}
	_y += viewport.getScroll();

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
 * Polyfill
 * @private
 * @returns bool	True on every thing is set & done, false on something is in progress or wrong
 */
function polyfill () {
	if (settings.debug) console.groupCollapsed('photosMd.polyfill:')
	// PointerEvent POLYFILL - external script
	// Reference: https://github.com/jquery/PEP
	if (!window.PointerEvent) {
		if (settings.debug) console.log('Loading PointerEvent polyfill');
		let request = new Promise(function(resolve, reject) {
			let xhttp = new XMLHttpRequest();
			xhttp.open('GET', 'https://code.jquery.com/pep/0.4.2/pep.min.js');

			xhttp.onload = function() {
				if (xhttp.status == 200) {
					resolve(xhttp.response);
				} else {
					reject(Error(xhttp.statusText));
				}
			};
			xhttp.onerror = function() {
				reject(Error("Network Error"));
			};

			xhttp.send();
		});

		request.then(
			response => {
				let head = document.querySelector('head'),
					script = document.createElement('script'),
					code = document.createTextNode(response);

				script.appendChild(code);
				head.appendChild(script);

				if (settings.debug) console.groupEnd();
				init({});
			},
			error => {
				console.warn(`Error loading PEP: ${error}`);
				settings.pointer.enable = false;

				if (settings.debug) console.groupEnd();
				init({});
			}
		);

		return false;
	}

	if (settings.debug) console.groupEnd();
	return true;
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

	// polyfill
	if ((settings.pointer.enable && !window.PointerEvent) && !polyfill()) {
		//if (!polyfill()) {
		return;
		//}
	}

	// postpone proces if it is not fully loaded and calculated
	if (document.readyState !== 'complete') {
		if (settings.debug) console.info('Init delayed');

		window.addEventListener('load', function () {
			init({});
		}, false);

		return;
	}

	// test futures (history)
	if (typeof history !== 'undefined') {
		state.history = true;
    }

	// declare variables
	let section = document.querySelector(settings.id),
		dimmer = section.querySelector('.galerija-dimmer'),
		controler = section.querySelector('.galerija-controler');

	// register figures
	section.querySelectorAll('figure').forEach(el => {
		register(el);
	});

	// add event listners for control buttons in full view mode
	controler.querySelector('.galerija-controler .back').addEventListener('click', close, false);
	controler.querySelector('.galerija-controler .left').addEventListener('click', next, false);
	controler.querySelector('.galerija-controler .right').addEventListener('click', next, false);

	// add event listners for filter buttons
	section.querySelectorAll('.filter button[name="filter"], footer button[name="filter"][data-filter="all"]').forEach(
		btn => btn.addEventListener('click', filter, false)
	);

	// add event listner for keyboard
	document.addEventListener('keydown', keyevent, false);
	if (document.attachEvent)
		document.attachEvent('keydown', keyevent);

	// add event listner for resize or orientation change
	window.addEventListener('resize', resize, false);
	window.addEventListener('orientationchange', resize, false);

	// add pointer event listner
	if (settings.pointer.enable && window.PointerEvent) {
		if (settings.debug) console.info('Pointer event support.');
		document.querySelector('.galerija-arrows').addEventListener('pointerdown', pointerStart, false);
		document.querySelector('.galerija-arrows').addEventListener('pointerup', pointerEnd, false);
		document.querySelector('.galerija-arrows').addEventListener('pointerleave', pointerEnd, false);
	}

	// link blocker on figcaption>a clicks (SEO)
	document.querySelectorAll(`${settings.id} figcaption > a`).forEach(link => {
			link.addEventListener('click', e => {
				e.preventDefault();
				return false;
			}, false);
	});

	// open image from url
	if (window.location.search.search("(?:/\?|&)p=.+") > 0) {
		let search = window.location.search,
			src = decodeURIComponent('?' + search.slice(search.indexOf('p='), search.indexOf('.jpg') + 4)),
			toOpen = fig.find(el => {
				return el.history === src;
			});

		// if found, open it
		if (typeof toOpen !== 'undefined' ) {
			if (settings.debug) console.info('Url search match: ', toOpen.history);

			// SAFE: Dont open hidden image - dont show empty viewer!
			if (!(toOpen.element.getAttribute('hidden') == null)) {
				toOpen.element.removeAttribute('hidden');
				toOpen.element.offsetHeight;
				resize();
			}

			if (settings.id.search('#') >= 0)
				window.location.hash = settings.id;
			open({currentTarget: toOpen.element});
		}
	}

	if (settings.debug) {
		//console.info('Object photosMd: ', this);
		//console.profileEnd();
		console.groupEnd();
	}
}

/**
 * Register figures objects
 *
 * @param {Element} el	figure object from DOM
 * @returns {Object} 	**disabled** photosMd figure object {size, position, scale, translate,..}
 */
function register(el) {
	// get position
	let tmp = position(el),
		notRegistered = true;

	// calc scale
	tmp.scale = {
		'x': viewport.width / tmp.size.width,
		'y': viewport.height / tmp.size.height,
		'init': function () {
			this.min = this.x > this.y ? this.y : this.x;
			delete this.init;
			return this;
		}
	}.init();

	// get translation values
	tmp.translate = translate(tmp);

	// add reference to element and url history
	tmp.element = el;
	tmp.history = el.querySelector('figcaption > a').getAttribute('href');

	for (let i = 0; i < fig.length; i++) {
		if (fig[i].element === el) {
			notRegistered = false;
			fig[i] = tmp;
			break;
		}
	}

	if (notRegistered) {
		// bind event listner for open, only once (init)
		tmp.element.addEventListener('click', open, false);
		fig.push(tmp);
	}
	//return tmp;
}

export { settings, open, next, close, init, register }
