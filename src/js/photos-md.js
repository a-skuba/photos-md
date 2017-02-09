// ==========================================================================
// photosMd
// photos-md.js v2.0
// https://github.com/anejskubic/photos-md
// License: The MIT License (MIT)
// ==========================================================================

var photosMd = {
	// SETTINGS
	'settings': {
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
						console.warn('photosMd.settings.merge: (Unvalid user-settings: ' + key + ')');
					} catch (e) { }
				}
			}

			if (this.debug) {
				console.info(this);
				console.groupEnd();
			}
		}
	},
	// VIEWPORT
	'viewport': {
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
	// FIGUREs
	'fig': [],
	// IMG cache
	'imgsBuffer': {
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
	// VIDEO
	'video': function (fig) {
		// further development
		if (this.settings.debug) {
			console.groupCollapsed('photosMd.video:');
			console.warn(fig);
			console.groupEnd();
		}
	},
	// FLAGS
	'flags': {
		'imgNextTransitionProgress': 0,
		//'imgGa': '',
		'touch': {
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

				return this;
			}
		}.init()
	},
	// IMG preview <-> full
	'src': function (slika) {
		if (this.settings.debug) console.groupCollapsed('photosMd.src:');
		// no preview settings
		if (!this.settings.preview) {
			if (this.settings.debug) {
				console.info('No preview images (settings).');
				console.groupEnd();
			}
			return slika.getAttribute('src');
		}

		// get src string
		var src = slika.getAttribute('src');
		if (this.settings.debug) console.info('Old: ' + src);

		// add it to buffer
		this.imgsBuffer.add(src);

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
		if (this.settings.debug) console.info('New: ' + src);

		// add to buffer
		this.imgsBuffer.add(src);

		if (this.settings.debug) console.groupEnd();
		return src;
	},
	// TRANSLATE Calc function
	'translate': function (el) {
		/* izračuna center slike in center viewporta, ter ju odšteje, nato pa doda še preostanek screena da je slika na sredini -- MYSTIC SHIT :P*/
		return {
			'x': (el.scale.y < el.scale.x ? (this.viewport.width - el.size.width * el.scale.min) / (2 * el.scale.min) : 0) - ((el.position.left + el.margin.left + el.size.width / 2 * (1 - el.scale.min)) / el.scale.min) + 1,
			'y': (el.scale.y > el.scale.x ? (this.viewport.height - el.size.height * el.scale.min) / (2 * el.scale.min) : 0) - ((el.position.top + el.margin.top + (el.size.height / 2) - (el.size.height / 2 * el.scale.min)) / el.scale.min) + 1
		};
	},
	// POSITION of figs
	'position': function (el) {
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
		_y += this.viewport.getScroll();
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
	},
	// OPEN full screen
	'open': function (e) {
		if (this.settings.debug) console.groupCollapsed('photosMd.open:');

		//console.warn(e.target);
		var element = e.target;
		while (element && !(element.tagName == 'FIGURE')) {
			element = element.parentNode;
		}
		//console.log(element);
		for (var i = 0; i < this.fig.length; i++) {
			if (element == this.fig[i].element) element = this.fig[i];
		}
		//console.log(element);

		element.element.style.width = element.size.width + 'px';

		var div = element.element.querySelector('div'),
			img = element.element.querySelector('img'),
			section = document.querySelector(this.settings.id),
			dimmer = section.querySelector('.galerija-dimmer'),
			controler = section.querySelector('.galerija-controler');
		//var arrows = controler.querySelector('.galerija-arrows');
		//var header = controler.querySelector('.galerija-header');

		var transform = 'scale(' + element.scale.min + ') translate(' + element.translate.x + 'px, ' + (element.translate.y + (this.viewport.getScroll() - this.viewport.scroll) / element.scale.min) + 'px)';
		if (this.settings.debug) {
			console.log(transform);
			console.log(element.translate.y, this.viewport.scroll, window.pageYOffset, element.scale.min);
		}

		dimmer.style.transition = 'opacity ' + this.settings.transition * 1.5 + 'ms ease-out';
		dimmer.style.opacity = 0;

		div.style.transition = 'transform ' + this.settings.transition + 'ms ease-out, opacity ' + this.settings.transition + 'ms ease-out';
		div.style.zIndex = 30;
		div.style.backgroundColor = 'rgba(0,0,0,.7)';

		if (this.settings.zoomMethode) {
			div.style.position = 'fixed';
			div.style.top = (element.position.top - this.viewport.getScroll() + this.viewport.scroll) + 'px';
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
			img.setAttribute('src', this.src(img));

		dimmer.classList.remove('close');
		dimmer.classList.add('open');
		dimmer.offsetHeight;
		dimmer.style.opacity = 1;
		controler.classList.remove('close');
		controler.classList.add('open');

		if (element.element.classList.contains('video'))
			this.video(element);

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
				eventValue: this.flags.imgGa
			});

		if (this.settings.debug) console.groupEnd();
	},
	// CLOSE full screnn
	'close': function () {
		if (this.settings.debug) console.groupCollapsed('photosMd.close:');

		if (this.flags.touch.disable) {
			if (this.settings.debug) console.groupEnd();
			return;
		}
		this.flags.touch.disable = 1;

		var element = document.querySelector('.zoom'),
			img = element.querySelector('img'),
			section = document.querySelector(this.settings.id),
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
		//div.style.transition = 'transform '+this.settings.transition+'ms ease-out, opacity '+this.settings.transition+'ms ease-out';

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
				img.setAttribute('src', this.src(img));
			dimmer.removeAttribute('style');
			this.flags.touch.disable = 0;
		}.bind(this), this.settings.transition);

		document.querySelector('html').classList.remove('lock');
		document.querySelector('body').classList.remove('lock');

		// url history
		var href = element.querySelector('figcaption > a').getAttribute('href'),
			url = (decodeURIComponent(window.location.pathname + window.location.search + window.location.hash)).replace(href, '');
		window.history.replaceState('', '', url);

		// GAnalytics
		if (typeof ga != 'undefined')
			ga('send', 'event', {
				eventCategory: 'photosMd',
				eventAction: 'Close',
				eventLabel: href,
				eventValue: this.flags.imgGa
			});

		if (this.settings.debug) console.groupEnd();
	},
	// NEXT
	'next': function (e) {
		if (this.settings.debug) console.groupCollapsed('photosMd.next:');

		if (this.flags.touch.disable) {
			if (this.settings.debug) console.groupEnd();
			return;
		}
		this.flags.touch.disable = 1;
		// determine direction
		var direction = 0;
		//console.log(e, this);
		if (this.settings.debug) console.info('Type of event/argument: ', typeof e);

		if ((typeof e === 'string' && e == 'left') || (typeof e === 'object' && e.target.classList.contains('icon-arrow-left'))) {
			if (this.settings.debug) console.info('Direction: Left');
			direction = -1;
		}
		else if ((typeof e === 'string' && e == 'right') || (typeof e === 'object' && e.target.classList.contains('icon-arrow-right'))) {
			if (this.settings.debug) console.info('Direction: Right');
			direction = 1;
		}
		else {
			console.warn('Direction: Something went wrong here');
			this.flags.touch.disable = 0;
			if (this.settings.debug) console.groupEnd();
			return;
		}

		// start searching for next div
		var section = document.querySelector(this.settings.id),
			figs = section.querySelector('.zoom').parentNode.querySelectorAll('figure');

		// get all visible figures (filter can hidde them)
		var visibleFigs = [];
		for (var i = 0; i < figs.length; i++) {
			if (this.fig[i].element.getAttribute('hidden') == null) {
				visibleFigs.push(figs[i]);
			}
		}

		// check if its possible to get further running
		if (figs.length < 2 || visibleFigs.length < 2) {
			if (this.settings.debug) console.info('No. of figs: Only one fig');
			this.flags.touch.disable = 0;
			if (this.settings.debug) console.groupEnd();
			return;
		}
		else {
			if (this.settings.debug) console.info('No. of figs: (Figs: ' + figs.length + ', visible Figs:' + visibleFigs.length + ')');
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
		while (this.fig[next].element.getAttribute('hidden') != null) {
			next += direction;
			if (next >= figs.length) { next = 0; }
			else if (next < 0) { next = figs.length - 1; }
		}

		if (this.settings.debug) {
			console.info('Current fig:' + curr);
			console.info('Next fig: ' + next, this.fig[next].element);
		}

		// fix figure width size
		this.fig[next].element.style.width = this.fig[next].size.width + 'px';

		// set some variables
		var nextDiv = this.fig[next].element.querySelector('div'),
			nextImg = this.fig[next].element.querySelector('img'),
			currDiv = this.fig[curr].element.querySelector('div'),
			currImg = this.fig[curr].element.querySelector('img');

		// calc translate path size
		var translateAnimation = (direction * this.viewport.width / 2 * 0.3);

		// calc first & final position
		var transformFirst = 'scale(' + this.fig[next].scale.min + ') translate(' + (this.fig[next].translate.x + translateAnimation) + 'px, ' + (this.fig[next].translate.y + (window.pageYOffset - this.viewport.scroll) / this.fig[next].scale.min) + 'px)',
			transform = 'scale(' + this.fig[next].scale.min + ') translate(' + this.fig[next].translate.x + 'px, ' + (this.fig[next].translate.y + (window.pageYOffset - this.viewport.scroll) / this.fig[next].scale.min) + 'px)';

		if (this.settings.debug) {
			console.info('1st transform: ' + transformFirst);
			console.info('2nd transform: ' + transform);
		}

		// prepare next div for transition, 0s tranistion
		nextDiv.style.transition = 'none !important';
		nextDiv.style.opacity = 0;
		nextDiv.style.position = 'fixed';
		nextDiv.style.zIndex = 30;
		nextDiv.style.backgroundColor = 'rgba(0,0,0,.7)';
		nextDiv.style.top = (this.fig[next].position.top - window.pageYOffset + this.viewport.scroll) + 'px';
		nextDiv.style.left = this.fig[next].position.left + 'px';
		nextDiv.style.height = this.fig[next].size.height + 'px';
		nextDiv.style.width = this.fig[next].size.width + 'px';
		nextDiv.style.transform = transformFirst;
		// Trigger a reflow, flushing the CSS changes, hack for transition
		nextDiv.offsetHeight;

		// change transition timing for animation
		nextDiv.style.transition = 'transform ' + this.settings.transition + 'ms ease-out, opacity ' + this.settings.transition + 'ms ease-out';

		if (!this.fig[next].element.classList.contains('video'))
			nextImg.setAttribute('src', this.src(nextImg));

		// replace transform->translateX value
		var currTranslateX = parseFloat((currDiv.style.transform).match(/[\s\S]+.translate\(([-\d.]+)px[\s\S]+/)[1]) - (translateAnimation),
			currTranslate = (currDiv.style.transform).replace(/translate\(([-\d.]+)px/g, 'translate(' + currTranslateX + 'px');
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
			if (!this.fig[curr].element.classList.contains('video'))
				currImg.setAttribute('src', this.src(currImg));
			currDiv.removeAttribute('style');
			this.fig[curr].element.removeAttribute('style');

			this.fig[curr].element.classList.remove('zoom');
			this.fig[next].element.classList.add('zoom');

			this.flags.touch.disable = 0;

			if (this.settings.debug) console.groupEnd();
		}.bind(this), this.settings.transition);

		// url history change
		var url = this.fig[next].element.querySelector('figcaption > a').getAttribute('href'),
			state = { url: url },
			title = url.substr(url.indexOf('=') + 1, url.indexOf('.'));
		window.history.pushState(state, title, url);

		// GAnalytics
		if (typeof ga != 'undefined')
			ga('send', 'event', {
				eventCategory: 'photosMd',
				eventAction: 'Next',
				eventLabel: url.replace('?p=', ''),
				eventValue: this.flags.imgGa
			});
	},
	// FILTER
	'filter': function (e) {
		if (this.settings.debug) console.groupCollapsed('photosMd.filter:');
		// dont execute on same filter
		if (e.target.classList.contains('active') && !e.target.classList.contains('more')) {
			if (this.settings.debug) console.groupEnd();
			return;
		}

		if (this.settings.debug) console.log(e.target);

		// get filter tag
		var filter = e.target.getAttribute('data-filter'),
			galerija = document.querySelector(this.settings.id),
			more = galerija.querySelector('button.more');

		// more button handling
		if (e.target.classList.contains('more') || more.getAttribute('hidden') === null) {
			//console.log('more');
			//var filtere.target.getAttribute('filter-data')
			more.setAttribute('hidden', true);
		}

		// set active filter button
		var active = e.target.parentNode.querySelector('button[name="filter"].active');
		if (active === null) {
			active = e.target.parentNode.querySelector('button[data-filter="all"]');
		}
		active.classList.remove('active');
		e.target.classList.add('active');

		// hide or show images
		var figs = galerija.querySelectorAll('figure');
		if (this.settings.debug) console.groupCollapsed('filter loop:');
		for (var i = 0; i < figs.length; i++) {
			// copy data-filter atribute to variable
			var set = figs[i].querySelector('img').getAttribute('data-filter');
			if (this.settings.debug) console.info('Data filter: ' + set);

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
				var galerija = document.querySelector(this.settings.id),
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
			}.bind(this), this.settings.transition / 2);
		}
		if (this.settings.debug) console.groupEnd();

		var timer2 = setTimeout(function () {
			clearTimeout(timer2);

			document.querySelector(this.settings.id).offsetHeight;
			this.resize();
		}.bind(this), this.settings.transition / 2);

		// GAnalytics
		if(typeof ga != 'undefined')
			ga('send', 'event', {
				eventCategory: 'photosMd',
				eventAction: 'Filter',
				eventLabel: filter
			});

		if (this.settings.debug) console.groupEnd();
	},
	// INIT
	'init': function (userSettings) {
		if (Object.keys(userSettings).length > 0) {
			if (userSettings.debug !== undefined && userSettings.debug) {
				console.group('photosMd.init:');
				//console.profile('photosMd.init');
			}
			this.settings.merge(userSettings);
		}

		// postpone proces if it is not fully loaded and calculated
		if (document.readyState !== 'complete') {
			if (this.settings.debug) {
				console.info('Init delayed');
				console.groupEnd();
			}

			window.addEventListener('load', function () {
				this.init({});
			}.bind(this), false);

			return;
		}

		// declare variables
		var section = document.querySelector(this.settings.id),
			dimmer = section.querySelector('.galerija-dimmer'),
			controler = section.querySelector('.galerija-controler'),
			figure = section.querySelectorAll('figure');

		// spin throug figures
		for (var i = 0; figure.length > i; i++) {
			// get position
			var tmpFig = this.position(figure[i]);

			// calc scale
			tmpFig.scale = {
				'x': this.viewport.width / (tmpFig.size.width),
				'y': this.viewport.height / (tmpFig.size.height),
				'init': function () {
					this.min = this.x > this.y ? this.y : this.x;
					delete this.init;
					return this;
				}
			}.init();

			// get translation values
			tmpFig.translate = this.translate(tmpFig);

			// add reference to element and url history
			tmpFig.element = figure[i];
			tmpFig.history = figure[i].querySelector('figcaption > a').getAttribute('href');

			// add to array
			this.fig.push(tmpFig);

			// bind event listner for open
			var evnt = this.open.bind(this);
			figure[i].addEventListener('click', evnt, false);
		}

		// add event listners for control buttons in full view mode
		controler.querySelector('.galerija-controler .icon-back').addEventListener('click', this.close.bind(this), false);
		controler.querySelector('.galerija-controler .icon-arrow-left').addEventListener('click', this.next.bind(this), false);
		controler.querySelector('.galerija-controler .icon-arrow-right').addEventListener('click', this.next.bind(this), false);

		// add event listners for filter buttons
		var filterBtns = section.querySelectorAll('.filter button[name="filter"], footer button[name="filter"][data-filter="all"]');
		for (var i = 0; i < filterBtns.length; i++) {
			filterBtns[i].addEventListener('click', this.filter.bind(this), false);
		}
		// add event listner for keyboard
		document.addEventListener('keydown', this.keyevent.bind(this), false);
		if (document.attachEvent)
			document.attachEvent('keydown', this.keyevent.bind(this));

		// add event listner for resize or orientation change
		window.addEventListener('resize', this.resize.bind(this), false);
		window.addEventListener('orientationchange', this.resize.bind(this), false);

		// add touch event listner
		if (this.settings.touch.enable) {
			document.querySelector('.galerija-arrows').addEventListener('touchstart', this.touchStart.bind(this), false);
			document.querySelector('.galerija-arrows').addEventListener('touchmove', this.touchMove.bind(this), false);
			document.querySelector('.galerija-arrows').addEventListener('touchend', this.touchEnd.bind(this), false);
		}

		// link blocker on figcaption>a clicks (SEO)
		var links = document.querySelectorAll('#galerija figcaption > a');
		for (var i = 0; i < links.length; ++i) {
			links[i].addEventListener('click', function (e) {
				e.preventDefault();
				return false;
			}.bind(this), false);
		}

		// open image from url
		if (window.location.search.search("(?:/\?|&)p=.+") > 0) {
			var search = window.location.search,
				src = decodeURIComponent('?' + search.slice(search.indexOf('p='), search.indexOf('.jpg') + 4));

			for (var j = 0; j < this.fig.length; j++) {
				if (this.fig[j].history == src) {
					if (this.settings.debug) console.info('Url search match: ', this.fig[j].history);

					// SAFE: Dont open hidden image - dont show empty viewer!
					if (!(this.fig[j].element.getAttribute('hidden') == null)) {
						this.fig[j].element.removeAttribute('hidden');
						this.fig[j].element.offsetHeight;
						this.resize();
					}

					if (this.settings.id.search('#') >= 0)
						window.location.hash = this.settings.id;

					this.open({ 'target': this.fig[j].element });
					break;
				}
			}
		}

		if (this.settings.debug) {
			console.info('Object photosMd: ', this);
			//console.profileEnd();
			console.groupEnd();
		}
	},
	// WINDOW RESIZE
	'resize': function () {
		if (this.settings.debug) {
			console.groupCollapsed('photosMd.resize:');
			//console.profile('photoMd.resize');
			//var start = new Date().getTime();
		}

		var section = document.querySelector(this.settings.id),
			figure = section.querySelectorAll('figure'),
			zoomed = section.querySelector('.zoom'),
			i = 0;

		this.viewport.init();

		for (i = 0; figure.length > i; i++) {
			// skip hidden elements
			if (!(figure[i].getAttribute('hidden') == null)) continue;

			var tmpFig = this.position(figure[i]);

			tmpFig.scale = {
				'x': this.viewport.width / (tmpFig.size.width),
				'y': this.viewport.height / (tmpFig.size.height),
				'init': function () {
					this.min = this.x > this.y ? this.y : this.x;
					delete this.init;
					return this;
				}
			}.init();

			tmpFig.translate = this.translate(tmpFig);
			tmpFig.element = figure[i];

			if (this.settings.debug) console.info(tmpFig.translate);
			this.fig[i] = tmpFig;
		}

		if (zoomed) {
			if (this.settings.debug) console.groupCollapsed('Zoomed:');

			for (var i = 0; this.fig.length > i; i++) {
				if (this.fig[i].element.classList.contains('zoom')) {

					var obj = this.fig[i];
					if (this.settings.debug) console.info(obj);

					break;
				}
			}

			var div = obj.element.querySelector('div');

			var transform = 'scale(' + obj.scale.min + ') translate(' + obj.translate.x + 'px, ' + (obj.translate.y + (window.pageYOffset - photosMd.viewport.scroll) / obj.scale.min) + 'px)';
			if (photosMd.settings.debug) {
				console.info(transform);
				console.info(obj.translate.y, photosMd.viewport.scroll, window.pageYOffset, obj.scale.min);
			}

			div.style.position = 'fixed';
			div.style.zIndex = 30;
			div.style.backgroundColor = 'rgba(0,0,0,.7)';
			div.style.top = (obj.position.top - window.pageYOffset + photosMd.viewport.scroll) + 'px';
			div.style.left = obj.position.left + 'px';
			div.style.height = obj.size.height + 'px';
			div.style.width = obj.size.width + 'px';
			div.style.transform = transform;

			if (this.settings.debug) console.groupEnd();
		}

		if (this.settings.debug) {
			console.groupEnd();
			//console.profileEnd();
			//var end = new Date().getTime();
			//var time = end - start;
			//console.warn('Execution time: ' + time);
		}
	},
	// WINDOW KEYEVNTS
	'keyevent': function (e) {
		if (this.settings.debug) console.groupCollapsed('photosMd.keyevent:');
		// disable multiple trigers
		if (this.flags.touch.disable) {
			if (this.settings.debug) console.groupEnd();
			return;
		}
		//this.flags.touch.disable = 1;

		// pass and test event object
		e = e || window.event;
		if (this.settings.debug) console.info('KEY: ', e.keyCode, e.key);
		if (e.keyCode != 27 && e.keyCode != 37 && e.keyCode != 39) {
			if (this.settings.debug) console.groupEnd();
			return;
		}

		// gallery buttons
		if (document.querySelector('.zoom') && !this.flags.imgNextTransitionProgress) {

			if (this.settings.debug) console.info('Working on keyevent');

			this.flags.imgNextTransitionProgress = 1;
			var timer = setTimeout(function () {
				clearTimeout(timer);
				this.flags.imgNextTransitionProgress = 0;
				if (this.settings.debug) console.info('Clear "imgNextTransitionProgress" flag');
				if (this.settings.debug) console.groupEnd();
			}.bind(this), this.settings.transition);

			// ESCAPE:	27
			// LEFT: 	37
			// RIGHT:	39
			if (e.keyCode == 27) {
				this.close();
				//if (this.settings.debug) console.groupEnd(); // ni potreben ker je timer zgoraj
				return;
			}
			else if (e.keyCode == 37) {
				this.next('left');
			}
			else if (e.keyCode == 39) {
				this.next('right');
			}
		}
		else {
			if (this.settings.debug) console.groupEnd();
		}
	},
	// TOUCH events
	'touchStart': function (e) {
		if (this.flags.touch.disable) {
			if (this.settings.debug) console.groupEnd();
			return;
		}
		//this.flags.touch.disable = 1;

		var t = e.touches[0];
		this.flags.touch.start.x = t.screenX;
		this.flags.touch.start.y = t.screenY;

		//this.flags.touch.disable = 0;
	},
	'touchMove': function (e) {
		if (this.flags.touch.disable) {
			if (this.settings.debug) console.groupEnd();
			return;
		}
		//this.flags.touch.disable = 1;

		e.preventDefault();
		var t = e.touches[0];
		this.flags.touch.end.x = t.screenX;
		this.flags.touch.end.y = t.screenY;

		//this.flags.touch.disable = 0;
		return false;
	},
	'touchEnd': function (e) {
		if (this.flags.touch.disable) {
			if (this.settings.debug) console.groupEnd();
			return;
		}
		//this.flags.touch.disable = 1;

		var startX = this.flags.touch.start.x,
			endX = this.flags.touch.end.x,
			startY = this.flags.touch.start.y,
			endY = this.flags.touch.end.y,
			tMinX = this.settings.touch.minX,
			tMaxX = this.settings.touch.maxX,
			tMinY = this.settings.touch.minY,
			tMaxY = this.settings.touch.maxY,
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
			this.next(direction);
		}
		else if (direction == 'down' /*|| direction == 'up'*/) {
			this.close();
		}

		direction = '';
		this.flags.touch.init();
		//this.flags.touch.disable = 0;
	}
}


/*photosMd.init({
	'id': '#galerija',
	'debug': 0,
	'transition': 400
});*/
