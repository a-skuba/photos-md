var photosMd = {
// SETTINGS
	'settings': {
		'id': '#galerija',	// id for section
		'transition': 500,	// animation and transition duration
		'zoomMethode': 1,	// zoom methode: 1 - position: fixed, 2 - position: absolute
		'debug': 0,
		'touch': true,		// enable touch gestures
		'tMinX': 30,
		'tMaxX': 30,
		'tMinY': 50,
		'tMaxY': 60,
		'create': []		//
	},
// VIEWPORT
	'viewport': {
		'init': function () {
			var doc = document.documentElement;

			this.width = Math.max(doc.clientWidth, window.innerWidth || 0);
			this.height = Math.max(doc.clientHeight, window.innerHeight || 0);
			this.scroll = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

            return this;
        },
		'getScroll': function () {
			var doc = document.documentElement;
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

			if (src.search('/preview/') > 0) {
				var size = 'preview';
			}
			if (src.search('/full/') > 0) {
				var size = 'full';
			}

			var name = src.slice(src.lastIndexOf('/') + 1, src.length);
			if (!this[size].hasOwnProperty(name)) {
				var img = new Image();
				img.src = src;

				this[size][name] = img;
			}

			return this;
		}
	},
// FLAGS
	'flags': {
		'imgNextTransitionProgress': 0,
		//'clickE': '',
		'touch': {
			'disable': 0,
			'init': function () {
				//this.disable = 0;
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
		//'historyState': ''
		//'counter': 0
	},
// IMG preview <-> full
	'src': function (slika) {
		//var src = $(slika).find('img').prop('src');
		var src = slika.getAttribute('src');
		this.imgsBuffer.add(src);
		src = src.slice(src.search('/assets'));

		if (src.search('/preview/') > 0) {
			src = src.replace('preview', 'full');
		}
		else if (src.search('/full/') > 0) {
			src = src.replace('full', 'preview');
		}
		else {
			return 0;
		}

		if (this.settings.debug) console.log(src);
		this.imgsBuffer.add(src);
		return src;
	},
// MERGE settings
	'merge': function (userSettings) {
		// first merge debug, so logs can be done properly
		if (userSettings.hasOwnProperty('debug') && userSettings['debug'] == 1) {
			this.settings['debug'] = 1;
		}

		for (var key in userSettings) {
			if (userSettings.hasOwnProperty(key) && this.settings.hasOwnProperty(key)) {
				if (key == 'id' && userSettings.id.search('#') < 0) {
					console.warn('photos-md: (No # in ID)');
					break;
				}
				this.settings[key] = userSettings[key];
				if (this.settings.debug) console.log(key, ' merged');
			}
			else {
				try {
					console.warn('photos-md: (Unvalid user-settings: ', key, ')');
				}
				catch (e) { }
			}
		}

		//if (userSettings.hasOwnProperty('create')) {
		//	for (var i=0; i < userSettings.create.length; i++) {
		//		this.create(userSettings.create[i]);
		//	}
		//}

		if (this.settings.debug) console.log(this.settings);
	},
// TRANSLATE Calc function
	'translate': function (el) {
		/* izračuna center slike in center viewporta, ter ju odšteje, nato pa doda še preostanek screena da je slika na sredini -- MYSTIC SHIT :P*/
		return {
			'x': -((el.position.left + el.margin.left + el.size.width / 2 * (1 - el.scale.min))/el.scale.min) + (el.scale.y < el.scale.x ? (this.viewport.width - el.size.width * el.scale.min)/(2 * el.scale.min):0)+1,

			'y': (el.scale.y > el.scale.x ? (this.viewport.height - el.size.height * el.scale.min)/(2 * el.scale.min):0) - ((el.position.top + el.margin.top + (el.size.height / 2) - (el.size.height / 2 * el.scale.min))/el.scale.min)+1
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

		while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
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
		if (this.settings.debug) console.log(this);

		//console.warn(e.target);
		var element = e.target;
		while (element && !(element.tagName == 'FIGURE')) {
			element = element.parentNode;
		}
		//console.log(element);
		for (var i=0; i < this.fig.length; i++) {
			if (element == this.fig[i].element) {
				//console.log('found');
				element = this.fig[i];
			}
		}
		//console.log(element);

		element.element.style.width = element.size.width+'px';

		var div = element.element.querySelector('div'),
			img = element.element.querySelector('img'),
			section = document.getElementById(this.settings.id.replace('#', '')),
			dimmer = section.querySelector('.galerija-dimmer'),
			controler = section.querySelector('.galerija-controler');
		//var arrows = controler.querySelector('.galerija-arrows');
		//var header = controler.querySelector('.galerija-header');

		var transform = 'scale('+element.scale.min+') translate('+element.translate.x+'px, '+(element.translate.y + (this.viewport.getScroll() - this.viewport.scroll) / element.scale.min )+'px)';
		if (this.settings.debug) console.log(transform);
		if (this.settings.debug) console.log(element.translate.y, this.viewport.scroll, window.pageYOffset, element.scale.min);

		dimmer.style.transition = 'opacity '+this.settings.transition*1.5+'ms ease-out';
		dimmer.style.opacity = 0;

		div.style.transition = 'transform '+this.settings.transition+'ms ease-out, opacity '+this.settings.transition+'ms ease-out';
		div.style.zIndex = 30;
		div.style.backgroundColor = 'rgba(0,0,0,.7)';

		if (this.settings.zoomMethode) {
			div.style.position = 'fixed';
			div.style.top = (element.position.top - this.viewport.getScroll() + this.viewport.scroll)+'px';
			div.style.left = element.position.left+'px';
		}
		else {
			element.element.style.position = 'relative';
			element.element.style.overflow = 'visible';
			div.style.position = 'absolute';
			div.style.top = 0;
			div.style.left = 0;
		}

		div.style.height = element.size.height+'px';
		div.style.width = element.size.width+'px';
		div.style.transform = transform;

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
			state = {url: url},
			title = url.substr(url.indexOf('=')+1, url.indexOf('.'));
		window.history.replaceState(state, title, url);
		//console.log(state, title, url);
	},
// CLOSE full screnn
	'close': function () {
		if (this.flags.touch.disable) return;
		this.flags.touch.disable = 1;

		var element = document.querySelector('.zoom');

		var img = element.querySelector('img');
		var section = document.querySelector(this.settings.id);
		var dimmer = section.querySelector('.galerija-dimmer');
		var controler = section.querySelector('.galerija-controler');
		var div = document.querySelector('.zoom > div');
		var figcaption = document.querySelector('.zoom figcaption');

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
		var url = (window.location.pathname + window.location.search + window.location.hash).replace(element.querySelector('figcaption > a').getAttribute('href'), '');
		window.history.replaceState('', '', url);
	},
// NEXT
	'next': function (e) {
		if (this.flags.touch.disable) return;
		this.flags.touch.disable = 1;
	// determine direction
		var direction = 0;
		//console.log(e, this);
		if(this.settings.debug) console.log(typeof e);

		if ((typeof e === 'string' && e == 'left') || (typeof e === 'object' && e.target.classList.contains('icon-arrow-left'))) {
			if (this.settings.debug) console.log('photosMd.next: (Direction: Left)');
			direction = -1;
		}
		else if ((typeof e === 'string' && e == 'right') || (typeof e === 'object' && e.target.classList.contains('icon-arrow-right'))) {
			if (this.settings.debug) console.log('photosMd.next: (Direction: Right)');
			direction = 1;
		}
		else {
			console.warn('photosMd.next: (Direction: Something went wrong here)');
			this.flags.touch.disable = 0;
			return;
		}

	// start searching for next div
		var section = document.querySelector(this.settings.id);
		var figs = section.querySelector('.zoom').parentNode.querySelectorAll('figure');

	// get all visible figures (filter can hidde them)
		var visibleFigs = [];
		for (var i=0; i < figs.length; i++) {
			if (this.fig[i].element.getAttribute('hidden') == null) {
				visibleFigs.push(figs[i]);
			}
		}

	// check if its possible to get further running
		if (figs.length < 2 || visibleFigs.length < 2) {
			if (this.settings.debug) console.log('photosMd.next: (Next fig: Only one fig)');
			this.flags.touch.disable = 0;
			return;
		}
		else {
			if (this.settings.debug) console.log('photosMd.next: (Next fig, no.: Figs: '+figs.length+', visible Figs:'+visibleFigs.length+')');
		}

	// get current and next div serial number
		for (var i=0; i < figs.length; i++) {
			if (figs[i].classList.contains('zoom')) {
				var next = i + direction;
				var curr = i;

				if (next >= figs.length) { next = 0; }
				else if (next < 0) { next = figs.length - 1; }

				//next++;
				//curr++;
			}
		}

	// check if next div is vissible and shift next till visible div
		while (this.fig[next].element.getAttribute('hidden') != null) {
			next+=direction;
			if (next >= figs.length) { next = 0; }
			else if (next < 0) { next = figs.length - 1; }
		}

	// fix figure width size
		this.fig[next].element.style.width = this.fig[next].size.width+'px';

	// set some variables
		var nextDiv = this.fig[next].element.querySelector('div'),
			nextImg = this.fig[next].element.querySelector('img'),
			currDiv = this.fig[curr].element.querySelector('div'),
			currImg = this.fig[curr].element.querySelector('img');

		if(this.settings.debug) console.log('photosMd.next: (Next fig: '+next+', '+this.fig[next].element+')');

	// calc translate path size
		var translateAnimation = (direction * this.viewport.width/2 * 0.3);
		//if(this.settings.debug) console.log(translateAnimation);

	// calc first position
		var transformFirst = 'scale('+this.fig[next].scale.min+') translate('+(this.fig[next].translate.x + translateAnimation)+'px, '+(this.fig[next].translate.y + (window.pageYOffset - this.viewport.scroll) / this.fig[next].scale.min )+'px)';
		if(this.settings.debug) console.log('photosMd.next: (1st transform:'+transformFirst+')');
	// calc finnal positin
		var transform = 'scale('+this.fig[next].scale.min+') translate('+this.fig[next].translate.x+'px, '+(this.fig[next].translate.y + (window.pageYOffset - this.viewport.scroll) / this.fig[next].scale.min )+'px)';
		if (this.settings.debug) console.log('photosMd.next: (transform: '+transform+')');

	// prepare next div for transition, 0s tranistion
		nextDiv.style.transition = 'none !important';
		nextDiv.style.opacity = 0;
		nextDiv.style.position = 'fixed';
		nextDiv.style.zIndex = 30;
		nextDiv.style.backgroundColor = 'rgba(0,0,0,.7)';
		nextDiv.style.top = (this.fig[next].position.top - window.pageYOffset + this.viewport.scroll)+'px';
		nextDiv.style.left = this.fig[next].position.left+'px';
		nextDiv.style.height = this.fig[next].size.height+'px';
		nextDiv.style.width = this.fig[next].size.width+'px';
		nextDiv.style.transform = transformFirst;
	// Trigger a reflow, flushing the CSS changes, hack for transition
		nextDiv.offsetHeight;

	// change transition timing for animation
		nextDiv.style.transition = 'transform '+this.settings.transition+'ms ease-out, opacity '+this.settings.transition+'ms ease-out';

		if (!this.fig[next].element.classList.contains('video'))
			nextImg.setAttribute('src', this.src(nextImg));

	// replace transform->translateX value
		var currTranslateX = parseFloat((currDiv.style.transform).match(/[\s\S]+.translate\(([-\d.]+)px[\s\S]+/)[1]) - (translateAnimation);
		var currTranslate = (currDiv.style.transform).replace(/translate\(([-\d.]+)px/g, 'translate('+currTranslateX+'px');
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
		}.bind(this), this.settings.transition);

	// url history change
		var url = this.fig[next].element.querySelector('figcaption > a').getAttribute('href');
		var state = {url: url};
		var title = url.substr(url.indexOf('=')+1, url.indexOf('.'));
		window.history.pushState(state, title, url);
	},
// FILTER
	'filter': function (e) {
	// dont execute on same filter
		if (e.target.classList.contains('active') && !e.target.classList.contains('more')) return;

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

	// fix height of gallery
		if (filter != 'all') {
			var he = window.getComputedStyle(galerija, null)['height'];
			//galerija.style.height = he;
			galerija.style.minHeight = he;
		}
		else {
			var he = window.getComputedStyle(galerija, null)['height'];
			//galerija.style.height = he;
			galerija.style.minHeight = he;
		}

	// set active filter button
		var active = e.target.parentNode.querySelector('button[name="filter"].active');
		if (active === null) {
			var active = e.target.parentNode.querySelector('button[data-filter="all"]');
		}
		active.classList.remove('active');
		e.target.classList.add('active');

	// hide or show images
		var figs = galerija.querySelectorAll('figure');
		for (var i=0; i < figs.length; i++) {
			var set = figs[i].querySelector('img').getAttribute('data-filter');
			//console.log(set);
			if (set.indexOf(filter) === -1) {
				figs[i].classList.add('hide');
				figs[i].classList.remove('show');
			}
			else {
				figs[i].classList.add('show');
				figs[i].classList.remove('hide');
			}

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

				this.resize();
			}.bind(this), this.settings.transition/2);
		}
		//galerija.offsetHeight; // Trigger repaint

		//this.resize();
	},
// INIT
	'init': function (userSettings) {
		//console.log('INIT');
		this.merge(userSettings);
		//if (this.settings.debug) console.log('SETTINGS: ', this.settings);
		var section = document.querySelector(this.settings.id),
			dimmer = section.querySelector('.galerija-dimmer'),
			controler = section.querySelector('.galerija-controler'),
			figure = section.querySelectorAll('figure');

		for (var i = 0; figure.length > i; i++) {

			if (figure[i].clientHeight <= 10 && figure[i].clientWidth <= 10 && (figure[i].getAttribute('hidden') == 'undefined')) {
				var initTimer = setTimeout( function () {
					clearTimeout(initTimer);
					console.warn('Init delay');
					this.init({});
				}.bind(this), 500);
			}
			//figure[i].offsetHeight;
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
			//if (this.settings.debug) console.log(tmpFig.translate);

			tmpFig.element = figure[i];
			tmpFig.history = figure[i].querySelector('figcaption > a').getAttribute('href');

			this.fig.push(tmpFig);

			//this.flags.clickE = this.open.bind(this);
			var evnt = this.open.bind(this);
			figure[i].addEventListener('click', evnt, false);
		}

		controler.querySelector('.galerija-controler .icon-back').addEventListener('click', this.close.bind(this), false);
		controler.querySelector('.galerija-controler .icon-arrow-left').addEventListener('click', this.next.bind(this), false);
		controler.querySelector('.galerija-controler .icon-arrow-right').addEventListener('click', this.next.bind(this), false);

	// filter buttons eventlistner
		var filterBtns = section.querySelectorAll('.filter button[name="filter"], footer button[name="filter"][data-filter="all"]');
		for (var i=0; i < filterBtns.length; i++) {
			filterBtns[i].addEventListener('click', this.filter.bind(this), false);
		}

		document.addEventListener('keydown', this.keyevent.bind(this), false);
		if (document.attachEvent)
			document.attachEvent('keydown', this.keyevent.bind(this));

		window.addEventListener('resize', this.resize.bind(this), false);
		window.addEventListener('orientationchange', this.resize.bind(this), false);

	// touch event listner
		document.querySelector('.galerija-arrows').addEventListener('touchstart', this.touchStart.bind(this), false);
		document.querySelector('.galerija-arrows').addEventListener('touchmove', this.touchMove.bind(this), false);
		document.querySelector('.galerija-arrows').addEventListener('touchend', this.touchEnd.bind(this), false);

		//console.log(links);
		var links = document.querySelectorAll('#galerija figcaption > a');

	// link blocker
		for (var i = 0; i < links.length; ++i) {
			links[i].addEventListener('click', function (e) {
				e.preventDefault();

				//console.log('SEO break link', e.target);

				//this.flags.historyState = window.history.state;
				var url = e.target.getAttribute('href')+this.settings.id;
				var state = {img: url.substr(url.indexOf('=')+1, url.length)};
				var title = state.img.substr(0, state.img.indexOf('.'));
				window.history.replaceState(state, title, url);

				//console.log(state, title, url);
				//console.log('state: ', window.history.state);

				return false;
			}.bind(this), false);
		}

	// url search handler
		for (var j = 0; j < this.fig.length; j++) {
			//console.log(window.location.search, j);
			//console.log(this.fig[j].history);

			if (this.fig[j].history == window.location.search) {
				if (this.settings.debug) console.log('match: ', this.fig[j].history);

				//this.flags.counter = j;
				window.location.hash = this.settings.id;

				//setTimeout(this.open.bind(this, this.fig[j]), 0);

				this.open({'target': this.fig[j].element}); //.bind(this);
				//window.addEventListener('load', this.open.bind(this.fig[j]), false);
				break;
			}
		}

		if (this.settings.debug) console.log('photosMd.init: (created obj: ', this, ')');
	},
// WINDOW RESIZE
	'resize': function () {
		//var start = new Date().getTime();
		//console.log('RESIZE');
		var section = document.querySelector(this.settings.id),
			figure = section.querySelectorAll('figure'),
			zoomed = section.querySelector('.zoom'),
			i = 0;
		//if (this.settings.debug) console.log('FIGURE: ', figure);

		this.viewport.init();

		//this.fig.splice(0,this.fig.length);
		for (i = 0; figure.length > i; i++) {
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
			if (this.settings.debug) console.log(tmpFig.translate);

			/*-((tmpFig.position.top + tmpFig.margin.top + tmpFig.size.height / 2 * (1 - tmpFig.scale.min))/tmpFig.scale.min)*/

			tmpFig.element = figure[i];

			this.fig[i] = tmpFig;

			//var f = this.open.bind(this);
			//figure[i].removeEventListener('click', this.flags.clickE, false);
			//figure[i].addEventListener('click', f, false);
		}
		//console.log(this.fig);

		//var zoomed = section.querySelector('.zoom');
		if (zoomed) {
			//if (this.settings.debug) console.log('one is zoomed');

			//var div = zoomed.querySelector('div');
			//console.log(this.fig);
			for (var i = 0; this.fig.length > i; i++) {
				if(this.fig[i].element.classList.contains('zoom')) {
					//var figure = this.fig[i].element;
					var obj = this.fig[i];
				}
			}
			var div = obj.element.querySelector('div');

			var transform = 'scale('+obj.scale.min+') translate('+obj.translate.x+'px, '+(obj.translate.y + (window.pageYOffset - photosMd.viewport.scroll) / obj.scale.min )+'px)';
			if (photosMd.settings.debug) console.log(transform);
			if (photosMd.settings.debug) console.log(obj.translate.y, photosMd.viewport.scroll, window.pageYOffset, obj.scale.min);

			div.style.position = 'fixed';
			div.style.zIndex = 30;
			div.style.backgroundColor = 'rgba(0,0,0,.7)';
			div.style.top = (obj.position.top - window.pageYOffset + photosMd.viewport.scroll)+'px';
			div.style.left = obj.position.left+'px';
			div.style.height = obj.size.height+'px';
			div.style.width = obj.size.width+'px';
			div.style.transform = transform;
		}

		//var end = new Date().getTime();
		//var time = end - start;
		//console.warn('Execution time: ' + time);
	},
// WINDOW KEYEVNTS
	'keyevent': function (e) {
		if (this.flags.touch.disable) return;
		//this.flags.touch.disable = 1;

		e = e || window.event;
		if (this.settings.debug) console.log('KEY: ', e.keyCode, e.key);

		if (e.keyCode != 27 && e.keyCode != 37 && e.keyCode != 39) {
			return;
		}
		// gallery buttons
		if (document.querySelector('.zoom') && !this.flags.imgNextTransitionProgress) {
			this.flags.imgNextTransitionProgress = 1;
			var timer = setTimeout(function () {
				clearTimeout(timer);
				this.flags.imgNextTransitionProgress = 0;
				if(this.settings.debug) console.log('clear flag');
			}.bind(this), this.settings.transition);

		// ESCAPE:	27
		// LEFT: 	37
		// RIGHT:	39
			if (e.keyCode == 27) {
				this.close();
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
			//console.log('Not opened');
		}
		//this.flags.touch.disable = 0;
	},
// TOUCH events
	'touchStart': function (e) {
		if (this.flags.touch.disable) return;
		//this.flags.touch.disable = 1;

		var t = e.touches[0];
		this.flags.touch.start.x = t.screenX;
		this.flags.touch.start.y = t.screenY;

		//this.flags.touch.disable = 0;
	},
	'touchMove': function (e) {
		if (this.flags.touch.disable) return;
		//this.flags.touch.disable = 1;

		e.preventDefault();
		var t = e.touches[0];
		this.flags.touch.end.x = t.screenX;
		this.flags.touch.end.y = t.screenY;

		//this.flags.touch.disable = 0;
		return false;
	},
	'touchEnd': function (e) {
		if (this.flags.touch.disable) return;
		//this.flags.touch.disable = 1;

		var startX = this.flags.touch.start.x;
		var endX = this.flags.touch.end.x;

		var startY = this.flags.touch.start.y;
		var endY = this.flags.touch.end.y;

		var tMinX = this.settings.tMinX;
		var tMaxX = this.settings.tMaxX;
		var tMinY = this.settings.tMinY;
		var tMaxY = this.settings.tMaxY;

		var direction = '';

		//horizontal detection
		if ((((endX - tMinX > startX) || (endX + tMinX < startX)) && ((endY < startY + tMaxY) && (startY > endY - tMaxY) && (endX > 0)))) {
		  if(endX > startX) direction = 'left';
		  else direction = 'right';
		}
		//vertical detection
		else if ((((endY - tMinY > startY) || (endY + tMinY < startY)) && ((endX < startX + tMaxX) && (startX > endX - tMaxX) && (endY > 0)))) {
			if(endY > startY) direction = 'down';
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
