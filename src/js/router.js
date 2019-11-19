// ROUTER
// ==================================================
// Data to swap for metadata based on the route of the album
const meta_swaps = {
	'home': {
		'title': 'Bad Optics Collective',
		'description': 'Bad Optics is a sonic, visual, and interactive art collective formed by friends who met in Chicago.',
		'url': 'http://badoptics.co',
		'image-url': 'http://badoptics.co/static/img/bad-optics-sharing-logo.jpg',
		'image-width': 640,
		'image-height': 460,
	},
	'001': {
		'title': 'What Day Is Today - something soft',
		'description': 'A collection of tracks made from aug 13. to aug 19, 2018.',
		'url': 'http://badoptics.co/001.html',
		'image-url': 'http://badoptics.co/static/img/whatdayistoday-800x800.jpg',
		'image-width': 800,
		'image-height': 800,
	}
};

// Meta tag swapping
function swap_meta_tags(release) {
	if(!release) release = 'home';

	let metas = meta_swaps[release];
	if(!metas) {
		console.log('release meta-data not found for: '+release);
		metas = meta_swaps['home'];
	}

	// Set page metas
	document.title = metas['title'];
	$('meta[name="description"]').attr('content', metas['description']);
	// Set twitter card metas
	$('meta[name="twitter:title"]').attr('content', metas['title']);
	$('meta[name="twitter:description"]').attr('content', metas['description']);
	$('meta[name="twitter:image"]').attr('content', metas['image-url']);
	// Set opengraphs metas
	$('meta[property="og:title"]').attr('content', metas['title']);
	$('meta[property="og:description"]').attr('content', metas['description']);
	$('meta[property="og:url"]').attr('content', metas['url']);
	$('meta[property="og:image"]').attr('content', metas['image-url']);
	$('meta[property="og:image:width"]').attr('content', metas['image-width']);
	$('meta[property="og:image:height"]').attr('content', metas['image-height']);
}

// Function for opening and closing empty message box with details
function close_empty_message() { 
	$('.empty-message').removeClass('show');
}
function open_empty_message(media_type) {
	let empty_message = $('.empty-message');
	$(empty_message).removeClass('show');
	if(media_type !== '') {
		// Get div and span
		let empty_message_div = $('.empty-message div');
		let empty_message_span = $('.empty-message span');
		// Uninitialize to reset width
		$(empty_message).removeClass('initialized');
		$(empty_message_div).css('width', '');
		$(empty_message_span).css('width', '');
		// Set text
		$(empty_message_span).text('media-type [['+media_type+']] => not found');
		// Adjust width
		let span_rect = $(empty_message_span)[0].getBoundingClientRect();
		$(empty_message_div).css({
			'height': span_rect.height+'px',
			'width': (span_rect.width+1)+'px',
		})
		$(empty_message_span).css('width', span_rect.width+1+'px');
		// Re-initiailize
		$(empty_message).addClass('initialized');
	}
	setTimeout(() => $(empty_message).addClass('show'), 100);
}

// Aligning featured tile
function set_featured_header(showing_tiles, release_page=false) {
	// Get and empty featured tile div
	let featured_tile = $('#featuredTile');
	$(featured_tile).empty();
	if($(showing_tiles).length === 0)
		return;
	// Get and hide first showing tile
	let first_showing_tile = $(showing_tiles).first();
	$(first_showing_tile).hide();
	// Get first tile contents and append to featured tile
	let tile_content = $(first_showing_tile).find('.tile-content');
	$(featured_tile).append($(tile_content).clone());
	
	// If on a release page, add release-page class
	if(release_page) {
		$(featured_tile).addClass('release-page');
	}
	// Otherwise, add release page link to image
	else {
		$(featured_tile).removeClass('release-page');
		$(featured_tile).find('.tile-content-header-image').click(() => {
			let release_number = first_showing_tile.attr('id');
			router_pushState('','','/'+release_number+'.html');
		});
	}
}

// Filter route change handler
const main_fade_duration = 500;
let main_fade_timeout = null;
const crawl_speed = 200;
let cur_crawl_timeout;
let prev_route_word = null;

