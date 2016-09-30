<?php

$imgs = array(
	array(
		'src'=> '/img/01.jpg',
		'alt'=> 'Zunanje senčilo pergola za letni vrt',
		'filter'=> 'all sth1',
		'h4'=> 'Pergola ClimaSol',
		'p'=> 'Pergola iz ALU konstrukcije in INOX spojev.'
	)
);


foreach($imgs as $img) {
	$link = $img['src'];
	$link = trim(substr($link, strrpos($link, '/')+1, strlen($link))); // pergola.jpg
	//$link = trim(substr($link, strrpos($link, '/')+1, strrpos($link, '.') - strlen($link))); //pergola

	echo
		'<figure>'.
			'<div><img src="'.$img['src'].'" alt="'.$img['alt'].'" data-filter="'.$img['filter'].'" data-link="'.$link.'"></div>'.
			'<figcaption>'.
				/*'<h4>'.$img['h4'].'</h4>'.*/
				/*'<p>'.$img['p'].'</p>'.*/
				'<a href="?p='.$link.'">'.$img['p'].'</a>'.
			'</figcaption>'.
		'</figure>';
}


/*
<figure>
	<img src="assets/img/pergola.jpg" alt="Zunanje senčilo pergola za letni vrt" data-filter="">
	<figcaption>
		<h4>Pergola ClimaSol</h4>
		<p>Pergola iz ALU konstrukcije in INOX spojev.</p>
	</figcaption>
</figure>
*/
?>
