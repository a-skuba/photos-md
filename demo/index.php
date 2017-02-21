<!DOCTYPE html>
<!--
	Copyright (c) Anej Skubic | http://www.skuba-buba.com/
	Version: 1.0
-->
<html lang="en">
<head>
	<link rel="alternate" href="/index" hreflang="en" />
	<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />

	<title>Demo photos-md</title>

	<meta name="description" content="PhotosMd is material design image gallery plugin.">
	<meta name="keywords" content="photos, material, design, gallery, js, plugin">
	<meta name="author" content="Anej Skubic">

	<!-- Facebook Open Graph Metadata -->
	<meta property="og:title" content="Demo photos-md">
	<meta property="og:type" content="url">
	<meta property="og:image" content="/assets/photos-md-logo.png">
	<meta property="og:url" content="/index">

	<style>
		a { color: black; font-family: 'Open Sans'; text-decoration: none; }
	</style>
	<link href="assets/photos-md.css" type="text/css" rel="stylesheet">
	<script src="assets/photos-md.js"></script>
</head>
<body>
	<div hidden>
		<?= file_get_contents('assets/sprite.svg') ?>
	</div>
	<section id="galerija">
		<header>
			<h2>Gallery</h2>
			<div class="filter">
				<div>
					<button class="all active" name="filter" data-filter="all">All</button>
					<button name="filter" data-filter="sth1">Filter1</button>
					<button name="filter" data-filter="sth2">Filter2</button>
				</div>
			</div>
		</header>
		<div class="galerija-dimmer close"></div>
		<div class="galerija-controler close">
			<div class="galerija-header">
				<button type="button" class="back" aria-label="Back, return to grid view">
					<svg><use xlink:href="#back"></use></svg>
				</button>
			</div>
			<div class="galerija-arrows">
				<div>
					<svg class="left"><use xlink:href="#left"></use></svg>
				</div>
				<div>
					<svg class="right"><use xlink:href="#right"></use></svg>
				</div>
			</div>
		</div>
		<figure>
			<div><img src="http://www.skuba-buba.com/share/photos-md/assets/01.jpg" data-filter="all sth1" /></div>
			<figcaption><a rel="nofollow" rel="noreferrer" href="?p=01.jpg">Beautiful view</a></figcaption>
		</figure>
		<figure>
			<div><img src="http://www.skuba-buba.com/share/photos-md/assets/02.jpg" data-filter="all sth1" /></div>
			<figcaption><a rel="nofollow" rel="noreferrer" href="?p=02.jpg">City</a></figcaption>
		</figure>
		<figure>
			<div><img src="http://www.skuba-buba.com/share/photos-md/assets/03.jpg" data-filter="all sth1" /></div>
			<figcaption><a rel="nofollow" rel="noreferrer" href="?p=03.jpg">Lights</a></figcaption>
		</figure>
		<figure hidden="hidden">
			<div><img src="http://www.skuba-buba.com/share/photos-md/assets/04.jpg" data-filter="all sth1 sth2" /></div>
			<figcaption><a rel="nofollow" rel="noreferrer" href="?p=04.jpg">Beach</a></figcaption>
		</figure>
		<figure hidden="hidden">
			<div><img src="http://www.skuba-buba.com/share/photos-md/assets/05.jpg" data-filter="all sth2" /></div>
			<figcaption><a rel="nofollow" rel="noreferrer" href="?p=05.jpg">Mountains</a></figcaption>
		</figure>
		<figure hidden="hidden">
			<div><img src="http://www.skuba-buba.com/share/photos-md/assets/06.jpg" data-filter="all sth2" /></div>
			<figcaption><a rel="nofollow" rel="noreferrer" href="?p=06.jpg">Dude</a></figcaption>
		</figure>
		<figure hidden="hidden">
			<div><img src="http://www.skuba-buba.com/share/photos-md/assets/07.jpg" data-filter="all sth2" /></div>
			<figcaption><a rel="nofollow" rel="noreferrer" href="?p=07.jpg">Forest</a></figcaption>
		</figure>
		<footer>
			<button class="more" name="filter" data-filter="all">Prikaži vse slike..</button>
		</footer>
	</section>
	<script>
		photosMd.init({
			'id': '#galerija',
			'debug': <?= isset($_GET['debug']) ? 1 : 0 ?>,
			'preview': 0,
			'transition': 400
		});
	</script>
</body>
</html>