function route_change(route_path) {
	let route = /\/?[\w\d-]*(?=\.html)?/.exec(route_path)[0].toLowerCase();
	let route_word = route.length > 0 && route[0] === '/' ? route.substr(1) : route;
	let nav_choices = $('#mainNavWrapper .nav-choices').children('.choice-container');
	let container_id = '#' + route_word + 'ChoiceContainer';
	// Unselect any selected choices
	nav_choices.not(container_id).removeClass('selected');
	// Select proper choice
	let selected_choice_container = $(nav_choices).filter(container_id);
	$(selected_choice_container).addClass('selected');

	// Adjust css on under-line
	let underline = $('#mainNavUnderline');
	if($(selected_choice_container).length === 0) {
		underline.css('left', 0);
		underline.css('right', 0);
	}
	else {
		// Cancel current timeout crawl
		clearTimeout(cur_crawl_timeout);
		// Get new left and right values
		let nav_width = $('#mainNavWrapper')[0].getBoundingClientRect().width;
		let selected_span = $(selected_choice_container).children('span');
		let selected_position = $(selected_span).position();
		let selected_width = $(selected_span)[0].getBoundingClientRect().width;
		let left_val = selected_position.left;
		let right_val = nav_width - (left_val + selected_width);
		let cur_left = parseInt(underline.css('left'), 10);
		let cur_right = parseInt(underline.css('right'), 10);
		let left_val_perc = (left_val/nav_width)*100.0;
		let right_val_perc = (right_val/nav_width)*100.0;
		// If currently fully stretched, instantly focus on target
		if(cur_left === 0 && cur_right === 0) {
			underline.css('left', left_val_perc+'%');
			underline.css('right', right_val_perc+'%');
		}
		// Otherwise crawl towards it
		else {
			// Crawl right
			if(left_val > cur_left) {
				underline.css('right', right_val_perc+'%');
				cur_crawl_timeout = setTimeout(function() {
					underline.css('left', left_val_perc+'%');
				}, crawl_speed);
			}
			// Crawl left
			else {
				underline.css('left', left_val_perc+'%');
				cur_crawl_timeout = setTimeout(function() {
					underline.css('right', right_val_perc+'%');
				}, crawl_speed);
			}
		}
	}

	// Close drop-down box
	$('.tile').removeClass('show selected');

	// Perform action dependent on choice
	clearTimeout(main_fade_timeout);

	// Test for release-page routing
	let page_routed_tile = route_word.length > 0 ? $('.tile#'+route_word) : null;
	let release_routing = false;
	if($(page_routed_tile).length > 0) {
		release_routing = true;
		swap_meta_tags(route_word);
	}
	else {
		swap_meta_tags(); // Use 'home' meta
		
		// Test for filtering
		if(!(route_word === 'sonic' || route_word === 'visual' || route_word === 'interactive' || route_word === 'about')) {
			route_word = '';
		}
	}

	if(prev_route_word !== null && prev_route_word === route_word)
		return;
	else
		prev_route_word = route_word;

	let tile_class = '.'+route_word+'-tile';
	let tiles = $('#mainContent .tile');
	let release_tiles = $(tiles).filter('.release-tile');
	let about_tiles = $(tiles).filter('.about-tile');
	let matching_tiles = $(tiles).filter(tile_class);
	if(release_routing) {
		close_empty_message();
	}
	else if(route_word === '') {
		if($(tiles).length > 0)
			close_empty_message();
		else
			open_empty_message('all');
	}
	else {
		if($(matching_tiles).length > 0)
			close_empty_message();
		else
			open_empty_message(route_word);
	}

	let filter_tiles = function() {
		// Filter tiles
		if(release_routing) {
			$(tiles).hide();
		}
		else if(route_word === '') {
			$(about_tiles).hide();
			if($(release_tiles).length > 0) {
				$(release_tiles).show();
			}
		}
		else {
			$(tiles).not(tile_class).hide();
			if($(matching_tiles).length > 0) {
				$(matching_tiles).show();
			}
		}

		// Set featured tile
		if(release_routing) {
			set_featured_header(page_routed_tile, true);
		}
		else if(route_word === 'about') {
			// Clear featured header if on about page
			set_featured_header();
		}
		else {
			// Set the featured tile
			set_featured_header(route_word === '' ? release_tiles : matching_tiles);
		}

		set_tile_content_container_positions();
		$(main_content).removeClass('hidden');
	}

	let main_content = $('#mainContent');
	if(!main_fade_timeout && $(main_content).hasClass('hidden')) {
		filter_tiles();
		$(main_content).removeClass('hidden');
	}
	else {
		$(main_content).addClass('hidden');
		main_fade_timeout = setTimeout(() => {
			filter_tiles();
			main_fade_timeout = null;
		}, main_fade_duration);
	}
}

// history.pushState alternative that calls the proper router handlers
function router_pushState(state, title, route_path) {
	window.history.pushState(state, title, route_path);
	route_change(route_path)
}

// Pop state handler
$(window).on('popstate', function() {
	route_change(window.location.pathname);
})

/* ROUTER CLICK HANDLERS */
// Click handlers for nav header filters and logo
$('#logoWrapper a, #expressions').click(() => router_pushState('','','/'));
$('#sonicChoiceContainer').click(() => router_pushState('','','/sonic'));
$('#visualChoiceContainer').click(() => router_pushState('','','/visual'));
$('#interactiveChoiceContainer').click(() => router_pushState('','','/interactive'));
// About click handler
$('#aboutLink').click(() => router_pushState('','','/about'));
// Tile content header image handlers
$('.tile-content-header-image').click(function() {
	let tile = $(this).parents('.tile');
	let release_number = tile.attr('id');
	router_pushState('','','/'+release_number+'.html');
});


// INVERT SCRIPT
// ==================================================
$('#logoInvertSpot circle').bind('click', function() {
	$('html').toggleClass('invert');
});


// HEADER SCROLL ANIMATION
// ==================================================
// Lerp helper
function lerp(x, y, t) {
	if(t < 0) t = 0;
	else if(t > 1) t = 1;
	return x + (y-x)*t;
}

// Scroll Handler
let scroll_thresh = 76;
let initial_header_scale = 2;

$(window).scroll(function() {
	let y = window.scrollY;
	let crossed_thresh = $('html').hasClass('scroll-threshold'); 
	let logos = $('#logoWrapper');
	if(y < scroll_thresh) {
		$('html').removeClass('scroll-threshold');
		let transform_scale = 'scale('+lerp(initial_header_scale, 1.1, y/scroll_thresh)+')';
		$(logos).css({
			'-webkit-transform' : transform_scale,
		  	'-moz-transform'    : transform_scale,
		  	'-ms-transform'     : transform_scale,
		 	'-o-transform'      : transform_scale,
		 	'transform'         : transform_scale,
		});
	}
	else if(!$('html').hasClass('scroll-threshold')) {
		$('html').addClass('scroll-threshold');
		let transform_scale = 'scale(1.1)';
		$(logos).css({
			'-webkit-transform' : transform_scale,
		  	'-moz-transform'    : transform_scale,
		  	'-ms-transform'     : transform_scale,
		 	'-o-transform'      : transform_scale,
		 	'transform'         : transform_scale,
		});
	}
});